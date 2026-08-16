import { StatsResult } from "../types/index.js";

// Simple in-memory cache to reduce database load, shared by the stats and
// track controllers so neither reaches into the other's internals.
const CACHE_TTL = 30 * 1000; // 30 seconds cache

interface CacheEntry {
  data: StatsResult;
  timestamp: number;
}

const statsCache = new Map<string, CacheEntry>();

// Tokens for stats queries that are currently in flight, grouped by key.
// invalidateStats poisons every in-flight token for a key so a query that
// started before the invalidation cannot cache its stale (pre-visit) result.
// Unlike a per-key generation counter, this map only holds entries while
// queries are actually running and is pruned the moment a key's set empties,
// so it stays bounded no matter how many distinct paths are ever seen.
interface QueryToken {
  poisoned: boolean;
}
const inFlightQueries = new Map<string, Set<QueryToken>>();

// Collision-free key: JSON-encoding the tuple means a delimiter character (or
// any other character) inside domain or path can't make two different pairs
// collapse to the same key.
function cacheKey(domain: string, path: string): string {
  return JSON.stringify([domain, path]);
}

// Return a fresh (non-expired) cached result, or null on miss/stale.
export function getCachedStats(domain: string, path: string): StatsResult | null {
  const entry = statsCache.get(cacheKey(domain, path));
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  return null;
}

// Register a stats query as in flight. Pass the returned token to
// completeStatsQuery (on success) or abortStatsQuery (on failure) so it stops
// being tracked and the map entry can be reclaimed.
export function beginStatsQuery(domain: string, path: string): QueryToken {
  const key = cacheKey(domain, path);
  const token: QueryToken = { poisoned: false };
  let set = inFlightQueries.get(key);
  if (!set) {
    set = new Set();
    inFlightQueries.set(key, set);
  }
  set.add(token);
  return token;
}

// Stop tracking a token, pruning the key's set once it is empty so the map
// never accumulates entries for idle paths.
function releaseToken(key: string, token: QueryToken): void {
  const set = inFlightQueries.get(key);
  if (!set) return;
  set.delete(token);
  if (set.size === 0) {
    inFlightQueries.delete(key);
  }
}

// Finish a successful query: cache the result unless the query was poisoned by
// an invalidation while it was in flight (its count may predate the visit).
export function completeStatsQuery(
  domain: string,
  path: string,
  token: QueryToken,
  data: StatsResult,
): void {
  const key = cacheKey(domain, path);
  releaseToken(key, token);
  if (token.poisoned) {
    return; // an invalidation raced this query — don't cache the stale result
  }

  statsCache.set(key, { data, timestamp: Date.now() });

  // Clean up old cache entries periodically
  if (statsCache.size > 100) {
    const cutoff = Date.now() - CACHE_TTL * 2;
    for (const [k, value] of statsCache.entries()) {
      if (value.timestamp < cutoff) {
        statsCache.delete(k);
      }
    }
  }
}

// Finish a failed query: just stop tracking the token, caching nothing.
export function abortStatsQuery(
  domain: string,
  path: string,
  token: QueryToken,
): void {
  releaseToken(cacheKey(domain, path), token);
}

// Invalidate the cached stats for a domain/path so the next read is live.
// Called after a visit is tracked, otherwise a stale snapshot (taken before
// the new visit) can hide the visitor and show a count of 0. Poisoning any
// in-flight queries also cancels their write-back.
export function invalidateStats(domain: string, path: string): void {
  const key = cacheKey(domain, path);
  statsCache.delete(key);
  const set = inFlightQueries.get(key);
  if (set) {
    for (const token of set) {
      token.poisoned = true;
    }
  }
}
