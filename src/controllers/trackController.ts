import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { isDomainAllowed } from "../lib/constants.js";
import { v4 as uuidv4 } from "uuid";
import { TrackingRequest } from "../types/index.js";

export const trackController = async (req: Request, res: Response) => {
  try {
    const { domain, path, user_id, session_id }: TrackingRequest = req.body;

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

    const userAgent = req.headers["user-agent"] || "";

    // Insert tracking event
    const event = await prisma.pageEvent.create({
      data: {
        domain,
        path,
        userId: user_id || uuidv4(),
        sessionId: session_id || uuidv4(),
        userAgent,
      },
    });

    res.json({ success: true, event_id: event.id });
  } catch (error) {
    console.error("Tracking error:", error);
    res.status(500).json({
      error: "Failed to track event",
    });
  }
};
