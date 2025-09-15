import { createApp } from "../src/app.js";

// Create the Express app
const app = createApp();

// Export for Vercel serverless function
export default app;
