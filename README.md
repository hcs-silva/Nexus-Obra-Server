# Gestao-Obra-Server

A multi-tenant construction project management API built with Node.js, TypeScript, Express, and MongoDB.

## 🚧 Project Status

**MVP Status:** ✅ Functional - Core features working  
**Production Status:** ❌ Not Ready - See [Production Readiness Report](./PRODUCTION_READINESS_REPORT.md)

## Features

- 🔐 JWT-based authentication
- 👥 Role-based access control (masterAdmin, Admin, user, guest)
- 🏢 Multi-tenant client management
- 🏗️ Construction project (obra) management
- 📊 MongoDB data persistence

## Quick Start

### Prerequisites

- Node.js 22+
- MongoDB running locally or connection URI
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create .env file (see .env.example)
cp .env.example .env

# Edit .env with your configuration
# Required: TOKEN_SECRET, MONGODB_URI

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables

See `.env.example` for required variables:
- `TOKEN_SECRET` - Secret key for JWT signing
- `MONGODB_URI` - MongoDB connection string
- `PORT` - Server port (default: 5005)

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

```
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
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start
```

## Documentation

- [Production Readiness Report](./PRODUCTION_READINESS_REPORT.md) - Comprehensive analysis
- [Next Steps](./NEXT_STEPS.md) - Quick action items

## Contributing

1. Review the [Production Readiness Report](./PRODUCTION_READINESS_REPORT.md)
2. Check the [Next Steps](./NEXT_STEPS.md) for priority tasks
3. Follow the existing code structure and TypeScript patterns

## License

Private - All Rights Reserved
