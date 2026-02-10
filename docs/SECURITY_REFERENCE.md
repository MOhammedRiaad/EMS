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
| `admin` | Manager/Receptionist. | Operational control (bookings, clients) but restricted access to studio settings. |
| `coach` | Trainer/Coach. | Manage sessions, view assigned clients. Availability editing is conditionally restricted by studio settings. |
| `client` | Studio Member. | Book sessions, view progress, manage profile. Features gated by studio plan. |

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

---

## 6. Feature-Gated Access

In addition to RBAC, certain functionalities are gated by **Feature Flags** (Tenant settings) and **Plan Limits**.

### Core Feature Flags
- `core.branding`: Controls access to custom studio branding (colors/logo).
- `core.cancellation_policy`: Controls the visibility and enforcement of cancellation windows.
- `coach.portal`: Determines if the coach-specific portal and API endpoints are active.
- `client.booking`: Enables/disables client-side session self-booking.

### Behavioral Controls
- `allowCoachSelfEditAvailability`: A tenant-wide setting that overrides the `coach` role's ability to modify their own schedule. When disabled, only Admins or Tenant Owners can manage coach availability.

---

## 7. Operational Permissions Matrix

| Area | Permission Key | Role Access | Feature Dependency |
| :--- | :--- | :--- | :--- |
| **Settings** | `tenant.settings.update` | `tenant_owner` | N/A |
| **Branding** | `core.branding` | `tenant_owner` | `core.branding` must be enabled |
| **Sessions** | `session.create` | `admin`, `tenant_owner`, `client` (self) | `client.booking` for clients |
| **Coaches** | `coach.availability.update`| `tenant_owner`, `admin`, `coach` (self)* | *Blocked if `allowCoachSelfEditAvailability` is false |
| **Progress** | `client.progress.view` | `client`, `coach`, `admin` | `client.inbody_scans` must be enabled |
| **Waitlist** | `core.waiting_list` | `admin`, `tenant_owner` | `core.waiting_list` must be enabled |

