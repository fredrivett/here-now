import cors from "cors";

export const corsMiddleware = cors({
  origin: "*", // Allow all origins for analytics widget embedding
  credentials: false, // No credentials needed for analytics
  optionsSuccessStatus: 200,
});
