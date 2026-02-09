# Automation & Marketing Guide

This guide explains how to set up and manage automation rules within EMS Studio. Automations allow you to trigger actions (like sending emails or WhatsApp messages) based on specific events in the system.

## Core Concepts

An automation rule consists of:
1.  **Trigger**: The event that starts the automation.
2.  **Conditions**: Optional filters to narrow down when the trigger should fire.
3.  **Action Sequence**: One or more steps to execute, with optional delays between them.

---

## 1. Triggers

The following triggers are currently supported:

| Trigger ID | Description |
| :--- | :--- |
| `new_lead` | Fires when a new lead is created in the system. |
| `inactive_client` | Fires when a client has not booked a session for a certain period. |
| `birthday` | Fires on a client's birthday. |
| `session_completed` | Fires immediately after a session is marked as completed. |
| `session_reminder` | Fires 24 hours before a scheduled session. |
| `lead_status_changed` | Fires when a lead's status is updated (e.g., from 'new' to 'contacted'). |

---

## 2. Template Library

We provide several pre-designed email templates. Use the `templateId` field in your `send_email` payload to use these.

| Template ID | Description | Key Variables Supported |
| :--- | :--- | :--- |
| `welcome_v1` | A warm welcome message for new leads/clients. | `{{userName}}`, `{{studioName}}`, `{{portalUrl}}` |
| `birthday_promo` | Happy birthday message with a 20% discount code (`BDAY20`). | `{{userName}}`, `{{portalUrl}}` |
| `session_reminder_v1` | Reminder sent 24 hours before a session. | `{{userName}}`, `{{sessionTime}}`, `{{studioName}}` |
| `Session_complete` | "Great job!" message sent after a session is done. | `{{userName}}`, `{{sessionTime}}`, `{{studioName}}` |

---

## 3. Actions & Configuration

Each step in an automation sequence requires a **JSON Configuration** payload.

### Send Email (`send_email`)
**Format:**
```json
{
  "templateId": "welcome_v1"
}
```

### Send WhatsApp (`send_whatsapp`)
**Official Template (Meta):**
```json
{
  "templateName": "session_reminder_v1",
  "components": [
    {
      "type": "body",
      "parameters": [
        { "type": "text", "text": "{{clientName}}" },
        { "type": "text", "text": "{{sessionTime}}" }
      ]
    }
  ]
}
```

**Free-form Message:**
```json
{
  "body": "Hi {{userName}}! Just a reminder about your session at {{sessionTime}}."
}
```

---

## 4. Dynamic Variables

Use these placeholders anywhere in your text, subjects, or parameters:

| Variable | Output |
| :--- | :--- |
| `{{userName}}` | First name (e.g., "John") |
| `{{sessionTime}}` | Formatted date/time (e.g., "Jan 20, 10:00 AM") |
| `{{studioName}}` | Your studio's name |
| `{{portalUrl}}` | Link to client portal |

---

## 5. Practical Examples

### A. Basic (1-Step) Examples

#### 1. Instant Welcome Email
- **Trigger**: `new_lead`
- **Delay**: 0 mins
- **Action**: `send_email`
- **Payload**: `{ "templateId": "welcome_v1" }`

#### 2. Session Reminder (WhatsApp)
- **Trigger**: `session_reminder`
- **Delay**: 0 mins
- **Action**: `send_whatsapp`
- **Payload**: `{ "body": "Hi {{userName}}! See you tomorrow at {{sessionTime}} at {{studioName}}." }`

#### 3. Session Completed Feedback (Email)
- **Trigger**: `session_completed`
- **Delay**: 30 mins
- **Action**: `send_email`
- **Payload**: `{ "templateId": "Session_complete" }`

---

### B. Advanced (Multi-Step) Examples

#### 1. Lead Nurturing Sequence (Email + WhatsApp)
This sequence reaches out immediately via email and follows up 2 days later on WhatsApp.

- **Trigger**: `new_lead`
- **Step 1** (Delay: 0m):
    - Action: `send_email`
    - Payload: `{ "templateId": "welcome_v1" }`
- **Step 2** (Delay: 2880m - 48 hours later):
    - Action: `send_whatsapp`
    - Payload: `{ "body": "Hi {{userName}}! Just checking in to see if you had any questions about our trial sessions. Hope to see you soon!" }`

#### 2. High-Performance Client Reward
Congratulate a client after a session and create a task for staff to check in.

- **Trigger**: `session_completed`
- **Step 1** (Delay: 10m):
    - Action: `send_email`
    - Payload: `{ "templateId": "Session_complete" }`
- **Step 2** (Delay: 60m):
    - Action: `create_task`
    - Payload: `{ "taskTitle": "Call {{clientName}} for feedback on today's session", "priority": "normal" }`

---

## 6. Using Conditions (Advanced)

Conditions allow you to filter *which* entities trigger the rule.

**Example: Lead Status Filter**
Only trigger if a lead's status changes to "potential".
- **Trigger**: `lead_status_changed`
- **Conditions**: `{ "newStatus": "potential" }`

**Example: Inactivity Period**
Trigger if a client hasn't been seen for 30 days.
- **Trigger**: `inactive_client`
- **Conditions**: `{ "daysSinceLastSession": 30 }`

---

## 7. Troubleshooting Tips

*   **Delay Logic**: Each step's delay is relative to the *trigger event*, not the previous step.
*   **JSON Validity**: Use a JSON validator if you see errors. Payloads must be valid JSON strings.
*   **WhatsApp**: Make sure your `whatsapp` feature flag is enabled in Settings.
