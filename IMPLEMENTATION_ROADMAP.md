# EMS Studio - Implementation Roadmap

> **Last Updated**: January 29, 2026  
> **Status**: ✅ Phase 3 Complete - Phase 4 In Progress (Gap Remediation Complete)

---

## 📊 Project Status

### ✅ Completed Foundation
- **19 Backend Modules** (Auth, Tenants, Studios, Rooms, Coaches, Clients, Sessions, Devices, Packages, Waiting List, Reviews, InBody, Notifications, Storage, Mailer, Reminders, Dashboard, Client Portal, Coach Portal)
- **Database Schema** with multi-tenancy and row-level security
- **7 Migrations** for extended features
- **Frontend** with Admin, Client, and Coach portals
- **Redis Caching** and **MinIO Storage** configured

### ⚠️ Critical Gaps Identified
### ⚠️ Critical Gaps Identified
- ✅ **Automated tests** (Implemented in Phase 1.1)
- ✅ **Monitoring/logging infrastructure** (Implemented in Phase 1.2)
- ✅ **Security features** (2FA, Password Reset, Rate Limiting - Fully Implemented)
- ✅ **Documentation** (Guides created)

---

## 🎯 Implementation Phases

### Phase 1 - Critical (Must-Have for Production) ⭐

**Priority**: HIGHEST  
**Timeline**: 3-4 weeks

#### 1.1 Automated Testing
- [x] Backend unit tests (Jest) - **230 tests, 100% passing, 14 services**
  - [x] Auth service (32 tests)
  - [x] Sessions service (28 tests - scheduling/conflicts)
  - [x] Packages service (25 tests)
  - [x] Client portal service (23 tests)
  - [x] Waiting list service (20 tests)
  - [x] Clients service (16 tests)
  - [x] Coaches service (16 tests)
  - [x] Studios service (12 tests)
  - [x] Rooms service (12 tests)
  - [x] Tenants service (14 tests)
  - [x] Devices service (14 tests)
  - [x] Reviews service (14 tests)
  - [x] Dashboard service (5 tests)
  - [x] Coach portal service (19 tests)
- [x] Backend E2E tests (created - requires database to run)
  - [x] auth.e2e-spec.ts - Registration & login flow
  - [x] sessions.e2e-spec.ts - Booking & conflict detection
  - [x] packages.e2e-spec.ts - Assignment & balance tracking
- [x] Frontend component tests (Vitest) - **40 tests, 2 components, 3 services**
  - [x] auth.service.test.ts (8 tests)
  - [x] api.test.ts (9 tests)
  - [x] sessions.service.test.ts (10 tests)
  - [x] Modal.test.tsx (5 tests)
  - [x] ConfirmDialog.test.tsx (8 tests)
- [x] Integration tests for critical workflows (E2E tests)
- [x] **Target**: 80%+ backend / 60%+ frontend coverage

#### 1.2 Monitoring & Logging
- [x] Structured logging (Winston/Pino)
- [x] Error tracking integration (Sentry)
- [x] Performance metrics collection
- [x] Enhanced health checks (DB, Redis, MinIO)
- [x] Prometheus metrics endpoints

#### 1.3 Security Enhancements
- [x] Password reset functionality
- [x] 2FA (Time-based OTP)
- [x] Rate limiting middleware
- [x] Account lockout after failed attempts
- [x] Security headers (CORS, CSP, HSTS)
- [x] Data encryption for sensitive fields
- [x] **New**: 2FA Enforcement for Staff (Admin Settings)

#### 1.4 Documentation
- [x] Update main README with screenshots
- [x] User guides (Admin, Client, Coach) - `docs/ADMIN_GUIDE.md`, `docs/CLIENT_GUIDE.md`, `docs/COACH_GUIDE.md`
- [x] API documentation improvements
- [x] Deployment guide - `docs/DEPLOYMENT.md`
- [x] Troubleshooting guide - `docs/TROUBLESHOOTING.md`
- [x] Testing guide - `docs/TESTING.md`

---

### Phase 2 - High Impact (Core Features) 🚀

**Priority**: HIGH  
**Timeline**: 5-7 weeks

#### 2.1 Advanced Analytics & Reporting ✅
- [x] Revenue analytics & forecasting (Basic forecasting implemented)
- [x] Client acquisition & retention metrics
- [x] Coach performance analytics
- [x] Operational insights (room/device utilization)
- [x] Financial reporting
- [x] Waiting list analytics
- [x] Interactive dashboards with charts
- [x] Export to CSV/PDF

#### 2.2 Enhanced Client Portal ✅
- [x] Improved booking UX
- [x] Better progress tracking visualization
- [x] Photo upload for avatars (Image Utility implemented)
- [x] Health goal tracking (Target weight, sessions, etc.)
- [x] Achievement badges (Automated logic)
- [x] Social Leaderboard & Activity Feed (Privacy-aware)
- [x] **Client Finance**: Transaction History & Balance Management
- [x] **Client Waivers**: View Signed Waivers


#### 2.4 Performance Optimization ✅
- [x] Redis caching for frequently accessed data
- [x] Database query optimization (Indexed by ORM)
- [x] Frontend code splitting
- [x] PWA features (service worker, offline mode)

#### 2.5 Booking Improvements (Advanced) ⏳
- [x] Favorite Coach (Completed)
- [x] Recurring Bookings logic
- [x] Bulk session management

#### 2.6 Group Sessions & Shared Resources (New) ✅
- [x] **Schema Update**: Support multiple clients per coach/room (1:N)
- [x] **Capacity Management**: Enforce Room/Device capacity limits > 1
- [x] **Group Booking UI**: Admin ability to book multiple clients into one slot
- [x] **Duo/Group Classes**: "Join Session" functionality for clients
- [x] **Utilization Analytics**: Update logic to track capacity % (not just binary occupied/free)

#### 2.7 Retail & Inventory (New - Market Gap) 🛒
- [x] **Product Catalog**: Create products (Water, Shakes, Suits) with prices/stock
- [x] **Point of Sale (POS)**: "Cart" functionality for Admins to sell items
- [x] **Inventory Tracking**: Stock deductions and simple restocking logs
- [x] **On-Account Charging**: "Put on Tab" functionality for clients
- [x] **Sales Reporting**: Separate Service Revenue vs. Product Revenue (POS Report)

#### 2.8 Legal & Compliance (Critical) ⚖️
- [x] **Digital Waivers**: Flexible HTML contracts signature capture
- [x] **Signature Storage**: Secure storage of client signatures
- [x] **PAR-Q Forms**: Medical readiness questionnaire on onboarding
- [x] **Terms Acceptance**: Versioned Terms of Service tracking

---

### Phase 3 - Enhanced Features 📈

**Priority**: MEDIUM  
**Timeline**: 4-5 weeks

#### 3.1 Tenant Settings & Custom Branding ⭐
- [x] Backend: Logo upload to MinIO (Handled via URL for now)
- [x] Backend: Primary/secondary color fields
- [x] Frontend: Editable tenant information
- [x] Frontend: Logo upload component (URL Input)
- [x] Frontend: Color picker for branding
- [x] Frontend: Live preview of branding
- [x] Frontend: Apply custom branding to UI

#### 3.2 Enhanced Client Profiles
- [x] Photo uploads for client avatars (Implemented in 2.2)
- [x] Health goals tracking
- [x] Progress photos gallery
- [x] Notes and medical history

#### 3.3 Coach Availability Management ✅
- [x] Visual weekly availability editor
- [x] Recurring time-off support
- [x] Override specific dates
- [x] Availability sync

#### 3.4 Recurring Sessions ✅
- [x] Recurrence pattern handling (daily, weekly, monthly)
- [x] Bulk session creation with conflict detection
- [x] Edit single vs. all future sessions

---

### Phase 4 - Growth, Marketing & Integrations 🌐

**Priority**: MEDIUM  
**Timeline**: 3-4 weeks

#### 4.1 Calendar Integration (Nice to Have) ✅
- [x] Google Calendar integration (Done via iCal)
- [x] iCal export for sessions
- [x] Calendar sync for coaches
- [x] Auto-add sessions to client calendars (via iCal feed)

#### 4.2 Marketing Automation & Lead CRM (Expanded) ⭐
- [x] **Lead Pipeline Board**: Kanban view (New -> Contacted -> Trial -> Converted)
- [x] **Lead Source Tracking**: Attribution (Facebook, Walk-in, Referral)
- [x] **"Smart Triggers" Engine**: (Inactive Client, Birthday, Low Balance)
- [x] **Automated Email/SMS Drip Campaigns**: Onboarding flows (Persistent Execution Engine)
  - [x] **Automation Rule Editor**: Multi-step sequence builder
  - [x] **Execution Queue**: Admin view for monitoring active campaigns
  - [x] **Examples Library**: Quick-start templates modal
- [ ] **Push Notifications for PWA**: Re-engagement


#### 4.3 Notification Enhancements ✅
- [x] SMS notifications (Twilio)
- [x] In-app notification center
- [x] Notification preferences management
- [x] Notification templates

#### 4.4 Growth Tools (New)
- [-] Referral Program ("Give $20, Get $20" logic) (Deferred)
- [ ] Guest/Family Account Linking (Shared Credits)
- [ ] First-class ClassPass/Aggregator API support

#### 4.5 Advanced Search
- [ ] Full-text search for clients/coaches
- [ ] Fuzzy matching support
- [ ] Search filters

#### 4.6 Audit Logging
- [ ] Track all critical entity changes
- [ ] Queryable audit trail
- [ ] Compliance reporting

#### 4.7 Internationalization (Arabic + English) - Pre-Release ⭐
- [ ] Backend i18n for emails/notifications
- [ ] Frontend i18next setup
- [ ] Arabic translations (RTL support)
- [ ] English translations
- [ ] RTL layout configuration
- [ ] Date/time/currency localization
- [x] Language selector in Admin Settings (System Preference)

---

### Future Phases (Post-Launch) 🔮

**Priority**: LOW  
**Timeline**: TBD

#### Revenue & Subscriptions (Strategic Pivot)
- [ ] **Automated Subscription Billing** (Stripe/Adyen) - *Required for "Unlimited" memberships*
- [ ] Auto-renewal logic & Dunning management
- [ ] Membership freezing/pausing

#### Mobile App
- [ ] React Native client portal
- [ ] Push notifications
- [ ] Offline-first architecture
- **Note**: Implement once all web features are complete

#### AI Features
- [ ] Session recommendations
- [ ] Churn prediction
- [ ] Capacity optimization

#### Marketplace Features
- [ ] Public coach profiles
- [ ] Online booking widgets
- [ ] Multi-location support

---

## 📊 Detailed Analytics Plan

### Analytics Categories (7+ weeks implementation)

**Week 1-2: Core Metrics** ✅
- [x] Revenue reporting (total, by period, by package)
- [x] Client count and acquisition
- [x] Session volume reporting
- [x] Basic coach session counts

**Week 3-4: Analytics Dashboard** ✅
- [x] Frontend dashboard layout
- [x] Interactive charts (Recharts)
- [x] Date range filters
- [x] CSV export

**Week 5-6: Advanced Analytics** ✅
- [x] Client retention & churn analysis
- [x] Coach performance comparisons
- [x] Room/device utilization
- [x] Waiting list analytics

**Week 7+: Predictive Features**
- [ ] Revenue forecasting
- [ ] At-risk client identification
- [ ] Capacity planning
- [ ] PDF export with charts

### Key Reports to Implement
1. **Revenue Analytics**: Daily/weekly/monthly trends, by package type, forecasting
2. **Client Analytics**: Acquisition, retention, engagement, progress tracking
3. **Coach Performance**: Session volume, ratings, revenue attribution, utilization
4. **Operational Insights**: Room occupancy, device usage, scheduling efficiency
5. **Financial Reports**: Cash flow, receivables, profit margins
6. **Waiting List**: Conversion rates, demand analysis, high-demand periods

**Full Analytics Details**: See `docs/analytics_reporting_plan.md` (to be created)

---

## ❌ Deferred/Not Implementing

- **CI/CD Deployment Pipeline** - Not needed at this time
- **Stripe Payment Integration** - Remaining with cash payments and manual verification

---

## 🛠️ Technology Stack

### Backend
- NestJS (Node.js)
- PostgreSQL 16 with TypeORM
- Redis 7 (caching & queuing)
- MinIO (S3-compatible storage)
- JWT authentication
- Nodemailer for emails

### Frontend
- React 19 with Vite
- TypeScript
- Tailwind CSS
- React Router
- Recharts (analytics)
- i18next (internationalization)

### DevOps & Tools
- Docker & Docker Compose
- Jest (backend testing)
- Vitest (frontend testing)
- Winston/Pino (logging)
- Sentry (error tracking)

---

## 📝 Progress Tracking

### Current Sprint: Phase 4 & Polish 🚀

**Progress**: Phase 4 well underway ✅

**Status**: In Progress (January 28, 2026)

### Completed Milestones
- ✅ Project foundation & Core Phases 1 & 2
- ✅ Phase 3.1 Tenant Settings & Custom Branding
- ✅ Phase 3.2 Enhanced Client Profiles
- ✅ Phase 3.3 Coach Availability Management
- ✅ Phase 3.4 Recurring Sessions
- ✅ Phase 4.1 Calendar Integration
- ✅ Phase 4.2 Marketing Automation (Drip Campaigns, Rules, Queue)
- ✅ Phase 4.3 Notification Enhancements (In-App Center)

### Next Milestones
- ⏳ Phase 4.7 Internationalization (Pre-Release)
- ⏳ Phase 4.4 Growth Tools

---

## 🔗 Related Documentation

- [Main README](./README.md) - Project overview and setup
- [Architecture Documentation](./docs/ARCHITECTURE.md) - To be created
- [API Documentation](http://localhost:3000/api) - Swagger UI
- [Analytics Plan](./docs/analytics_reporting_plan.md) - To be created
- [Deployment Guide](./docs/DEPLOYMENT.md) - To be created

---

## 📞 Getting Started with Implementation

### For Developers

1. **Review the current codebase**
   ```bash
   cd backend && npm run start:dev
   cd frontend && npm run dev
   ```

2. **Pick a phase to work on** (recommend starting with Phase 1)

3. **Create feature branch**
   ```bash
   git checkout -b feature/phase-1-testing
   ```

4. **Follow the checklist** in this roadmap

5. **Update this file** as you complete tasks

### For Project Managers

- Track progress by checking/unchecking items in this roadmap
- Use GitHub Issues to track individual tasks
- Review completed phases before moving to the next

---

## 📈 Success Metrics

### Phase 1 Success Criteria
- [ ] 80%+ test coverage on backend
- [ ] 60%+ test coverage on frontend
- [ ] All critical workflows have E2E tests
- [ ] Monitoring dashboards operational
- [ ] Zero critical security vulnerabilities

### Phase 2 Success Criteria
- [ ] All key analytics reports functional
- [ ] Arabic and English translations complete
- [ ] Client portal UX improvements complete
- [ ] Page load times < 2s

### Phase 3 Success Criteria
- [ ] Tenant branding fully customizable
- [ ] Recurring sessions working smoothly
- [ ] Coach availability management streamlined

---

## 🤝 Contributing

When implementing features from this roadmap:

1. Check off items as you complete them
2. Add notes/comments for any deviations from the plan
3. Update timelines if needed
4. Link to relevant PRs or commits
5. Keep this document up to date

---

**Questions or need clarification?** Review the detailed plans in the `.gemini/antigravity/brain/` folder or create an issue.
