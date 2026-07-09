# Service Desk App - Documentation

A comprehensive service desk portal featuring a client simulator, user authentications, and a robust admin/agent management dashboard. 

---

## 🔑 Admin / Agent Credentials

The system is pre-seeded with a default super admin agent account. Use the credentials below to log in:

- **Email Address:** `admin@portal.com`
- **Password:** `admin123`
- **Role:** Agent / Administrator

---

## 👤 Client Features & Instructions

The portal allows users to submit support tickets and track them in real-time.

1. **Self-Service Support Request**:
   - Access the portal and select or register a client account.
   - Click on the **New Support Ticket** form.
   - Enter the request title, choose a report category, and provide detailed description.
   - Click submit to generate a unique tracking reference.

2. **Real-time Tracker**:
   - View submitted tickets and their current status (`CREATED`, `IN_PROGRESS`, `RESOLVED`, etc.).
   - Review historical notes or responses added by assigned support agents.

---

## 🛠️ Admin & Support Agent Features & Instructions

The Agent Dashboard provides service management capabilities to organize, assign, and resolve user requests.

1. **Unified Dashboard**:
   - Toggle between **Tickets Table** and **Users Table** to view structural records.
   - Use the smart search bar to filter tickets or users by keywords, categories, or references.

2. **User Password Visibility (Read-Only)**:
   - For auditing and management purposes, administrators can view the exact user passwords directly in the **Users Table** and the **User Inspector** tab.
   - To prevent accidental modifications, password inputs are greyed out, marked read-only, and disabled for editing.

3. **Inline Record Inspection**:
   - Click on any row to open the inspector pane.
   - Review structural fields, associated account metadata, and chronological histories.

4. **Status & Role Updates**:
   - Manage ticket assignments and update priority status.
   - Modify user classifications and system access (e.g., updating client/agent roles) directly from the admin view.
   - Save modifications seamlessly with the unified action controls.

---

## 🔍 Ticket Tracking API & Reference Normalization

The portal supports a dedicated serverless and container-compatible endpoint for tracking support tickets by token or code.

- **Status Tracking Endpoint**: `GET /api/tickets/status/:token`
- **Normalization Support**:
  - Automatically strips spaces and capitalizes references.
  - Detects 8-character hexadecimal codes and automatically prepends `TKT-` (e.g., `a1b2c3d4` normalizes to `TKT-A1B2C3D4`) for robust query matches.
  - Queries either the dynamic `trackingToken` or normalized `ticketRef` linked to user account metadata.
