# Owner Portal User Guide

This guide provides an overview of the EMS Studio Owner Portal, designed for platform administrators to manage tenants, plans, features, and system health.

## 1. Dashboard Overview
The Owner Dashboard provides a high-level snapshot of the entire platform's health and performance.

### Key Metrics
- **Total Revenue**: Aggregated revenue from all active tenant plans over the last 30 days.
- **Active Tenants**: Number of tenants with activity in the last 7 days.
- **Sessions / Tenant**: Average number of sessions booked per tenant.
- **Peak Usage Hour**: Time of day with the highest concurrent session activity.

### System Alerts
Real-time notifications for critical platform events:
- **Usage Alerts**: Tenants approaching 80%+ of their plan limits.
- **System Errors**: Database connectivity issues or high API error rates.
- **Billing**: Failed plan payments or overdue trial expirations.

---

## 2. Tenant Management
Manage individual studio tenants, their status, and their assigned roles.

### Listing & Filtering
- Search tenants by name or contact email.
- Filter by status: `Trial`, `Active`, `Suspended`, or `Blocked`.
- View quick stats for each tenant (Total Clients, Monthly Sessions).

### Tenant Actions
- **Impersonate**: Log in as a tenant administrator to troubleshoot issues or assist with setup.
- **Suspend/Reactivate**: Temporarily disable a tenant's access for billing or compliance reasons.
- **Reset Demo Data**: Wipe all test data from a tenant while preserving their settings and plan.
- **Anonymize (GDPR)**: Clear all PII for a tenant while keeping historical counts for analytics.

### Feature Rollouts
Enable or disable specific features (e.g., "Marketing Automation") for individual tenants, bypassing their plan defaults for beta testing or custom deals.

---

## 3. Plan & Usage Management
Define service levels and enforce resource limits.

### Plan Definitions
Plans (e.g., Starter, Pro, Enterprise) define:
- **Clients**: Maximum number of active clients allowed.
- **Coaches**: Maximum number of coach accounts.
- **Sessions**: Monthly booking limit.
- **Storage**: Storage allowance in GB.
- **Features**: List of core and premium features included.

### Limit Enforcement
When a tenant exceeds their plan limits:
1. **Notifications**: Alerts are sent to the Owner Dashboard and Tenant Settings.
2. **Blocking**: Actions that would exceed the limit (e.g., adding a 101st client on a 100-client plan) are blocked with a `402 Payment Required` error.
3. **Upgrade Path**: Tenants are prompted to request an upgrade to continue.

---

## 4. Tenant Upgrade Process
A formal workflow for handling plan changes.

### Submission
1. A Tenant Admin navigates to **Settings > Plan & Usage**.
2. They select a new plan and provide a reason for the request.
3. The request appears in the **Owner Portal > Upgrade Requests**.

### Review & Approval
1. Owner Admins review the request details and tenant usage history.
2. **Approve**: Automatically updates the tenant's plan and re-evaluates their block status.
3. **Reject**: Keeps the current plan and sends a reason back to the tenant.

---

## 5. Global Messaging (Broadcasts)
Communicate with all users across the platform.

### Creating a Broadcast
1. Select a **Target Audience** (All Users, Tenant Owners, Coaches, or Clients).
2. Use the Rich Text editor to draft your message.
3. **Draft**: Save for later review.
4. **Send**: Immediately delivers the message to all active users in the target group via in-app notifications.

---

## 6. Troubleshooting & Support
- **Audit Logs**: Review the `Audit Log` tab for a history of all administrative actions.
- **System Health**: Check the `System Health` cards for real-time status of DB, Redis, and Storage services.
- **Impersonation**: Use the Impersonation feature to see exactly what a user is seeing.
