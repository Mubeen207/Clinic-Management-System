# Security & Authorization Guidelines

## Critical Architecture Rule
Client-side Higher-Order Components (such as `withAuth`) and UI visibility controls handle **user experience and navigation redirection only**. They do NOT provide true backend security. All data access, profile modifications, and document queries MUST be enforced server-side via **Firestore Security Rules**.

---

## Legacy Sensitive Data & Manual Cleanup Instructions

> [!WARNING]
> **Manual Field Cleanup Required Prior to Rules Deployment:**
> Firestore Security Rules operate at the document level and **cannot hide individual sensitive fields during document reads**. If a user document contains legacy fields (such as `password`, `tempPassword`, or `passwordLastChanged`), any authorized user who can read that document will receive those fields in the document payload.
> 
> **Manual Cleanup Steps (Execute Before `firebase deploy`):**
> 1. Open the Firebase Console -> Firestore Database -> `users` collection (or run an administrative node cleanup script).
> 2. Manually inspect user documents and delete any fields named `password`, `tempPassword`, or `passwordLastChanged`.
> 3. Verify that all future user authentications use Firebase Authentication `signInWithEmailAndPassword` and password resets use `sendPasswordResetEmail`.

---

## Final Role-Based Access Control Matrix

The matrix below details the exact permissions enforced by `firestore.rules`:

| Resource / Collection | Unauthenticated | Blacklisted / Disabled | Staff / Receptionist | Doctor | Accountant | Admin |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **User Profiles** (`/users`) | Denied | Denied | Read all (Directory)<br>Create self (`role=staff`) | Read all (Directory) | Read all (Directory) | Full Access (Read/Update/Blacklist) |
| **Patients** (`/patients`) | Denied | Denied | Read, Create, Update | Read | Read | Full Access |
| **Appointments** (`/appointments`) | Denied | Denied | Read, Create, Update | Read/Update assigned (`doctorId == uid`) | Denied | Full Access |
| **Invoices / Billing** (`/invoices`) | Denied | Denied | Read | Denied | Read, Create, Update | Full Access |
| **Prescriptions** (`/prescriptions`) | Denied | Denied | Read | Read, Create, Update assigned (`doctorId == uid`) | Denied | Full Access |
| **Status Audit Logs** (`/statusLogs`) | Denied | Denied | Denied | Denied | Denied | Read, Create |
| **Announcements** (`/announcements`) | Denied | Denied | Read, React (own UID key only) | Read, React (own UID key only) | Read, React (own UID key only) | Full Access (Create/Update/Delete) |
| **Complaints** (`/complaints`) | Denied | Denied | Create, Read own (`reporterId == uid`) | Create, Read own (`reporterId == uid`) | Create, Read own (`reporterId == uid`) | Full Access |
| **Chats** (`/chats`) | Denied | Denied | Participant Read/Update (`lastMessage`, etc.) | Participant Read/Update | Participant Read/Update | Full Access |
| **Messages** (`/chats/*/messages`) | Denied | Denied | Send (`senderId == uid`), Edit own, Mark read | Send, Edit own, Mark read | Send, Edit own, Mark read | Full Access |

---

## Passwords & Credentials Security
- Passwords MUST NOT be stored in Firestore, local storage, or plaintext fields.
- Direct administrative password resets MUST be handled via Firebase Auth reset emails (`sendPasswordResetEmail`).
