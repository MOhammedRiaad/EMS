# Owner Admin Dashboard - Control Plane

> **Feature Branch**: `feature/owner-admin-dashboard`  
> **Status**: ✅ Completed  
> **Started**: February 2, 2026  
> **Completed**: February 3, 2026

---

## 📋 Overview

The Owner Admin Dashboard is a comprehensive control plane for SaaS platform owners to manage all studio tenants, features, usage, and system health. This is the central management interface for operating the EMS Studio SaaS platform.

Think of it as: **Stripe Dashboard + Firebase Console + Mindbody Ops Panel**

---

## 🎯 Goals

### Primary Objectives
1. **Full Visibility** - See everything happening across all tenants
2. **Feature Control** - Safely enable/disable features per tenant or globally
3. **Usage Enforcement** - Track and enforce plan limits automatically
4. **Operational Speed** - Troubleshoot and manage without database access
5. **Scalability** - Support hundreds of studio tenants efficiently

### Core Principles
- **Read-first, act-second** - Default to visibility, not mutation
- **Everything is reversible** - Feature toggles, suspensions, overrides
- **Per-tenant isolation** - Nothing global unless intentional
- **Operational speed > beauty** - Fast, clear, functional UI

---

## 🏗️ Architecture

### Backend Components

#### 1. Permission System (Database-Driven RBAC)
- **Entities**: `Permission`, `Role`, `RolePermission`, `UserRole`
- **Roles**: 
  - `platform_owner` - Super admin with all permissions
  - `support_owner` - Read-only owner (view logs, send messages)
  - `tenant_owner`, `admin`, `coach`, `client` - Standard roles
- **~50-100 Permissions**: Granular access control (e.g., `session.create`, `owner.tenant.suspend`)

#### 2. Feature Flag System
- **Entities**: `FeatureFlag`, `FeatureAssignment`
- **Resolution Order**: Tenant Override → Plan Default → Global Default
- **20+ Features**: All modules (sessions, marketing, retail, compliance, etc.)

#### 3. Plan Management
- **Entity**: `Plan`
- **Plans**: Trial, Starter, Pro, Enterprise
- **Limits**: Clients, coaches, sessions/month, SMS, email, storage

#### 4. Usage Tracking & Enforcement
- **Entity**: `UsageMetric`
- **Middleware**: Tracks API calls, sessions, messages, storage
- **Hard Limits**: Operations blocked with 402 Payment Required when exceeded
- **Auto-Block**: Tenant marked as blocked when limits reached

#### 5. Upgrade Request System
- **Entity**: `PlanUpgradeRequest`
- **Workflow**: Tenant requests → Owner reviews → Auto-upgrade on approval

#### 6. Owner Services
- Tenant management (suspend, impersonate, reset demo)
- System health monitoring (DB, Redis, MinIO, queues)
- Cross-tenant analytics
- Broadcast messaging
- Audit logging

### Frontend Components

#### Tenant Settings Enhancement (Admin Panel)
- **Plan & Usage Overview**: Current plan, usage progress bars, upgrade button
- **Upgrade Request Modal**: Plan comparison, selection, submission
- **Usage Limit Blocker**: 402 error interceptor with upgrade CTA

#### Owner Portal (`/owner/*`)

**9 Main Sections:**

1. **Overview Dashboard**
   - KPIs: Total studios, clients, sessions, revenue
   - Alerts: Failures, quota spikes, errors
   - Quick actions

2. **Tenants Management**
   - List view with filters
   - Detailed tenant view with 8 tabs:
     - Overview, Feature Flags, Usage & Limits, Automations, Messaging, Logs & Errors, Compliance, Upgrade Requests

3. **Feature Management**
   - Feature registry
   - Global toggles
   - Dependency visualization

4. **Usage & Plans**
   - Usage analytics
   - Plan definitions
   - Limit enforcement controls

5. **Automations Monitor**
   - Cross-tenant execution view
   - Failure heatmap
   - Emergency kill switch

6. **Messaging & Broadcasts**
   - Broadcast composer
   - Target selection (all, by plan, by region)
   - Message history

7. **System Health**
   - Infrastructure status (DB, Redis, MinIO)
   - Error tracking integration
   - Performance metrics

8. **Upgrade Requests**
   - Pending requests list
   - Approve/reject actions
   - Request history

9. **Role & Permission Manager**
   - Role/permission matrix
   - Custom role builder
   - User role assignment

---

## 📊 Database Schema

### New Tables

| Table | Purpose |
|-------|---------|
| `permissions` | Granular permission definitions |
| `roles` | Database-driven roles (system + custom) |
| `role_permissions` | Many-to-many role ↔ permission |
| `user_roles` | Many-to-many user ↔ role |
| `feature_flags` | Feature definitions and metadata |
| `feature_assignments` | Tenant-specific feature overrides |
| `plans` | Plan definitions with limits and features |
| `usage_metrics` | Tenant resource usage tracking |
| `owner_audit_logs` | Owner action audit trail |
| `plan_upgrade_requests` | Tenant upgrade requests |

### Extended Tables

| Table | New Columns |
|-------|-------------|
| `tenants` | `status`, `suspendedAt`, `suspendedReason`, `lastActivityAt`, `usageStats`, `ownerNotes`, `isBlocked`, `blockReason` |
| `users` | Relationship change: `@ManyToMany(() => Role)` instead of `role` enum |

---

## 🔐 Security Model

### Permission-Based Access Control

**Permission Checking:**
```typescript
// Single permission
@RequirePermissions('session.create')

// Multiple permissions (AND)
@RequirePermissions(['client.read', 'session.create'], 'AND')

// Any permission (OR)
@RequirePermissions(['tenant.settings.read', 'owner.tenant.list'], 'OR')
```

**Owner Action Auditing:**
- All owner actions logged to `owner_audit_logs`
- Includes: action type, target tenant, details, IP address, timestamp

**Impersonation:**
- Read-only access to tenant
- Cannot directly mutate tenant data
- Time-limited tokens

---

## 🚦 Plan Limit Enforcement

### Hard Limits (Operations Blocked)

When a tenant exceeds their plan limits, the following operations are **blocked**:

- ❌ Session creation (if monthly session limit reached)
- ❌ Client creation (if max clients reached)
- ❌ Coach creation (if max coaches reached)
- ❌ SMS sending (if SMS allowance exceeded)
- ❌ Email sending (if email allowance exceeded)
- ❌ File upload (if storage quota exceeded)

### 402 Payment Required Response

```json
{
  "statusCode": 402,
  "message": "Session limit exceeded",
  "error": "Payment Required",
  "details": {
    "limit": 300,
    "current": 305,
    "plan": "Starter",
    "action": "Upgrade your plan to continue booking sessions"
  }
}
```

### Frontend Handling

- `PlanLimitGuard` on protected endpoints
- `UsageLimitBlocker` component intercepts 402 errors
- Modal displayed with upgrade CTA
- Form submissions prevented for blocked actions

---

## 📈 Upgrade Request Workflow

### Tenant Side (Admin Panel)

1. **View Plan & Usage** in Tenant Settings
   - See current plan and usage percentages
   - Progress bars color-coded (green/yellow/red)

2. **Request Upgrade**
   - Click "Upgrade Plan" button
   - Compare available plans in modal
   - Select desired plan
   - Add reason (optional)
   - Submit request

3. **Track Status**
   - See pending request in settings
   - Receive notification when approved/rejected

### Owner Side (Owner Dashboard)

1. **View Requests** in Upgrade Requests page
   - List of all pending requests
   - Tenant info, current plan, requested plan, reason

2. **Review & Approve/Reject**
   - Review request details
   - Add review notes
   - Approve → Plan auto-upgraded, tenant unblocked
   - Reject → Tenant notified with reason

---

## 📝 Implementation Phases

### ✅ Phase 0: Planning & Setup
- [x] Create git branch `feature/owner-admin-dashboard`
- [x] Create implementation plan
- [x] Create task breakdown
- [x] Create project README

### ✅ Phase 1: Backend Infrastructure
- [x] Database migrations (permissions, roles, feature flags, plans, usage)
- [x] Permission system entities and services
- [x] Feature flag system
- [x] Usage tracking and enforcement
- [x] Plan management
- [x] Upgrade request system
- [x] Owner services and controllers

### ✅ Phase 2: Monitoring & Visibility
- [x] System health monitoring
- [x] Cross-tenant analytics
- [x] Alerts and notifications

### ✅ Phase 3: Frontend - Owner Dashboard & Tenant Settings
- [x] Tenant settings enhancement (plan/usage display)
- [x] Upgrade request modal
- [x] Usage limit blocker component
- [x] Owner portal routes and layout
- [x] 9 owner dashboard pages

### ✅ Phase 4: Security & Compliance
- [x] Apply permission guards to all endpoints
- [x] Plan limit guards on protected operations
- [x] Owner audit logging
- [x] Data management (export, anonymization, compliance)

### ✅ Phase 5: Testing & Documentation
- [x] Backend tests (permissions, limits, upgrades)
- [x] Frontend tests (UT, component, and E2E)
- [x] Documentation (guides, API docs, security reference)

---

## 📚 Key Documentation

- **Implementation Plan**: [.gemini/antigravity/brain/*/implementation_plan.md](file:///C:/Users/mohr/.gemini/antigravity/brain/5d44f871-5029-4a74-b73d-a150eba62adc/implementation_plan.md)
- **Task Breakdown**: [.gemini/antigravity/brain/*/task.md](file:///C:/Users/mohr/.gemini/antigravity/brain/5d44f871-5029-4a74-b73d-a150eba62adc/task.md)
- **Project Walkthrough**: [.gemini/antigravity/brain/*/walkthrough.md](file:///C:/Users/mohr/.gemini/antigravity/brain/5d44f871-5029-4a74-b73d-a150eba62adc/walkthrough.md)
- **User Guide**: [docs/OWNER_GUIDE.md](file:///c:/playground/EMS%20Studio/docs/OWNER_GUIDE.md)
- **Security Reference**: [docs/SECURITY_REFERENCE.md](file:///c:/playground/EMS%20Studio/docs/SECURITY_REFERENCE.md)
- **API Reference**: [docs/API_REFERENCE_OWNER.md](file:///c:/playground/EMS%20Studio/docs/API_REFERENCE_OWNER.md)

---

## 🔍 Feature Flag Registry

All features that will be controllable via feature flags:

**Core Operations:**
- `core.sessions` - Sessions & Scheduling
- `core.group_sessions` - Group Sessions
- `core.waiting_list` - Waiting List
- `core.rooms_devices` - Rooms & Devices

**Client Experience:**
- `client.portal` - Client Portal
- `client.gamification` - Gamification
- `client.activity_feed` - Activity Feed
- `client.reviews` - Reviews
- `client.progress_tracking` - Progress Tracking

**Coach Tools:**
- `coach.portal` - Coach Portal
- `coach.availability` - Availability Management
- `coach.analytics` - Coach Analytics

**Business & Finance:**
- `finance.pos` - Point of Sale
- `finance.inventory` - Inventory
- `finance.client_wallet` - Client Wallet/Balance
- `finance.reports` - Financial Reports

**Marketing & Growth:**
- `marketing.leads_crm` - Leads CRM
- `marketing.automation` - Automation Engine
- `marketing.campaigns` - Campaign Templates

**Compliance:**
- `compliance.waivers` - Digital Waivers
- `compliance.parq` - PAR-Q Forms
- `compliance.audit_logs` - Audit Logs

---

## 📦 Default Plans

### Trial Plan
- **Limits**: 20 clients, 2 coaches, 50 sessions/month
- **Messaging**: 50 SMS, 500 emails/month
- **Storage**: 5 GB
- **Features**: Core features only
- **Duration**: 30 days

### Starter Plan
- **Limits**: 100 clients, 5 coaches, 300 sessions/month
- **Messaging**: 200 SMS, 2000 emails/month
- **Storage**: 20 GB
- **Features**: All except automation & advanced compliance

### Pro Plan
- **Limits**: 500 clients, 20 coaches, 2000 sessions/month
- **Messaging**: 1000 SMS, 10000 emails/month
- **Storage**: 100 GB
- **Features**: All features included

### Enterprise Plan
- **Limits**: Unlimited
- **Messaging**: Unlimited
- **Storage**: Unlimited
- **Features**: All features + priority support

---

## 🎨 UI/UX Considerations

### Owner Dashboard
- Fast, functional, data-dense
- Boring is good (operational tool)
- Clear visual hierarchy
- Keyboard shortcuts for common actions

### Tenant Settings
- Prominent plan/usage display
- Visual feedback (progress bars, colors)
- Clear upgrade path
- Non-intrusive when not at limits

### Error Handling
- Clear error messages
- Actionable next steps
- Upgrade CTA when blocked
- Link to support/docs

---

## 🚀 Rollout Strategy

1. **Phase 1**: Deploy permission system, migrate existing roles
2. **Phase 2**: Deploy feature flags (all enabled by default)
3. **Phase 3**: Deploy usage tracking (monitoring only, no blocking)
4. **Phase 4**: Deploy plan limits (soft warnings first)
5. **Phase 5**: Enable hard blocking for new tenants only
6. **Phase 6**: Gradually enable for existing tenants with grace period
7. **Phase 7**: Full rollout of owner dashboard

---

## 📞 Support & Maintenance

### Owner Responsibilities
- Monitor system health daily
- Review upgrade requests promptly
- Manage feature rollouts carefully
- Investigate alerts and errors
- Maintain audit trail

### Future Enhancements
- [ ] Webhook notifications for owner alerts
- [ ] Scheduled reports (weekly tenant activity digest)
- [ ] Advanced analytics (churn prediction, revenue forecasting)
- [ ] Multi-region support
- [ ] API rate limiting per tenant
- [ ] Automated scaling recommendations

---

## 🤝 Contributing

When working on this feature:

1. **Branch**: Always work on `feature/owner-admin-dashboard`
2. **Commits**: Use descriptive commit messages with scope
   - `feat(owner): add tenant suspension endpoint`
   - `feat(permissions): implement permission guard decorator`
   - `fix(limits): correct session count calculation`
3. **Testing**: Write tests for all new functionality
4. **Documentation**: Update this README as features are completed
5. **Review**: Mark tasks as complete in `task.md`

---

## ❓ FAQ

### Q: Will this affect existing tenants?
A: No. All features default to "enabled" and all existing tenants will be on unlimited plans initially. Limits and restrictions will be applied gradually.

### Q: Can tenants see other tenants' data?
A: No. Tenant isolation is maintained. Only platform owners can see cross-tenant data.

### Q: What happens when a limit is reached?
A: The operation is blocked with a 402 error. The tenant sees a modal explaining the limit and prompting them to upgrade.

### Q: Can limits be overridden?
A: No, limits are tied directly to the assigned plan. To provide higher limits, the tenant must be assigned to a higher-tier plan or a custom "Enterprise" plan.

### Q: How are permissions cached?
A: Permission checks will be cached in Redis with a short TTL (5 minutes) to balance security and performance.

---

**Last Updated**: February 3, 2026  
**Maintained By**: Platform Team
