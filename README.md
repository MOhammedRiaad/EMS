# EMS Studio SaaS Platform

A comprehensive, multi-tenant management platform designed specifically for EMS (Electrical Muscle Stimulation) studios. This system handles complex resource-based scheduling, client result tracking, and business operations in a unified "Modular Monolith" architecture.

---

## 🌟 Key Features

### 🏢 Multi-Tenancy & Architecture
- **Tenant Isolation**: Data isolation enforced at the database level using `tenant_id` and application-level Guard logic.
- **Role-Based Access**: Granular permissions for Owners, Admins, Coaches, and Clients.
- **Scalable Backend**: NestJS modular architecture with PostgreSQL, Redis, and MinIO.

### 📅 Resource-Based Scheduling (Core)
The scheduling engine ensures zero conflicts by validating four resources simultaneously:
1. **Room Availability**: Essential for EMS where sessions require specific private spaces.
2. **Coach Availability**: Checks working hours, existing bookings, and time-off.
3. **Device Availability**: Tracks EMS device usage to prevent double-booking hardware.
4. **Client Status**: Validates package balance and existing bookings.

### 👥 Client Portal (Mobile-First)
A dedicated PWA-ready web portal for clients:
- **Dashboard**: View active package status, next session, and scheduled count.
- **Booking**: Self-service booking 24/7 with real-time availability.
- **Waiting List**: Join queues for fully booked slots; manage requests.
- **History**: View past workouts, receipt history, and body composition trends.

### 📊 Health & Results Tracking
- **InBody Integration**: Track weight, muscle mass, body fat % over time.
- **Visual Charts**: Interactive graphs showing client progress.
- **File Storage**: Secure PDF storage for scan reports (S3/MinIO).

### 💰 Business Operations
- **Package Management**: Session packs (10/20/50) with automated countdowns.
- **Revenue Tracking**: Cash flow dashboards and receipt generation.
- **Waiting List Funnel**: Admin tools to notify waiting clients when spots open.
- **Notifications**: Automated email reminders (Cron) and in-app alerts.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 (Vite) | fast, responsive Admin & Client UI |
| **Backend** | NestJS (Node.js) | Structured, type-safe API services |
| **Database** | PostgreSQL 16 | Relational data with JSONB support |
| **Cache/Queue** | Redis 7 | Job queuing and rigorous session locking |
| **Storage** | MinIO (S3) | Object storage for health records |
| **DevOps** | Docker Compose | Instant local environment setup |

---

## 🚀 Workflows: How It Works

### 1. Booking Flow
- **Input**: Client selects Date/Time.
- **System**: Checks Studio Opening Hours -> Checks Coach Rules -> Checks Room/Device availability.
- **Result**: If valid, session is created (`status: scheduled`) and package balance decremented.
- **Conflict**: If full, Client can join **Waiting List**.
- **Waitlist**: Admin notifies client -> Client confirms -> Session booked.

### 2. Check-In & Usage
- Coach marks session as `Completed`.
- System records attendance history.
- If `No-Show` or `Late Cancel`: Session is deducted based on policy (48h rule).

### 3. InBody Tracking
- Admin/Coach enters data from InBody scan machine.
- Optional: Upload PDF scan report.
- Data stored in `inbody_scans` table and file in MinIO.
- Client sees updated charts immediately in their portal.

---

## 🛠️ Development Setup

### 1. Prerequisites
- Docker Desktop
- Node.js 20+

### 2. Start Environment
```bash
# Copy env template
cp .env.example .env

# Start services (DB, Redis, MinIO, MailDev)
docker compose up -d

# Start Backend (Watch Mode)
cd backend && npm run start:dev

# Start Frontend (HMR)
cd frontend && npm run dev
```

### 3. Access Points
- **Web App**: http://localhost:5173
- **API Docs**: http://localhost:3000/api
- **MailDev**: http://localhost:1080 (View sent emails)
- **MinIO**: http://localhost:9001 (View files)

### 4. Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@demo.ems | admin123 |
| **Coach** | coach@demo.ems | coach123 |
| **Client** | client@demo.ems | client123 |

---

## 📜 License
Proprietary software. All rights reserved.

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
