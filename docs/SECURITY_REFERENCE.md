# Security & Permissions Reference

This document outlines the security architecture and Role-Based Access Control (RBAC) system implemented for the EMS Studio platform and Owner Portal.

## 1. Security Architecture
The platform uses a database-driven, granular permission system that replaces static role-based checks.

### Core Security Principles
- **Least Privilege**: Users are granted only the permissions necessary for their specific role.
- **Cross-Tenant Isolation**: Regular tenant users are strictly scoped to their `tenantId`. Only `platform_owner` and `support_owner` roles can access data across multiple tenants.
- **Auditing**: All administrative actions (Owner Portal) and critical tenant actions are logged with actor details, timestamps, and IP addresses.

---

## 2. Permission Model
Permissions are granular strings (e.g., `client.create`, `owner.tenant.suspend`) assigned to roles.

### Types of Permissions
1. **Tenant-Scoped**: Permissions for managing data within a single studio (e.g., `session.manage`).
2. **Owner-Scoped**: Platform-level permissions for managing the entire SaaS system (prefixed with `owner.`).

### Granting Permissions
Permissions are assigned through a many-to-many relationship:
`User` -> `UserRoleAssignment` -> `Role` -> `RolePermission` -> `Permission`

---

## 3. System Roles
The platform comes with several pre-defined system roles that cannot be deleted.

| Role | Description | Access Level |
| :--- | :--- | :--- |
| `platform_owner` | Full platform access. | All permissions (Super Admin) |
| `support_owner` | Support staff access. | View all tenants, send broadcasts, view audit logs. |
| `tenant_owner` | Studio owner. | Full control within their designated tenant. |
| `admin` | Manager/Receptionist. | Operational control (bookings, clients) but no tenant settings. |
| `coach` | Trainer/Coach. | Manage sessions, view assigned clients, track availability. |
| `client` | Studio Member. | Book sessions, view progress, manage profile. |

---

## 4. Enforcement Mechanisms

### Backend Enforcement
The platform uses NestJS Guards to enforce permissions on every API endpoint.

```typescript
@RequirePermissions('owner.tenant.suspend')
@Post(':id/suspend')
async suspendTenant(...) { ... }
```

### Frontend Enforcement
Components use conditional rendering based on the user's permission set.

```tsx
{hasPermission('owner.tenant.suspend') && (
  <button onClick={handleSuspend}>Suspend Tenant</button>
)}
```

---

## 5. Audit Logging
Every action in the Owner Portal is recorded in the `owner_audit_logs` table.

**Logged Data Includes:**
- **Action Type**: (e.g., `SUSPEND_TENANT`)
- **Owner ID**: The admin who performed the action.
- **Target**: The tenant or resource affected.
- **Metadata**: JSON payload containing before/after states if applicable.
- **Context**: IP Address and timestamp.
