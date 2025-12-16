# <img src="favicon.svg" alt="here/now logo" width="32" height="32" align="absmiddle"> here/now — modern minimal webpage hit counter

A minimal, self-hosted visitor tracking API that shows both **total visitor count** and **real-time visitor counts** per webpage.

Hosted original and example available at [herenow.fyi](https://www.herenow.fyi).

## ✨ Features

- **Real-time visitor tracking** - See current active visitors on a page
- **Total visitor counts** - Track all-time unique visitors on a page
- **Self-hosted** - Full control over your data
- **Lightweight widget** - Single script tag integration
- **Dark/light theme detection** - Automatic theme matching
- **SPA support** - Works with React, Vue, Next.js, etc.
- **CORS enabled** - Works from any website (domain filtering via allowlist)

Keeping a link to [herenow.fyi](https://herenow.fyi) in your implementation is appreciated but not required, as this helps others discover how to implement here/now.

## 🚀 Quick Start

### Option A: Docker (Recommended for Self-Hosting)

The easiest way to self-host here/now is with Docker. This bundles everything you need (app + database) in one command.

**Prerequisites:** [Docker](https://docs.docker.com/get-docker/) installed on your machine.

```bash
# Clone the repository
git clone https://github.com/fredrivett/here-now.git
cd here-now

# Configure your allowed domains
cp .env.docker.example .env
# Edit .env and set ALLOWED_DOMAINS to your domain(s)

# Start everything
docker compose up -d

# That's it! Your API is running at http://localhost:3210
```

**Useful Docker commands:**
```bash
docker compose logs -f     # View logs
docker compose down        # Stop the services
docker compose down -v     # Stop and remove database data
docker compose up -d --build  # Rebuild after code changes
```

### Option B: Manual Setup

If you prefer to manage Node.js and PostgreSQL yourself:

#### 1. Clone and Install

```bash
git clone https://github.com/fredrivett/here-now.git
cd here-now
npm install
```

#### 2. Set up Database

_You can use any database setup you choose, this guide works with Supabase (postgres)._

Copy the environment variables:

```bash
cp .env.example .env
```

Set up your database:

1. Create a free PostgreSQL database at [supabase.com](https://supabase.com)
2. Go to Connect → Connection String and copy both connection strings
3. Update `.env` with your Supabase URLs:
   ```bash
   DATABASE_URL="postgres://postgres:[YOUR-PASSWORD]@db.[YOUR-DB].supabase.co:6543/postgres?pgbouncer=true"  # Transaction Pooler
   DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-DB].supabase.co:5432/postgres"  # Direct connection
   ```

Initialize database:

```bash
npm run db:generate  # Generates types
npm run db:push      # Creates tables in your database
```

#### 3. Configure Domains

Add your allowed domains to `.env`:

```bash
ALLOWED_DOMAINS="localhost,yourdomain.com,yourotherdomain.com"
```

#### 4. Start the Server

```bash
npm run dev
```

Your API will be available at `http://localhost:3210`

#### 5. Add to Your Website

Add this single line to any webpage where you wish the widget to display:

```html
<div data-herenow></div>
```

Then include the script before the closing `</body>` tag:

```html
<script src="http://localhost:3210/widget.js" async></script>
```

## 📁 Project Structure

```
here-now/
├── api/
│   └── index.ts                   # Vercel serverless entry point
├── src/
│   ├── app.ts                     # Express app configuration
│   ├── server.ts                  # Standalone server entry point
│   ├── controllers/               # Request handlers
│   │   ├── trackController.ts
│   │   ├── statsController.ts
│   │   └── widgetController.ts
│   ├── routes/                    # Route definitions
│   │   ├── track.ts
│   │   ├── stats.ts
│   │   └── widget.ts
│   ├── middleware/                # Custom middleware
│   │   └── cors.ts
│   ├── lib/                       # Utilities & external services
│   │   ├── prisma.ts
│   │   └── constants.ts
│   └── types/                     # TypeScript type definitions
│       └── index.ts
├── prisma/
│   └── schema.prisma              # Database schema
├── package.json
├── tsconfig.json
├── vercel.json                    # Vercel deployment config
└── .env.example
```

## 🔌 API Endpoints

The widget automatically calls these on page load so you don't need to implement them, but these are the API endpoints available:

### Track Visitor

```http
POST /api/track
Content-Type: application/json

{
  "domain": "yourdomain.com",
  "path": "/blog/post-1",
  "user_id": "optional-user-id",
  "session_id": "optional-session-id"
}
```

### Get Stats

```http
GET /api/stats?domain=yourdomain.com&path=/blog/post-1
```

Response:

```json
{
  "here": 42,
  "now": 3,
  "domain": "yourdomain.com",
  "path": "/blog/post-1"
}
```

### Widget Script

```http
GET /widget.js
```

Returns the JavaScript widget code.

## ☁️ Vercel Deployment

This project is configured for Vercel deployment, but you can deploy how you wish.

Vercel instructions:

1. Push to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy

The `vercel.json` and `api/index.ts` files handle the serverless configuration.

## ⚙️ Environment Variables

| Variable          | Required | Description                                                |
| ----------------- | -------- | ---------------------------------------------------------- |
| `DATABASE_URL`    | ✅       | PostgreSQL connection string                               |
| `DIRECT_URL`      | ✅       | Direct database connection (for migrations)                |
| `ALLOWED_DOMAINS` | ✅       | Comma-separated list of allowed domains                    |
| `API_BASE_URL`    | ❌       | Base URL for widget API calls (auto-detected from request) |

## 🤝 Contributing

Contributions welcome! Please read our [contributing guidelines](CONTRIBUTING.md) and submit pull requests.

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Links

- **Hosted Version**: [herenow.fyi](https://herenow.fyi)
- **Issues**: [GitHub Issues](https://github.com/fredrivett/here-now/issues)
