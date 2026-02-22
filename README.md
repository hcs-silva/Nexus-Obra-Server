# Gestao-Obra-Server

A multi-tenant construction project management API built with Node.js, TypeScript, Express, and MongoDB.

## Features

- 🔐 JWT-based authentication
- 👥 Role-based access control (masterAdmin, Admin, user, guest)
- 🏢 Multi-tenant client management
- 🏗️ Construction project (obra) management
- 📊 MongoDB data persistence
- 🛡️ NoSQL injection protection

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
# Required: TOKEN_SECRET, MONGODB_URI

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
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in milliseconds (default: 900000)
- `RATE_LIMIT_MAX` - Max requests per window per IP (default: 100)
- `AUTH_RATE_LIMIT_WINDOW_MS` - Auth rate limit window in milliseconds (default: 900000)
- `AUTH_RATE_LIMIT_MAX` - Max auth attempts per window per IP (default: 5)

## API Endpoints

### Users (`/users`)

- `POST /signup` - Create new user
- `POST /login` - Authenticate user
- `GET /` - List users (role-filtered)
- `PATCH /resetpassword/:userId` - Reset password

### Clients (`/clients`)

- `POST /createClient` - Create new client
- `GET /` - List all clients
- `GET /:clientId` - Get client details
- `PATCH /:clientId` - Update client
- `DELETE /:clientId` - Delete client

### Obras/Projects (`/obras`)

- `POST /createObra` - Create project
- `GET /` - List projects
- `GET /:obraId` - Get project details
- `PATCH /:obraId` - Update project
- `DELETE /:obraId` - Delete project

## Architecture

```text
gestao-obra-server/
├── app.ts              # Express app configuration
├── server.ts           # Server entry point
├── config/             # App configuration
├── db/                 # Database connection
├── models/             # Mongoose models
│   ├── User.model.ts
│   ├── Client.model.ts
│   └── Obra.model.ts
├── routes/             # API routes
├── middlewares/        # Auth & role middleware
└── error-handling/     # Error handlers
```

## Development

```bash
# Run in development mode with auto-reload
pnpm dev

# Build TypeScript
pnpm build

# Run production build
pnpm start
```

## License

Private - All Rights Reserved
