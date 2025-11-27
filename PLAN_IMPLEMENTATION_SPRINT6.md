# 🚀 PLAN D'IMPLÉMENTATION - SPRINT 6

## Vue d'Ensemble
**Objectif:** Compléter les 15 fonctionnalités manquantes identifiées dans l'audit  
**Durée Estimée:** 8-10 sprints (1-2 semaines)  
**Priorité:** Critique → Moyen → Future  

---

## 📅 PHASE 1: SÉCURITÉ (SPRINT 6A)
**Durée:** 3-4 turns | **Priorité:** 🔴 CRITIQUE

### Tâche 1.1: Implémenter 2FA TOTP
**CDC:** 3.1 - Authentification multi-facteurs  
**Impact:** Sécurité accrue pour admins et sensibles roles

#### Steps:
```
1. Backend Setup (turns 1-2)
   - npm install speakeasy qrcode (ou authenticator)
   - Créer /api/auth/2fa/generate-secret
   - Créer /api/auth/2fa/verify-code
   - Store secret en DB users table (2faSecret field)
   - Store backup codes (2faBackupCodes array)

2. Frontend Setup (turns 2-3)
   - Component 2FA Setup Modal avec QR code
   - Component 2FA Verification (input 6 digits)
   - Backup codes display & download
   - Page settings/security pour enable/disable 2FA

3. Integration (turns 3-4)
   - Middleware middleware check 2FA si enabled
   - Login flow: email/password → 2FA code si enabled
   - Admin force 2FA pour certain roles

Database Changes:
- ALTER TABLE users ADD 2faSecret VARCHAR(255);
- ALTER TABLE users ADD 2faEnabled BOOLEAN DEFAULT false;
- ALTER TABLE users ADD 2faBackupCodes TEXT; (JSON array)
- CREATE TABLE 2fa_sessions (id, userId, tempToken, expiresAt);
```

#### Components à Créer:
- `components/2fa-setup-modal.tsx` - Setup wizard
- `components/2fa-verify-input.tsx` - Code verification
- `pages/settings-security.tsx` - Security preferences page

#### Routes Backend:
```
POST /api/auth/2fa/generate-secret
POST /api/auth/2fa/verify-setup
POST /api/auth/2fa/verify-login
POST /api/auth/2fa/backup-codes
DELETE /api/auth/2fa/disable
```

### Tâche 1.2: Password Reset par Email
**CDC:** 3.1 - Récupération mot de passe lien 30min  
**Impact:** UX critique

#### Steps:
```
1. Database Setup
   - CREATE TABLE password_reset_tokens (
       id UUID PRIMARY KEY,
       userId UUID NOT NULL REFERENCES users(id),
       token VARCHAR(255) NOT NULL UNIQUE,
       expiresAt TIMESTAMP NOT NULL,
       createdAt TIMESTAMP DEFAULT NOW()
     );

2. Backend Routes (1.5-2 turns)
   - POST /api/auth/forgot-password
     * Receive email
     * Generate unique token
     * Set expiry 30 minutes
     * Send email with reset link
   
   - POST /api/auth/reset-password
     * Receive token + newPassword
     * Verify token not expired
     * Hash new password
     * Delete token
     * Log action audit
   
   - GET /api/auth/reset-password/:token
     * Verify token valid
     * Return confirmation page

3. Frontend Routes (1.5-2 turns)
   - Page: /forgot-password
   - Page: /reset-password/:token
   - Email template with reset link

4. Email Service
   - Install email package (nodemailer or SendGrid)
   - Create email template for password reset
   - Function: sendPasswordResetEmail(userId, resetLink)

Security Measures:
- Token 32 chars random cryptographic
- Expiry strict 30 minutes
- Token one-time use only
- New password strength validation (min 8 chars, mixed case, numbers)
- Prevent reuse last 5 passwords (add passwordHistory table)
```

#### Database Schema Additions:
```typescript
// Add to users table
passwordHistory: text("password_history"), // JSON array of hashed passwords

// New table
password_reset_tokens: pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

#### Backend Implementation Outline:
```typescript
// server/auth-service.ts
export const generatePasswordResetToken = async (userId: string) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min
  await storage.createPasswordResetToken(userId, token, expiresAt);
  return token;
};

export const resetPassword = async (token: string, newPassword: string) => {
  const record = await storage.getPasswordResetToken(token);
  if (!record || new Date() > record.expiresAt) {
    throw new Error('Token expired');
  }
  
  // Validate new password not in history
  const user = await storage.getUser(record.userId);
  const passwordHistory = JSON.parse(user.passwordHistory || '[]');
  const matches = await Promise.all(
    passwordHistory.map(h => bcrypt.compare(newPassword, h))
  );
  if (matches.some(m => m)) {
    throw new Error('Password recently used');
  }
  
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await storage.updateUserPassword(record.userId, hashedPassword);
  await storage.addPasswordHistory(record.userId, hashedPassword);
  await storage.deletePasswordResetToken(token);
};
```

---

## 📄 PHASE 2: GESTION DOCUMENTS (SPRINT 6B)
**Durée:** 2-3 turns | **Priorité:** 🔴 CRITIQUE

### Tâche 2.1: Watermarking PDF Automatique
**CDC:** 3.3 - Watermark avec identité étudiant  
**Impact:** Protection droits auteur + Traçabilité

#### Steps:
```
1. Setup (0.5 turns)
   - npm install pdf-lib
   - Créer utils/pdf-watermark.ts

2. Implementation (1.5 turns)
   - Function addWatermarkToPDF(pdfPath, studentId, studentName, uploadDate)
   - Watermark details:
     * Student ID + Name
     * Upload timestamp
     * "PROPRIÉTÉ INTELLECTUELLE" text diagonal
     * Opacity 20% (visible but not disruptive)
     * Applied to all pages
   
   - Call watermark function BEFORE storing PDF
   - Store watermarked PDF in storage
   - Keep original for plagiarism detection

3. Integration (1 turn)
   - Modify /api/reports/upload route
   - Call watermarkPDF before saving
   - Add watermarkAppliedAt to reports table

4. Testing
   - Download report and verify watermark
   - Verify readability not compromised
   - Test with various PDF formats
```

#### Code Implementation:
```typescript
// utils/pdf-watermark.ts
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import fs from 'fs';

export async function addWatermarkToPDF(
  inputPath: string,
  outputPath: string,
  studentId: string,
  studentName: string,
  uploadDate: Date
) {
  const pdfBytes = fs.readFileSync(inputPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  
  const pages = pdfDoc.getPages();
  for (const page of pages) {
    const { width, height } = page.getSize();
    
    // Add watermark text
    page.drawText(`${studentName} (${studentId})`, {
      x: width / 2 - 100,
      y: height / 2,
      size: 20,
      color: rgb(0.9, 0.9, 0.9),
      opacity: 0.2,
      rotate: degrees(45),
    });
    
    page.drawText(`Uploaded: ${uploadDate.toISOString()}`, {
      x: width / 2 - 120,
      y: height / 2 - 30,
      size: 12,
      color: rgb(0.9, 0.9, 0.9),
      opacity: 0.15,
      rotate: degrees(45),
    });
  }
  
  const pdfBytesOutput = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytesOutput);
}
```

---

## ⚙️ PHASE 3: GESTION CONFIGURATION (SPRINT 6C)
**Durée:** 2-3 turns | **Priorité:** 🔴 CRITIQUE

### Tâche 3.1: Gestion Admin Specialties
**CDC:** Req - Admin management specialties  
**Impact:** Configuration système

#### Routes Backend:
```
GET /api/admin/specialties - List all
POST /api/admin/specialties - Create
PUT /api/admin/specialties/:id - Update
DELETE /api/admin/specialties/:id - Delete
```

#### Frontend Page:
```typescript
// pages/admin-specialties.tsx
// Components:
// - SpecialtiesTable with CRUD actions
// - SpecialtyForm (create/edit modal)
// - Validation: code unique, name not empty
// - Soft delete check (cascade PFE proposals)
```

#### Database Validation:
```
- Specialty.code UNIQUE
- Specialty.name NOT NULL
- Check no active PFEs before delete
```

### Tâche 3.2: Gestion Admin PFE Types
**CDC:** Req - Admin management PFE types  
**Impact:** Configuration système

#### Similar to Specialties:
```
GET /api/admin/pfe-types - List all
POST /api/admin/pfe-types - Create
PUT /api/admin/pfe-types/:id - Update
DELETE /api/admin/pfe-types/:id - Delete (with cascade check)
```

#### Frontend Page:
```typescript
// pages/admin-pfe-types.tsx
```

---

## 📊 PHASE 4: AUDIT & LOGS (SPRINT 6D)
**Durée:** 2-3 turns | **Priorité:** 🟡 HAUTE

### Tâche 4.1: Audit Logs Viewer Interface
**CDC:** Admin - Logs sécurité  
**Impact:** Traçabilité opérationnelle

#### Backend Routes:
```
GET /api/admin/audit-logs?filters - List logs with pagination
  - userId filter
  - resourceType filter (pfe_proposal, defense, report, evaluation)
  - action filter (create, update, delete, approve, reject)
  - dateRange filter
  - Pagination (limit, offset)

GET /api/admin/audit-logs/:id - Get single log detail

POST /api/admin/audit-logs/export - Export CSV/JSON
  - Format: CSV or JSON
  - Selected filters applied
```

#### Frontend Page:
```typescript
// pages/admin-audit-logs.tsx
// Components:
// - FilterBar with date picker, dropdowns
// - AuditLogsTable with columns:
//   * Timestamp
//   * User
//   * Action
//   * Resource Type
//   * Resource ID
//   * Changes (before/after)
// - Export buttons (CSV, JSON)
// - Pagination
```

#### Database Query Performance:
```sql
-- Add indexes for performance
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

#### Storage Interface Methods:
```typescript
// Add to IStorage interface
listAuditLogs(filters: {
  userId?: string;
  resourceType?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit: number;
  offset: number;
}): Promise<AuditLog[]>;

getAuditLogDetail(id: string): Promise<AuditLog>;

exportAuditLogs(filters, format: 'json' | 'csv'): Promise<string>;
```

---

## 👥 PHASE 5: UX UTILISATEUR (SPRINT 6E)
**Durée:** 2-3 turns | **Priorité:** 🟡 HAUTE

### Tâche 5.1: Page Coordinateur - Voir Toutes Propositions
**CDC:** 3.2 - Coordinator sees all proposals in department  
**Impact:** UX coordinateur

#### Backend Routes:
```
GET /api/proposals?role=coordinator
  - Return all proposals for user's department
  - Filter by specialty if multi-department
  - Include: student, status, company, dates
```

#### Frontend Page:
```typescript
// pages/all-proposals.tsx or pages/coordinator-proposals.tsx
// Components:
// - ProposalsTable with columns:
//   * Student Name
//   * Title
//   * Specialty
//   * Status
//   * Company
//   * Submitted Date
//   * Action buttons (View, Approve, Reject)
// - Filters:
//   * Status (draft, submitted, to_modify, validated, rejected)
//   * Specialty
//   * Date range
//   * Encadrant assigned (yes/no)
// - Bulk actions:
//   * Approve selected
//   * Reject selected
//   * Export selected
// - Pagination
```

#### Permissions Check:
```typescript
// Only coordinator, manager, administrator can access
const canViewAllProposals = (role) => 
  ['coordinator', 'manager', 'administrator'].includes(role);
```

### Tâche 5.2: Export Calendar iCal Défenses
**CDC:** 2.2 - Interface responsive with export capability  
**Impact:** Intégration utilisateur calendars

#### Backend Setup:
```
- npm install ical
- Create /api/defenses/:id/export-calendar (GET)
- Create /api/defenses/bulk/export-calendar (POST for multi)
```

#### Implementation:
```typescript
// utils/ical-export.ts
import ical from 'ical';

export function generateDefenseIcal(defense: Defense) {
  const cal = ical.createCalendar();
  
  cal.createEvent({
    title: `Defense: ${defense.pfeProposal.title}`,
    description: `Student: ${defense.pfeProposal.student.firstName} ${defense.pfeProposal.student.lastName}`,
    startDate: new Date(defense.scheduledAt),
    duration: { minutes: defense.duration },
    location: defense.room,
    busy: true,
  });
  
  return cal.toString();
}

export function generateDefensesIcal(defenses: Defense[]) {
  const cal = ical.createCalendar();
  
  for (const defense of defenses) {
    cal.createEvent({
      title: `Defense: ${defense.pfeProposal.title}`,
      description: `Student: ${defense.pfeProposal.student.name}`,
      startDate: new Date(defense.scheduledAt),
      duration: { minutes: defense.duration },
      location: defense.room,
      busy: true,
    });
  }
  
  return cal.toString();
}
```

#### Frontend UI:
```typescript
// In defense-scheduling.tsx or defense details
<Button onClick={exportToCalendar}>
  <Download className="w-4 h-4 mr-2" />
  Export Calendar
</Button>

const exportToCalendar = async (defenseId: string) => {
  const response = await fetch(`/api/defenses/${defenseId}/export-calendar`);
  const ical = await response.text();
  
  const blob = new Blob([ical], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `defense-${defenseId}.ics`;
  a.click();
};
```

---

## 📋 CHECKLIST D'IMPLÉMENTATION

### SPRINT 6 - CRITICALS (Weeks 1-2)

- [ ] **Semaine 1A: 2FA TOTP**
  - [ ] Database migrations (2fa fields)
  - [ ] Backend routes (generate, verify, backup codes)
  - [ ] Frontend components (setup modal, verify input)
  - [ ] Login flow integration
  - [ ] Testing (setup, verify, recovery)

- [ ] **Semaine 1B: Password Reset**
  - [ ] Database setup (reset_tokens table, passwordHistory)
  - [ ] Backend routes (forgot, reset, verify token)
  - [ ] Email service setup
  - [ ] Frontend pages (forgot-password, reset-password)
  - [ ] Testing (token expiry, reuse prevention)

- [ ] **Semaine 2A: Watermarking & Specialties**
  - [ ] PDF watermarking implementation
  - [ ] Integration with upload route
  - [ ] Admin specialties CRUD page
  - [ ] Admin specialties backend routes
  - [ ] Testing (watermark quality, permissions)

- [ ] **Semaine 2B: Configuration & Audit**
  - [ ] Admin PFE types CRUD page
  - [ ] Admin audit logs viewer
  - [ ] Audit logs backend routes
  - [ ] Database indexes for performance
  - [ ] Testing (filtering, export, pagination)

- [ ] **Semaine 2C: UX Improvements**
  - [ ] Coordinator all-proposals page
  - [ ] Calendar export iCal
  - [ ] Testing all new features
  - [ ] UI/UX refinements
  - [ ] Performance optimization

---

## 📊 EFFORT ESTIMATES

| Task | Turns | Complexity | Dependencies |
|------|-------|-----------|--------------|
| 2FA TOTP | 4 | High | None |
| Password Reset | 3-4 | High | Email service |
| Watermarking PDF | 2 | Medium | pdf-lib |
| Specialties CRUD | 1.5 | Low | None |
| PFE Types CRUD | 1.5 | Low | None |
| Audit Logs Viewer | 2.5 | Medium | Database indexes |
| All Proposals Page | 1.5 | Low | None |
| Calendar Export | 1.5 | Low | ical package |
| **TOTAL** | **~18 turns** | **Medium/High** | **Sequential** |

---

## 🔧 TECHNICAL REQUIREMENTS

### Packages à Installer
```json
{
  "speakeasy": "^2.0.0",
  "qrcode": "^1.5.0",
  "pdf-lib": "^1.17.0",
  "ical": "^0.1.0",
  "nodemailer": "^6.9.0"
}
```

### Database Migrations
```sql
-- Add to users table
ALTER TABLE users ADD COLUMN 2fa_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN 2fa_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN 2fa_backup_codes TEXT;
ALTER TABLE users ADD COLUMN password_history TEXT;

-- New tables
CREATE TABLE password_reset_tokens (...);
ALTER TABLE reports ADD COLUMN watermark_applied_at TIMESTAMP;
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
```

### Environment Variables à Ajouter
```
EMAIL_SERVICE=nodemailer
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@pfe-platform.com
TOTP_WINDOW=1
```

---

## ✅ CRITÈRES DE SUCCÈS

- [ ] 2FA TOTP fully functional avec QR code
- [ ] Password reset working 30-min expiry
- [ ] PDF watermarks visible on all uploaded reports
- [ ] Admin can manage specialties/pfe-types
- [ ] Audit logs searchable et exportable
- [ ] Coordinator can view/filter all proposals
- [ ] Calendar export compatible with Google/Outlook/Apple Calendar
- [ ] All new features tested and working
- [ ] Zero security issues found in audit
- [ ] Performance <3s for all new pages

---

## 📝 NOTES

- **Séquençage:** 2FA et Password Reset doivent être faits EN PREMIER (sécurité)
- **Testing:** Chaque feature doit avoir tests unitaires + integration tests
- **Documentation:** Mettre à jour USER_GUIDE.md avec nouvelles features
- **Deployment:** Test thoroughly en staging avant production

---

*Plan créé: 27 Novembre 2025*  
*Prochaine revue: Après SPRINT 6A complétion*
