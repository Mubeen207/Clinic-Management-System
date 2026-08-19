# Revised Implementation Plan: Firestore Security Rules & Sentence-Case Formatting

## Overview
This revised plan addresses all 9 security and operational requirements for securing the Clinic Management System's Firebase Firestore backend (`firestore.rules` & `firebase.json`) and adding display-only sentence-case text formatting for announcements and complaints.

---

## Data-Model & Architectural Limitations (Explicitly Documented)

### 1. User Directory Read Access (`users` Collection)
- **Constraint:** Frontend features (`messages/index.js`, `appointments/create.js`, `complaints/index.js`) perform `getDocs(collection(db, "users"))` or `query(collection(db, "users"), where("role", "==", "doctor"))` to list contacts, choose doctors, and select complaint targets.
- **Limitation:** In Firestore, Security Rules are NOT filters; if a rule restricts document reads to "own profile or admin", collection-level list queries performed by non-admin staff/doctors will fail with `permission-denied`. Furthermore, Firestore rules cannot perform field-level read projections (hiding password/tempPassword fields during list reads).
- **Resolution:**
  - Authenticated active users (`isActiveUser()`) are granted `read` access to `users` documents to support messaging, doctor selection, and complaints.
  - `create` is strictly limited to initial signup (`request.auth.uid == userId`) enforcing `role == "staff"` and `status == "active"`, while prohibiting password fields (`password`, `tempPassword`, `passwordLastChanged`).
  - `update` is restricted to `admin` only. Users can NEVER modify their own or others' `role` or `status`.

### 2. Patient Directory Access (`patients` Collection)
- **Constraint:** Patient documents contain general demographic data (`name`, `email`, `phone`, `gender`, `age`) but do NOT contain an `assignedDoctorIds` array or `doctorId` field on the patient document. Doctor assignments exist only as `patientId` references inside `appointments`.
- **Limitation:** When doctors access `/patients/listPatients`, the client executes `getDocs(collection(db, "patients"))`. Firestore Security Rules cannot evaluate cross-collection `appointments` queries across an entire collection query.
- **Resolution:**
  - `read` access is granted to active `staff`, `receptionist`, `doctor`, and `admin` users.
  - `create` and `update` rights are restricted to `staff`, `receptionist`, and `admin`.

### 3. Prescriptions & Clinical Reports Storage
- **Constraint:** Prescriptions and clinical notes are stored directly as fields (`prescription`, `notes`) on `appointments` documents (`pages/prescriptions/index.js` queries `appointments` where `doctorId == user.uid`).
- **Resolution:** Access is governed by `appointments` rules. A dedicated `match /prescriptions/{id}` block is also added for explicit fallback coverage.

### 4. Sentence-Case Name Formatting
- **Limitation:** Standard sentence casing converts letters after the start of a sentence to lowercase. Without an external NLP dictionary, arbitrary ALL-CAPS names (e.g., `DR. JOHN DOE`) format as `Dr. john doe`. Medical abbreviations (`MRI`, `OPD`, `ICU`, `DNA`, `Dr.`), URLs, emails, line breaks, emojis, and numbers are preserved.

---

## Detailed Rules Design (`firestore.rules`)

### Helper Functions
```firestore
function signedIn() {
  return request.auth != null;
}

function getUserDoc() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
}

function isActiveUser() {
  return signedIn() && getUserDoc().status == 'active';
}

function getUserRole() {
  return getUserDoc().role;
}

function isAdmin() {
  return isActiveUser() && getUserRole() == 'admin';
}

function isDoctor() {
  return isActiveUser() && getUserRole() == 'doctor';
}

function isStaff() {
  return isActiveUser() && (getUserRole() == 'staff' || getUserRole() == 'receptionist');
}

function isAccountant() {
  return isActiveUser() && getUserRole() == 'accountant';
}

function isOwner(uid) {
  return isActiveUser() && request.auth.uid == uid;
}
```

### Collection-by-Collection Security Rules

1. **`users/{userId}`**:
   - `allow read`: if `isActiveUser()`;
   - `allow create`: if `signedIn()` && `request.auth.uid == userId` &&
       `request.resource.data.role == "staff"` &&
       `request.resource.data.status == "active"` &&
       `!('password' in request.resource.data)` &&
       `!('tempPassword' in request.resource.data)` &&
       `!('passwordLastChanged' in request.resource.data)`;
   - `allow update`: if `isAdmin()` &&
       `!('password' in request.resource.data)` &&
       `!('tempPassword' in request.resource.data)` &&
       `!('passwordLastChanged' in request.resource.data)`;
   - `allow delete`: if false;

2. **`patients/{patientId}`**:
   - `allow read`: if `isActiveUser()` && (`isStaff()` || `isDoctor()` || `isAdmin()`);
   - `allow create, update`: if `isActiveUser()` && (`isStaff()` || `isAdmin()`);
   - `allow delete`: if `isAdmin()`;

3. **`appointments/{appointmentId}`**:
   - `allow read`: if `isActiveUser()` && (`isStaff()` || `isAdmin()` || (`isDoctor()` && resource.data.doctorId == request.auth.uid));
   - `allow create`: if `isActiveUser()` && (`isStaff()` || `isAdmin()`);
   - `allow update`: if `isActiveUser()` && (`isStaff()` || `isAdmin()` || (`isDoctor()` && resource.data.doctorId == request.auth.uid));
   - `allow delete`: if `isAdmin()`;

4. **`invoices/{invoiceId}`**:
   - `allow read`: if `isActiveUser()` && (`isAccountant()` || `isAdmin()` || `isStaff()`);
   - `allow create, update`: if `isActiveUser()` && (`isAccountant()` || `isAdmin()`);
   - `allow delete`: if `isAdmin()`;

5. **`prescriptions/{prescriptionId}`**:
   - `allow read`: if `isActiveUser()` && (`isDoctor()` || `isAdmin()` || `isStaff()`);
   - `allow create, update`: if `isActiveUser()` && (`isDoctor()` || `isAdmin()`);
   - `allow delete`: if `isAdmin()`;

6. **`statusLogs/{logId}`**:
   - `allow read, create`: if `isAdmin()`;
   - `allow update, delete`: if false;

7. **`announcements/{announcementId}`**:
   - `allow read`: if `isActiveUser()`;
   - `allow create, delete`: if `isAdmin()`;
   - `allow update`: if `isAdmin()` || (
       `isActiveUser()` &&
       `request.resource.data.diff(resource.data).affectedKeys().hasOnly(['detailedReactions'])` &&
       `request.resource.data.detailedReactions.keys().hasAll(resource.data.detailedReactions.keys().removeAll([request.auth.uid]))`
     );

8. **`complaints/{complaintId}`**:
   - `allow create`: if `isActiveUser()` && `request.resource.data.reporterId == request.auth.uid`;
   - `allow read`: if `isActiveUser()` && (`isAdmin()` || `resource.data.reporterId == request.auth.uid`);
   - `allow update`: if `isAdmin()`;
   - `allow delete`: if `isAdmin()`;

9. **`chats/{chatId}`**:
   - `allow read`: if `isActiveUser()` && (`request.auth.uid in resource.data.participants` || `isAdmin()`);
   - `allow create`: if `isActiveUser()` && (`request.resource.data.participants.hasAll([request.auth.uid])` || `isAdmin()`);
   - `allow update`: if `isActiveUser()` && (`request.auth.uid in resource.data.participants` || `isAdmin()`) && `request.resource.data.participants == resource.data.participants`;
   - `allow delete`: if `isAdmin()`;

10. **`chats/{chatId}/messages/{messageId}`**:
    - `allow read`: if `isActiveUser()` && (`request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants` || `isAdmin()`);
    - `allow create`: if `isActiveUser()` && `request.resource.data.senderId == request.auth.uid` && (`request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants` || `isAdmin()`);
    - `allow update`: if `isActiveUser()` && (
        `resource.data.senderId == request.auth.uid` ||
        (`request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants` && `request.resource.data.diff(resource.data).affectedKeys().hasOnly(['isRead', 'readAt'])`)
      );
    - `allow delete`: if `isActiveUser()` && `resource.data.senderId == request.auth.uid`;

11. **Default Deny Catch-All**:
    - `match /{document=**} { allow read, write: if false; }`

---

## Proposed File Changes

### Component 1: Security Rules Files
1. **`firestore.rules`** [NEW]: Comprehensive rules implementation as designed above.
2. **`firebase.json`** [NEW]: Configured with `"firestore": { "rules": "firestore.rules" }`.

### Component 2: Display-Only Sentence-Case Formatting
1. **`src/utils/formatSentenceCase.js`** [NEW]:
   - Exports `toSentenceCase(text)`.
   - Uses regex tokenization to preserve URLs (`http://...`), email addresses, line breaks (`\n`), emojis, numbers, and medical abbreviations (`MRI`, `OPD`, `ICU`, `DNA`, `Dr.`).
   - Converts sentence starts to uppercase and normal subsequent text to lowercase.
2. **`pages/announcements/index.js`** [MODIFY]: Applies `toSentenceCase` to announcement title and content display.
3. **`pages/messages/index.js`** [MODIFY]: Applies `toSentenceCase` to announcement message text display in channel view.
4. **`pages/complaints/index.js`** [MODIFY]: Applies `toSentenceCase` to complaint title and description display.

---

## Verification Plan

### Automated Checks
- Run `cmd /c "npm run lint"` to confirm clean code formatting.
- Run `cmd /c "npm run build"` to verify Next.js production build succeeds.

### Deployment Command (Manual)
- Execution command for manual deployment: `firebase deploy --only firestore:rules` (will NOT be executed automatically).
