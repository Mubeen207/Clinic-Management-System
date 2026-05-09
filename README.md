# Clinic Management System 🏥

A fully featured, multi-tenant, SaaS-level Healthcare Management application built for modern medical clinics. 

Built with **Next.js 16 (Pages Router)**, **Tailwind CSS**, and **Firebase (Firestore/Auth)**.

## 🚀 Key Features

### 1. Robust Role-Based Access Control (RBAC)
- **4 Distinct Roles**: Admin, Doctor, Receptionist/Staff, and Accountant.
- **Middleware Protected**: Every single route and API call is gated by rigorous security checks.
- **Live Security Sessions**: Admins can Blacklist users. The `AuthContext` uses real-time `onSnapshot` listeners to instantly kick blacklisted users out of their active sessions worldwide.
- **Security Audit Logs**: Every administrative action (Blacklist/Whitelist) is permanently logged in the database and visible to the Accountant.

### 2. Clinical Workflow Engine
- **Appointments System**: Receptionists can book sessions. Doctors can view their `My Schedule` dashboard and start clinical sessions.
- **Dynamic Session Handling**: Sessions transition from "Start Session" to "View Report" the moment a doctor saves diagnoses and prescriptions.
- **Patients Directory**: Track patient history, blood group, contact information, and previous clinical reports.

### 3. Enterprise Communication Suite (NEW)
- **WhatsApp-Style Private Messaging**: Secure, encrypted peer-to-peer chats between authorized staff. Features real-time unread badges, global sidebar notification counters, edit message functionality, soft deletes, and read receipts (`✓✓`).
- **Global Announcements Board**: Admins can broadcast Emergency or Important updates to all staff. Staff can interact using a strict 1-emoji-per-user reaction tracking system. Admins have a dedicated Reaction Viewer modal.
- **Internal Grievances/Complaints**: Staff can formally report issues against colleagues. Admins manage statuses (Pending ➡️ Resolved) through a private administrative dashboard.

### 4. Billing & CSV Reporting
- **Invoicing System**: Generate, track, and mark invoices as Paid/Unpaid.
- **Analytics Dashboard**: Real-time revenue metrics, daily appointment tracking, and uncollected debt trackers.
- **Zero-Dependency CSV Engine**: One-click download logic allows Accountants and Admins to instantly export the entire Clinical History or Security Audit Logs to an Excel/CSV spreadsheet.
- **Print Optimization**: Dedicated CSS rules allow users to `Ctrl+P` any invoice or report; the system automatically hides sidebars and reformats the document into a clean, physical A4 layout.

### 5. Production Ready & Fully Responsive
- Uses Turbopack compiler.
- Real-time `onSnapshot` synchronization for every major list (Doctors, Staff, Announcements, Messages, Patients).
- Built-in Mobile Hamburger menu to allow `DashboardLayout` access on iPhones and Tablets.

## 💻 Tech Stack
- **Framework**: Next.js 16 (Pages Router)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Database/Auth**: Firebase Firestore & Firebase Auth

## 🛠️ Getting Started

First, install all dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

Build the production bundle:
```bash
npm run build
npm start
```
