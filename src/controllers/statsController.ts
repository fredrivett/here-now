import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { isDomainAllowed, ACTIVITY_THRESHOLD_MS } from "../lib/constants.js";
import { QueryResult } from "../types/index.js";
import {
  getCachedStats,
  beginStatsQuery,
  completeStatsQuery,
  abortStatsQuery,
} from "../lib/statsCache.js";

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
    const cached = getCachedStats(domain, path);
    if (cached) {
      return res.json(cached);
    }

    // Register this query as in flight so a visit tracked while it runs
    // cancels the write-back of its now-stale result.
    const queryToken = beginStatsQuery(domain, path);

    try {
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

      // Cache the result (skipped if a visit was tracked while this query ran,
      // so we never cache a count taken before that visit).
      completeStatsQuery(domain, path, queryToken, result);

      res.json(result);
    } catch (queryError) {
      // Stop tracking the in-flight query before the outer handler responds.
      abortStatsQuery(domain, path, queryToken);
      throw queryError;
    }
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
