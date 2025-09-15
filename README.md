# here/now — modern simple webpage hit counter

A simple, self-hosted visitor tracking API that shows both real-time and total visitor counts per webpage.

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

### 1. Clone and Install

```bash
git clone https://github.com/fredrivett/here-now.git
cd here-now
npm install
```

### 2. Set up Database

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

### 3. Configure Domains

Add your allowed domains to `.env`:

```bash
ALLOWED_DOMAINS="localhost,yourdomain.com,yourotherdomain.com"
```

### 4. Start the Server

```bash
npm run dev
```

Your API will be available at `http://localhost:3210`

### 5. Add to Your Website

Add this single line to any webpage:

```html
<div data-herenow></div>
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

This project is built for Vercel deployment:

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

Contributions welcome! Please read the contributing guidelines and submit pull requests.

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Links

- **Hosted Version**: [herenow.fyi](https://herenow.fyi)
- **Issues**: [GitHub Issues](https://github.com/fredrivett/here-now/issues)
