# EMS Studio SaaS Platform

A multi-tenant EMS (Electrical Muscle Stimulation) studio management platform supporting multi-room scheduling, client reviews, InBody tracking, and payments.

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac) or Docker Engine (Linux)
- [Node.js 20+](https://nodejs.org/) (for backend/frontend development)

### 1. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Start all services
docker compose up -d
```

### 2. Verify Services

| Service | URL | Purpose |
|---------|-----|---------|
| **PostgreSQL** | `localhost:5432` | Database |
| **Redis** | `localhost:6379` | Job queue & cache |
| **MinIO Console** | http://localhost:9001 | File storage (S3-compatible) |
| **MailDev** | http://localhost:1080 | Email testing UI |

### 3. Connect to Database

```bash
# Using psql
psql -h localhost -U ems_user -d ems_studio

# Or use any PostgreSQL client with:
# Host: localhost
# Port: 5432
# User: ems_user
# Password: ems_secret
# Database: ems_studio
```

## Project Structure

```
EMS Studio/
├── docker-compose.yml      # Development services
├── .env.example            # Environment template
├── .env                    # Local config (git-ignored)
├── database/
│   └── init/               # SQL init scripts (run on first start)
├── backend/                # NestJS API (coming soon)
└── frontend/               # React PWA (coming soon)
```

## Development Commands

```bash
# Start services
docker compose up -d

# View logs
docker compose logs -f [service_name]

# Stop services
docker compose down

# Reset database (removes all data!)
docker compose down -v && docker compose up -d

# Check service health
docker compose ps
```

## Demo Credentials

After starting services, the database includes:

| Type | Email | Password |
|------|-------|----------|
| Admin | admin@demo.ems | admin123 |

## Service Details

### PostgreSQL
- Pre-configured with full schema
- Row-Level Security enabled for multi-tenancy
- Seed data includes demo tenant, studio, rooms, and devices

### MinIO (S3-Compatible Storage)
- Console: http://localhost:9001
- Username: `minio_user`
- Password: `minio_secret`
- Used for InBody PDFs and file uploads

### MailDev (Email Testing)
- Web UI: http://localhost:1080
- SMTP: `localhost:1025`
- All emails sent during development appear here

## Tech Stack

- **Backend**: NestJS (Node.js)
- **Database**: PostgreSQL 16
- **Cache/Queue**: Redis 7
- **Storage**: MinIO (S3-compatible)
- **Frontend**: React PWA
- **Auth**: JWT with tenant context

## License

Proprietary - All rights reserved
