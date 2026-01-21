# EMS Studio - Deployment Guide

This guide covers deploying EMS Studio to a production environment.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Docker Deployment](#docker-deployment)
4. [Manual Deployment](#manual-deployment)
5. [Database Setup](#database-setup)
6. [SSL/TLS Configuration](#ssltls-configuration)
7. [Health Checks](#health-checks)
8. [Backup & Recovery](#backup--recovery)

---

## Prerequisites

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **CPU** | 2 cores | 4 cores |
| **RAM** | 4 GB | 8 GB |
| **Storage** | 20 GB SSD | 50 GB SSD |
| **OS** | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

### Required Software

- Docker 24+ and Docker Compose v2
- Node.js 20+ (for development)
- PostgreSQL 16+ (or use Docker)
- Redis 7+ (or use Docker)

---

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the project root:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=ems_user
DB_PASSWORD=<secure-password>
DB_DATABASE=ems_studio

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<secure-password>

# JWT
JWT_SECRET=<generate-64-char-secret>
JWT_EXPIRES_IN=7d

# MinIO (S3-compatible storage)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=<access-key>
MINIO_SECRET_KEY=<secret-key>
MINIO_BUCKET=ems-files

# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=<smtp-password>
MAIL_FROM=EMS Studio <noreply@example.com>

# Application
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-domain.com

# Sentry (Optional)
SENTRY_DSN=<your-sentry-dsn>
```

### Generating Secrets

```bash
# Generate JWT secret
openssl rand -hex 32

# Generate password
openssl rand -base64 24
```

---

## Docker Deployment

### Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_DATABASE}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - ems-network

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - ems-network

  minio:
    image: minio/minio:latest
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    networks:
      - ems-network

  backend:
    build: ./backend
    restart: unless-stopped
    env_file: .env
    depends_on:
      - db
      - redis
      - minio
    networks:
      - ems-network

  frontend:
    build: ./frontend
    restart: unless-stopped
    environment:
      VITE_API_URL: https://api.your-domain.com
    networks:
      - ems-network

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
      - frontend
    networks:
      - ems-network

networks:
  ems-network:

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### Deploying

```bash
# Build and start
docker compose -f docker-compose.prod.yml up -d --build

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Scale services
docker compose -f docker-compose.prod.yml up -d --scale backend=3
```

---

## Manual Deployment

### Backend

```bash
cd backend

# Install dependencies
npm ci --production

# Build
npm run build

# Run migrations
npm run migration:run

# Start with PM2
pm2 start dist/main.js --name ems-backend
```

### Frontend

```bash
cd frontend

# Install dependencies
npm ci

# Build
npm run build

# Serve with nginx or any static file server
# Build output is in dist/
```

---

## Database Setup

### Initial Setup

```sql
-- Create database
CREATE DATABASE ems_studio;

-- Create user
CREATE USER ems_user WITH ENCRYPTED PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE ems_studio TO ems_user;
```

### Run Migrations

```bash
cd backend
npm run migration:run
```

### Backup Database

```bash
# Create backup
pg_dump -h localhost -U ems_user ems_studio > backup_$(date +%Y%m%d).sql

# Restore backup
psql -h localhost -U ems_user ems_studio < backup.sql
```

---

## SSL/TLS Configuration

### Using Let's Encrypt

```bash
# Install certbot
apt install certbot

# Get certificate
certbot certonly --standalone -d your-domain.com -d api.your-domain.com

# Certificates location
/etc/letsencrypt/live/your-domain.com/
```

### Nginx SSL Config

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    
    location / {
        proxy_pass http://frontend:80;
    }
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location / {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Health Checks

### Available Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Basic health check |
| `GET /health/detailed` | Detailed with DB/Redis status |
| `GET /metrics` | Prometheus metrics |

### Monitoring with Prometheus

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'ems-backend'
    static_configs:
      - targets: ['backend:3000']
```

---

## Backup & Recovery

### Automated Backups

Create a cron job:

```bash
# /etc/cron.d/ems-backup
0 2 * * * root /opt/ems/backup.sh >> /var/log/ems-backup.log 2>&1
```

### Backup Script

```bash
#!/bin/bash
# /opt/ems/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/var/backups/ems

# Database
pg_dump -h localhost -U ems_user ems_studio | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# MinIO files
mc mirror minio/ems-files $BACKUP_DIR/files_$DATE/

# Keep last 7 days
find $BACKUP_DIR -mtime +7 -delete
```

---

## Troubleshooting Deployment

### Common Issues

**Backend won't start**
- Check database connection
- Verify all environment variables
- Check logs: `docker logs ems-backend`

**Database connection failed**
- Verify PostgreSQL is running
- Check firewall rules
- Verify credentials

**Frontend can't reach API**
- Check CORS settings
- Verify VITE_API_URL
- Check nginx proxy configuration

---

## Security Checklist

- [ ] Changed all default passwords
- [ ] Enabled SSL/TLS
- [ ] Set strong JWT secret
- [ ] Configured rate limiting
- [ ] Enabled 2FA for admin accounts
- [ ] Set up automated backups
- [ ] Configured firewall rules
- [ ] Removed debug endpoints
