# EMS Studio - Admin User Guide

Welcome to the EMS Studio Admin Portal! This guide covers all administrative functions for managing your EMS studio operations.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Managing Studios](#managing-studios)
4. [Managing Coaches](#managing-coaches)
5. [Managing Clients](#managing-clients)
6. [Session Management](#session-management)
7. [Packages & Billing](#packages--billing)
8. [Device Management](#device-management)
9. [Waiting List](#waiting-list)
10. [Reports & Analytics](#reports--analytics)

---

## Getting Started

### Logging In

1. Navigate to `http://your-domain.com/login`
2. Enter your admin email and password
3. Click **Login**

> **Note**: If you have 2FA enabled, you'll be prompted to enter your authentication code.

### First-Time Setup

After registration, complete the onboarding wizard:

1. **Business Information**: Enter your studio name and contact details
2. **First Studio**: Add your primary location with address and operating hours
3. **First Room**: Create at least one training room
4. **First Device**: Register your EMS equipment

---

## Dashboard Overview

The dashboard provides a quick overview of your business:

| Widget | Description |
|--------|-------------|
| **Today's Sessions** | Sessions scheduled for today |
| **Active Clients** | Total clients with active packages |
| **Revenue (Month)** | Current month's revenue |
| **Pending Waitlist** | Clients waiting for available slots |

---

## Managing Studios

### Adding a New Studio

1. Navigate to **Studios** in the sidebar
2. Click **Add Studio**
3. Fill in the details:
   - Studio Name
   - Address
   - Phone Number
   - Operating Hours
4. Click **Save**

### Editing Studio Hours

1. Click on the studio card
2. Modify the operating hours for each day
3. Click **Save Changes**

---

## Managing Coaches

### Adding a Coach

1. Go to **Coaches** → **Add Coach**
2. Enter coach details:
   - Name & Email
   - Phone Number
   - Specializations
   - Working Hours
3. Click **Send Invitation**

> The coach will receive an email to set up their password.

### Setting Coach Availability

1. Select a coach from the list
2. Click **Edit Availability**
3. Set available hours for each day
4. Add any time-off periods
5. Click **Save**

### Deactivating a Coach

1. Select the coach
2. Click **Deactivate**
3. Confirm the action

> Sessions with the deactivated coach will need to be reassigned.

---

## Managing Clients

### Adding a Client

1. Go to **Clients** → **Add Client**
2. Enter client information:
   - Name, Email, Phone
   - Date of Birth
   - Health Notes
3. Click **Save & Invite**

### Viewing Client History

- Click on any client to see their:
  - Session history
  - Package balance
  - InBody measurements
  - Reviews and notes

---

## Session Management

### Creating a Session

1. Navigate to **Sessions** → **New Session**
2. Select:
   - **Client**: Clients are filtered by the selected studio.
   - **Coach**: Coaches are filtered by the selected studio and client gender preference.
   - **Room**: Rooms available in the studio.
   - **Date & Time**
   - **EMS Device** (optional)
3. Click **Create Session**

> **Validations**: The system automatically enforces:
> - **Studio Link**: Both coach and client must belong to the selected studio.
> - **Gender Preference**: Coach must accept the client's gender.
> - **Availability**: Conflict checks for room, coach, and client schedules.

### Session Statuses

| Status | Description |
|--------|-------------|
| **Scheduled** | Upcoming session |
| **Completed** | Session finished successfully |
| **No-Show** | Client didn't attend |
| **Cancelled** | Session was cancelled |

### Completing a Session

1. Select the session
2. Click **Mark Complete**
3. Optionally add notes about the session

---

## Packages & Billing

### Creating a Package

1. Go to **Packages** → **Create Package**
2. Set:
   - Package Name
   - Number of Sessions
   - Price
   - Validity Period
3. Click **Create**

### Assigning a Package to Client

1. Go to Client's profile
2. Click **Assign Package**
3. Select package type
4. Enter payment details
5. Click **Confirm**

---

## Device Management

### Registering Devices

1. Navigate to **Devices** → **Add Device**
2. Enter:
   - Device Name
   - Serial Number
   - Assigned Studio/Room
3. Click **Register**

### Device Maintenance

- Mark devices as "Under Maintenance" when needed
- View usage history and session count

---

## Waiting List

### Managing Waitlist Requests

1. Go to **Waiting List**
2. View pending requests
3. For each request, you can:
   - **Notify Client** when a slot opens
   - **Convert to Session** to book directly
   - **Remove** if no longer needed

---

## Reports & Analytics

Access your business metrics:

- **Revenue Reports**: Daily/Weekly/Monthly breakdown
- **Session Reports**: Attendance rates, popular times
- **Coach Performance**: Sessions per coach, ratings
- **Client Analytics**: Retention, package usage

---

---

## Studio Settings

Configure your studio's global policies and appearance by clicking on **Settings** in the sidebar.

### Branding & Appearance
Customize the look of your portal to match your business identity:
- **Primary Color**: Sets the accent color for buttons, links, and active elements.
- **Logo URL**: Enter a URL for your studio's logo (displayed in headers and emails).

### Coach Permissions
Manage what your coaches are allowed to do:
- **Allow Availability Editing**: 
  - **Enabled**: Coaches can log in and manage their own working hours and time-off requests.
  - **Disabled**: Only Admins can set coach schedules.

### Cancellation Policy
- **Cancellation Window**: Set the minimum hours required for cancellation.
   - If a client cancels within this window, the session credit is forfeited.
   - If cancelled before, the credit is returned.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + N` | New Session |
| `Ctrl + K` | Quick Search |
| `Esc` | Close Modal |

---

## Troubleshooting

### Common Issues

**Can't create a session**
- Check if the room is available
- Verify coach is not already booked
- Ensure client has remaining sessions

**Password reset not working**
- Check spam folder
- Request new reset link
- Contact super admin if locked out

---

## Getting Help

- **Email**: support@ems-studio.com
- **Documentation**: [Full API Docs](/api)
- **In-App Help**: Click the `?` icon in the header
