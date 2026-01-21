# EMS Studio - Troubleshooting Guide

Quick solutions to common issues in EMS Studio.

---

## Table of Contents

1. [Login Issues](#login-issues)
2. [Booking Problems](#booking-problems)
3. [Database Issues](#database-issues)
4. [Docker Issues](#docker-issues)
5. [Email Problems](#email-problems)
6. [Performance Issues](#performance-issues)
7. [API Errors](#api-errors)

---

## Login Issues

### "Invalid credentials" error

**Causes:**
- Wrong email or password
- Account not activated
- Account locked after failed attempts

**Solutions:**
1. Verify email is correct
2. Use "Forgot Password" to reset
3. Wait 15 minutes if locked out
4. Contact admin to unlock account

### 2FA not working

**Causes:**
- Time sync issue on device
- Wrong authenticator app

**Solutions:**
1. Ensure device time is correct (auto-sync)
2. Try regenerating 2FA secret
3. Use backup codes if available

---

## Booking Problems

### "Scheduling conflict" error

**Meaning:** The resource (room, coach, device) is already booked.

**Solutions:**
1. Choose a different time slot
2. Select a different room/coach
3. Check the calendar for availability
4. Join the waiting list

### Can't see available slots

**Causes:**
- Studio is closed
- Coach unavailable
- All rooms booked

**Solutions:**
1. Check studio opening hours
2. Try a different date
3. Select a different coach
4. Contact admin for assistance

### Client can't book

**Causes:**
- No package assigned
- Package expired
- No remaining sessions

**Solutions:**
1. Check package status in client profile
2. Assign a new package
3. Extend package expiry if needed

---

## Database Issues

### Connection refused

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**
1. Check PostgreSQL is running:
   ```bash
   docker ps | grep postgres
   # or
   systemctl status postgresql
   ```
2. Verify database credentials in `.env`
3. Check firewall allows port 5432

### Migration failed

```
Error: relation "users" already exists
```

**Solutions:**
1. Check migration status:
   ```bash
   npm run migration:show
   ```
2. Mark migrations as run:
   ```bash
   npm run typeorm -- migration:run
   ```
3. For fresh start (DEV ONLY):
   ```bash
   docker compose down -v
   docker compose up -d
   ```

---

## Docker Issues

### Container won't start

```bash
# Check logs
docker compose logs backend
docker compose logs db
```

**Common causes:**
- Missing environment variables
- Port conflicts
- Insufficient memory

**Solutions:**
1. Verify `.env` file exists
2. Check no other services use the ports
3. Run `docker system prune` if low on resources

### Container restarting in loop

```bash
# View restart reason
docker inspect <container> | grep -A 10 RestartPolicy
docker logs --tail 50 <container>
```

**Solutions:**
1. Check startup dependencies
2. Increase health check timeouts
3. Review container logs for errors

---

## Email Problems

### Emails not sending

**Check these first:**
1. SMTP credentials in `.env`:
   ```
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=noreply@example.com
   SMTP_PASS=password
   ```
2. Verify SMTP server accepts connections
3. Check spam folder

### Emails going to spam

**Solutions:**
1. Set up SPF, DKIM, and DMARC records
2. Use a reputable email service
3. Avoid spam trigger words
4. Ensure proper FROM address

---

## Performance Issues

### Slow page loads

**Causes:**
- Large dataset queries
- Missing database indexes
- Unoptimized images

**Solutions:**
1. Check database query times
2. Enable Redis caching
3. Add pagination to lists
4. Optimize image uploads

### High memory usage

```bash
# Check memory
docker stats
```

**Solutions:**
1. Increase container memory limits
2. Restart services periodically
3. Check for memory leaks in logs

### Slow API responses

1. Check database connection pool
2. Enable query logging to find slow queries
3. Review Redis cache hit rates
4. Consider database indexing

---

## API Errors

### 401 Unauthorized

**Causes:**
- Token expired
- Invalid token
- Missing Authorization header

**Solutions:**
1. Re-login to get new token
2. Check token format: `Bearer <token>`
3. Verify JWT_SECRET matches

### 403 Forbidden

**Causes:**
- Insufficient permissions
- Accessing wrong tenant data

**Solutions:**
1. Check user role permissions
2. Verify tenant ID is correct
3. Contact admin for access

### 500 Internal Server Error

**Debug steps:**
1. Check backend logs:
   ```bash
   docker logs ems-backend
   ```
2. Check Sentry for details (if configured)
3. Review recent code changes

---

## Quick Fixes

### Reset Everything (Development Only)

```bash
# Stop all containers and remove volumes
docker compose down -v

# Restart fresh
docker compose up -d
```

### Clear Cache

```bash
# Redis CLI
docker exec -it redis redis-cli
FLUSHALL
```

### Restart Services

```bash
docker compose restart backend
docker compose restart frontend
```

---

## Getting Help

If you can't resolve the issue:

1. **Check logs** - Most issues are explained in logs
2. **Search documentation** - Check user guides
3. **Contact support** - support@ems-studio.com

When reporting issues, include:
- Error message
- Steps to reproduce
- Browser/OS version
- Relevant logs
