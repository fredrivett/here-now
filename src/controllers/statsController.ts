import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { isDomainAllowed, ACTIVITY_THRESHOLD_MS } from "../lib/constants.js";
import { StatsResult, QueryResult } from "../types/index.js";

// Simple in-memory cache to reduce database load
const statsCache = new Map<string, { data: StatsResult; timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds cache

export const statsController = async (req: Request, res: Response) => {
  const domain = req.query.domain as string;
  const path = req.query.path as string;

  try {
    // Validate required parameters
    if (!domain) {
      return res.status(400).json({
        error: "Missing required parameter: domain",
      });
    }

    if (!path) {
      return res.status(400).json({
        error: "Missing required parameter: path",
      });
    }

    // Check domain whitelist
    if (!isDomainAllowed(domain)) {
      return res.status(403).json({
        error: "Domain not allowed",
      });
    }

    // Check cache first to reduce database load
    const cacheKey = `${domain}:${path}`;
    const cached = statsCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    // Use single raw SQL query for maximum performance with large datasets
    const activityThresholdAgo = new Date(Date.now() - ACTIVITY_THRESHOLD_MS);

    // Get both counts in a single query to reduce database load and connection usage
    const queryResult = await prisma.$queryRaw`
      SELECT 
        COUNT(DISTINCT user_id) as here_count,
        COUNT(DISTINCT CASE WHEN timestamp >= ${activityThresholdAgo} THEN user_id END) as now_count
      FROM page_events 
      WHERE domain = ${domain} AND path = ${path}
    `;

    const queryData = (queryResult as QueryResult[])[0];
    const here = Number(queryData?.here_count || 0);
    const nowCount = Number(queryData?.now_count || 0);

    const result = {
      here,
      now: nowCount,
      domain,
      path,
    };

    // Cache the result to reduce database load
    statsCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    // Clean up old cache entries periodically
    if (statsCache.size > 100) {
      const cutoff = Date.now() - CACHE_TTL * 2;
      for (const [key, value] of statsCache.entries()) {
        if (value.timestamp < cutoff) {
          statsCache.delete(key);
        }
      }
    }

    res.json(result);
  } catch (error) {
    console.error("Stats error details:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : error);
    console.error("Domain:", domain, "Path:", path);
    res.status(500).json({
      error: "Failed to get stats",
      details: error instanceof Error ? error.message : String(error),
      domain,
      path,
    });
  }
};
