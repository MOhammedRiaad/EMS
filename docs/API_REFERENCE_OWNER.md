# Owner Portal API Reference

This document covers the core administrative API endpoints used by the Owner Portal and system integrations.

## 1. Authentication
All owner endpoints require a JWT token with `platform_owner` or `support_owner` role assignment.

---

## 2. Tenant Management

### List Tenants
`GET /owner/tenants`
Returns a paginated list of all tenants.
- **Query Params**: `search`, `status`, `page`, `limit`
- **Permissions**: `owner.tenant.list`

### Get Tenant Details
`GET /owner/tenants/:id`
Returns full profile, plan, and usage statistics for a tenant.
- **Permissions**: `owner.tenant.view`

### Suspend Tenant
`POST /owner/tenants/:id/suspend`
- **Body**: `{ "reason": "string" }`
- **Permissions**: `owner.tenant.suspend`

---

## 3. Feature Flags & Overrides

### List All Features
`GET /owner/features`
Returns the global registry of all available features.
- **Permissions**: `owner.feature.view`

### Set Tenant Override
`POST /owner/features/:key/tenant/:tenantId`
Enable or disable a feature for a specific tenant, regardless of their plan.
- **Body**: `{ "enabled": boolean, "notes": string }`
- **Permissions**: `owner.feature.toggle`

---

## 4. Upgrade Requests

### List Pending Requests
`GET /owner/upgrade-requests`
- **Permissions**: `owner.upgrade.list`

### Approve Upgrade
`POST /owner/upgrade-requests/:id/approve`
- **Body**: `{ "notes": string }`
- **Permissions**: `owner.upgrade.approve`

---

## 5. Analytics & Monitoring

### Global Dashboard Stats
`GET /owner/analytics`
- **Query Params**: `startDate` (ISO string)
- **Permissions**: `owner.analytics.view`

### Get Audit Logs
`GET /owner/audit-logs`
- **Query Params**: `action`, `tenantId`, `limit`
- **Permissions**: `owner.audit.view`

---

## 6. System Health
`GET /status` (Public)
`GET /health` (Owner Protected)
Returns connectivity status for Database, Redis, and Storage.
