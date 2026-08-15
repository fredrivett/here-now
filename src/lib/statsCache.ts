import { StatsResult } from "../types/index.js";

// Simple in-memory cache to reduce database load, shared by the stats and
// track controllers so neither reaches into the other's internals.
const CACHE_TTL = 30 * 1000; // 30 seconds cache

interface CacheEntry {
  data: StatsResult;
  timestamp: number;
}

const statsCache = new Map<string, CacheEntry>();

// Per-key generation counter, bumped on every invalidation. A stats query
// captures the generation before it runs and only writes its result back if
// the generation is unchanged. This closes the race where an in-flight,
// pre-visit query would otherwise repopulate a key that /api/track just
// invalidated, causing the widget's next read to still see the stale count.
const generations = new Map<string, number>();

function cacheKey(domain: string, path: string): string {
  return `${domain}:${path}`;
}

// Snapshot the current generation for a key. Callers pass this back to
// setCachedStats so a racing invalidation can be detected.
export function currentGeneration(domain: string, path: string): number {
  return generations.get(cacheKey(domain, path)) ?? 0;
}

// Return a fresh (non-expired) cached result, or null on miss/stale.
export function getCachedStats(domain: string, path: string): StatsResult | null {
  const entry = statsCache.get(cacheKey(domain, path));
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  return null;
}

// Store a freshly computed result, unless an invalidation happened while the
// query was in flight (generation changed), in which case the result may
// predate a just-tracked visit and must not be cached.
export function setCachedStats(
  domain: string,
  path: string,
  data: StatsResult,
  generationAtQueryStart: number,
): void {
  const key = cacheKey(domain, path);
  if ((generations.get(key) ?? 0) !== generationAtQueryStart) {
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

// Invalidate the cached stats for a domain/path so the next read is live.
// Called after a visit is tracked, otherwise a stale snapshot (taken before
// the new visit) can hide the visitor and show a count of 0. Bumping the
// generation also cancels the write-back of any query already in flight.
export function invalidateStats(domain: string, path: string): void {
  const key = cacheKey(domain, path);
  statsCache.delete(key);
  generations.set(key, (generations.get(key) ?? 0) + 1);
}
