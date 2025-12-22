import { createApp } from "./app.js";

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  console.error(
    "ERROR: DATABASE_URL environment variable is required.\n" +
      "For Docker: Set POSTGRES_PASSWORD in your .env file (see .env.docker.example)\n" +
      "For serverless: Set DATABASE_URL to your PostgreSQL connection string (see .env.example)"
  );
  process.exit(1);
}

const app = createApp();
const port = process.env.PORT || 3210;

app.listen(port, () => {
  console.log(`🚀 here/now API server running on port ${port}`);
  console.log(`📊 Widget available at: http://localhost:${port}/widget.js`);
  console.log(`💻 API docs: http://localhost:${port}`);
});
