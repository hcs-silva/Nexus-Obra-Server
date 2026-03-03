# Gestao-Obra-Server

A multi-tenant construction project management API built with Node.js, TypeScript, Express, and MongoDB.

## Features

- 🔐 JWT-based authentication
- 🍪 Cookie-based auth token support (httpOnly) with bearer fallback
- 👥 Role-based access control (masterAdmin, Admin, user, guest)
- 🏢 Multi-tenant client management
- 🏗️ Obra (project) management
- ☁️ Signed Cloudinary upload signature endpoint (auth-protected)
- 📊 MongoDB data persistence
- 🛡️ NoSQL injection protection
- 🧱 Joi request validation for create/update/auth flows
- 🚦 Global and auth-specific rate limiting
- 🪖 Security headers via Helmet
- 📝 Structured request and error logging (Morgan + Winston)
- ❤️ DB-aware health endpoint (`GET /api/health`)
- 🧹 Graceful shutdown on `SIGINT` / `SIGTERM` (HTTP + DB close)

## Quick Start

### Prerequisites

- Node.js 22+
- MongoDB running locally or connection URI
- pnpm

### Installation

```bash
# Install dependencies
pnpm install

# Create .env file (see .env.example)
cp .env.example .env

# Edit .env with your configuration
# Required: TOKEN_SECRET, MONGODB_URI,
# CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

### Environment Variables

See `.env.example` for required variables:

- `TOKEN_SECRET` - Secret key for JWT signing
- `MONGODB_URI` - MongoDB connection string
- `PORT` - Server port (default: 5005)
- `ALLOWED_ORIGINS` - Comma-separated CORS allowlist (default: `http://localhost:5173`)
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name (required)
- `CLOUDINARY_API_KEY` - Cloudinary API key (required)
- `CLOUDINARY_API_SECRET` - Cloudinary API secret (required)
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in milliseconds (default: 900000)
- `RATE_LIMIT_MAX` - Max requests per window per IP (default: 100)
- `AUTH_RATE_LIMIT_WINDOW_MS` - Auth rate limit window in milliseconds (default: 900000)
- `AUTH_RATE_LIMIT_MAX` - Max auth attempts per window per IP (default: 5)
- `LOG_LEVEL` - Logger level (default: `debug` in dev, `info` in production)

## API Endpoints

### Health (`/api`)

- `GET /` - Basic health check (`"All good in here"`)
- `GET /health` - DB-aware health status (`ok`/`degraded`) with uptime, DB connection state, and timestamp

### Users (`/users`)

- `POST /signup` - Create new user (requires authenticated `masterAdmin` or `Admin`)
- `POST /login` - Authenticate user
- `POST /logout` - Clear auth cookie
- `GET /me` - Get authenticated user profile (safe projection)
- `GET /` - List users (`masterAdmin` sees all, others see same `clientId`)
- `PATCH /resetpassword/:userId` - Reset password (authenticated)

### Uploads (`/uploads`)

- `POST /cloudinary/signature` - Generate signed Cloudinary upload params (authenticated)

### Clients (`/clients`)

- `POST /createClient` - Create new client with admin user (`masterAdmin` only)
- `GET /` - List clients (`masterAdmin` gets all, `Admin` gets own)
- `GET /me` - Get own client details + members (`Admin` only)
- `POST /me/members` - Add a member to own client (`Admin` only)
- `DELETE /me/members/:userId` - Remove a member from own client (`Admin` only)
- `GET /:clientId` - Get client details (`masterAdmin` any, `Admin` own only)
- `PATCH /me` - Update own client profile (`Admin` only)
- `PATCH /:clientId` - Update client (`masterAdmin` any, `Admin` own only)
- `DELETE /:clientId` - Delete client (`masterAdmin` only)

### Obras (Projects) (`/obras`)

- `POST /createObra` - Create obra (`masterAdmin` any client, others own client only)
- `GET /` - List obras (`masterAdmin` all, others own client only)
- `GET /:obraId` - Get obra details (client-scoped unless `masterAdmin`)
- `PATCH /:obraId` - Update obra (client-scoped unless `masterAdmin`)
- `DELETE /:obraId` - Delete obra (client-scoped unless `masterAdmin`)
- `POST /:obraId/faturas` - Add invoice to obra
- `DELETE /:obraId/faturas/:faturaId` - Delete invoice from obra

## Security & Validation

- Global request sanitization against NoSQL injection on `body`, `params`, and `query`
- Global API rate limiting on `/api`, `/users`, `/clients`, `/obras`
- Stricter auth rate limiting on `/users/login`, `/users/signup`, and `/users/resetpassword/:userId`
- Joi body validation on auth, client, and obra create/update routes
- Environment validation at startup for required secrets and rate-limit numeric values
- `User.password` is excluded by default (`select: false`) and only explicitly selected in login flow
- CORS allowlist enforced via `ALLOWED_ORIGINS` with `credentials: true`

## Architecture

### Runtime Flow

1. `server.ts` validates required environment variables (`TOKEN_SECRET`, `MONGODB_URI`) plus rate-limit numeric envs, then starts the HTTP server.
2. `app.ts` boots the Express app, initializes MongoDB via `db/index.ts`, and applies platform middleware (`cors`, `helmet`, parsers, request logging, and NoSQL sanitization).
3. Global rate limiting is applied per top-level API area (`/api`, `/users`, `/clients`, `/obras`), with stricter auth limits for login/signup/reset-password routes.
4. Route modules apply authentication (`authMiddleware`), role authorization (`roleMiddleware`), and Joi payload validation (`validationMiddleware`) before controller logic.
5. Request handlers access MongoDB through Mongoose models (`User`, `Client`, `Obra`) with tenant-aware access checks based on JWT payload (`role`, `clientId`).
6. `index.routes.ts` exposes both base health and DB-aware health checks.
7. `server.ts` handles graceful shutdown (`SIGINT`/`SIGTERM`) by closing HTTP server and MongoDB connection before process exit.
8. `error-handling/index.ts` provides fallback 404 and centralized 500 error responses with structured logging.

```text
Server/
├── app.ts                     # Express composition: middleware, rate limits, route mounting
├── server.ts                  # Process bootstrap, env validation, HTTP listener, graceful shutdown
├── config/
│   ├── index.ts               # Core middleware (CORS, morgan->winston, parsers, sanitize)
│   └── logger.ts              # Winston logger configuration
├── db/
│   └── index.ts               # MongoDB connection bootstrap + readiness/close helpers
├── error-handling/
│   └── index.ts               # 404 + centralized error middleware
├── middlewares/
│   ├── authMiddleware.ts      # JWT verification, payload attachment
│   ├── roleMiddleware.ts      # Role-based authorization guard
│   ├── validationMiddleware.ts# Joi request-body validation helper
│   └── rateLimitMiddleware.ts # Global and auth-specific rate limiters
├── validations/
│   └── requestSchemas.ts      # Joi schemas for auth, client, obra operations
├── models/
│   ├── User.model.ts
│   ├── Client.model.ts
│   └── Obra.model.ts
├── routes/
│   ├── index.routes.ts        # Base + DB-aware health endpoints
│   ├── user.routes.ts         # Auth + user management
│   ├── client.routes.ts       # Tenant/client + member management
│   ├── obras.routes.ts        # Project (obra) CRUD + invoice operations
│   └── upload.routes.ts       # Cloudinary signature endpoint
├── types/
│   └── index.ts               # Shared TypeScript interfaces
├── scripts/
│   └── smoke-test.sh          # Endpoint smoke testing script
└── Development-Reports/       # Production/readiness/testing documentation
```

## Development

```bash
# Run in development mode with auto-reload
pnpm dev

# Build TypeScript
pnpm build

# Run production build
pnpm start

# Run endpoint smoke tests
pnpm smoke:test
```

## Docker

This repo includes its own Docker setup (`Dockerfile` + `docker-compose.yml`) for Server + MongoDB.

### Compose (repo-local)

From `Server/`:

```bash
cp .env.docker.example .env
docker compose up --build
```

- Server API: `http://localhost:5005`
- Health: `http://localhost:5005/api/health`

When the client is in a separate repository, ensure that client origin is included in `ALLOWED_ORIGINS`.

### Server image only

From `Server/`:

```bash
docker build -t nexus-obra-server .
docker run --rm -p 5005:5005 \
	-e PORT=5005 \
	-e MONGODB_URI=mongodb://host.docker.internal:27017/gestao-obra-server \
	-e TOKEN_SECRET=change-me \
	-e CLOUDINARY_CLOUD_NAME=your-cloud \
	-e CLOUDINARY_API_KEY=your-key \
	-e CLOUDINARY_API_SECRET=your-secret \
	nexus-obra-server
```

For version tagging and rollback flow, see [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md).

## License

Private - All Rights Reserved
