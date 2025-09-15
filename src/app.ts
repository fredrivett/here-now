import express from "express";
import { trackRoute } from "./routes/track.js";
import { statsRoute } from "./routes/stats.js";
import { widgetRoute } from "./routes/widget.js";
import { corsMiddleware } from "./middleware/cors.js";

export const createApp = () => {
  const app = express();

  // Middleware
  app.use(corsMiddleware);
  app.use(express.json());

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "here-now-api" });
  });

  // API routes
  app.use("/api/track", trackRoute);
  app.use("/api/stats", statsRoute);
  app.use("/widget.js", widgetRoute);

  // Root endpoint info
  app.get("/", (req, res) => {
    res.json({
      name: "here/now analytics API",
      version: "1.0.0",
      endpoints: {
        track: "POST /api/track",
        stats: "GET /api/stats",
        widget: "GET /widget.js",
        health: "GET /health",
      },
      docs: "https://github.com/fredrivett/here-now",
    });
  });

  return app;
};
