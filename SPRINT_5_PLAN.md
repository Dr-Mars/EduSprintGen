# SPRINT 5: ADMINISTRATIVE FEATURES & SYSTEM MANAGEMENT

## 📋 SPRINT 5 OVERVIEW

**Status:** Ready to implement (62% of project complete - sprints 1-4 done)  
**Estimated Duration:** 1-2 weeks  
**Key Features:** Admin dashboard, analytics, notifications, document management, system settings  
**Dependencies:** SPRINT 1-4 (All core features complete)  
**Completion Target:** 100% of PFE platform MVP

---

## 🎯 SPRINT 5 OBJECTIVES

Implement administrative features to complete the PFE management platform MVP:
1. **Admin Dashboard** - System overview, statistics, recent activity
2. **Analytics & Reports** - PFE completion rates, success metrics, performance analysis
3. **Notification System** - Email alerts for proposals, defenses, evaluations
4. **Document Archive** - Manage historical records, bulk export
5. **System Settings** - Configuration, academic calendar, defense room management
6. **User Management** - Advanced user admin (activation, role changes, bulk operations)

---

## 📊 PHASE 1: DATA MODELS & SCHEMA

### 1.1 New Tables Required

#### notifications table
```typescript
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(), 
    // "proposal_submitted", "defense_scheduled", "evaluation_ready", etc.
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  relatedId: varchar("related_id", { length: 255 }), // defenseId, proposalId, etc.
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

#### notificationPreferences table
```typescript
export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => users.id),
  emailOnProposalSubmitted: boolean("email_on_proposal_submitted").default(true),
  emailOnProposalValidated: boolean("email_on_proposal_validated").default(true),
  emailOnDefenseScheduled: boolean("email_on_defense_scheduled").default(true),
  emailOnEvaluationReady: boolean("email_on_evaluation_ready").default(true),
  emailDigestFrequency: varchar("email_digest_frequency", { length: 20 })
    .default("daily"), // "daily", "weekly", "never"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

#### archiveRecords table
```typescript
export const archiveRecords = pgTable("archive_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  recordType: varchar("record_type", { length: 50 }).notNull(),
    // "pfe_proposal", "defense", "report", "evaluation"
  recordId: varchar("record_id", { length: 255 }).notNull(),
  recordData: text("record_data").notNull(), // JSON snapshot
  archivedAt: timestamp("archived_at").notNull().defaultNow(),
  archivedBy: uuid("archived_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

#### systemSettings table
```typescript
export const systemSettings = pgTable("system_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(),
    // "defense", "grading", "email", "general"
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

#### auditLogs table (Optional - for compliance)
```typescript
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  resourceType: varchar("resource_type", { length: 50 }).notNull(),
  resourceId: varchar("resource_id", { length: 255 }),
  changes: text("changes"), // JSON of what changed
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

### 1.2 Zod Schemas for New Tables

Create `shared/schema-sprint5.ts`:
```typescript
// Notification Schemas
export const insertNotificationSchema = createInsertSchema(notifications)
  .omit({ id: true, createdAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type SelectNotification = typeof notifications.$inferSelect;

// Notification Preferences Schemas
export const insertNotificationPreferenceSchema = createInsertSchema(notificationPreferences)
  .omit({ id: true, createdAt: true, updatedAt: true });
export type InsertNotificationPreference = z.infer<typeof insertNotificationPreferenceSchema>;

// System Settings Schemas
export const insertSystemSettingSchema = createInsertSchema(systemSettings)
  .omit({ id: true, updatedAt: true });
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;

// Archive Record Schemas
export const insertArchiveRecordSchema = createInsertSchema(archiveRecords)
  .omit({ id: true, createdAt: true });
export type InsertArchiveRecord = z.infer<typeof insertArchiveRecordSchema>;
```

---

## 🔧 PHASE 2: BACKEND SERVICES

### 2.1 NotificationService

**File:** `server/notification-service.ts`

Methods:
- `async createNotification(userId, type, title, message, relatedId?)` - Create notification
- `async getUserNotifications(userId, limit=20)` - Get user's notifications
- `async markAsRead(notificationId)` - Mark single notification read
- `async markAllAsRead(userId)` - Mark all as read
- `async deleteNotification(notificationId)` - Delete notification
- `async getUnreadCount(userId)` - Get unread count

Features:
- Auto-create notifications on key events (proposal submitted, defense scheduled, etc.)
- Preference-aware (respect user's notification settings)
- Batch operations for efficiency

### 2.2 NotificationPreferenceService

**File:** `server/notification-preference-service.ts`

Methods:
- `async getUserPreferences(userId)` - Get user's preferences
- `async updatePreferences(userId, preferences)` - Update preferences
- `async setDefaultPreferences(userId)` - Set defaults for new user

### 2.3 AnalyticsService

**File:** `server/analytics-service.ts`

Methods:
- `async getSystemStats()` - Overall system stats (total users, proposals, defenses, etc.)
- `async getCompletionRate(academicYearId?)` - % of PFEs completed
- `async getAverageScores(academicYearId?)` - Average grades by category
- `async getDefenseStatistics(academicYearId?)` - Defense scheduling stats
- `async getStudentProgress(studentId)` - Individual student progress
- `async getTopPerformers(limit=10, academicYearId?)` - Best students
- `async getStatisticsBySpecialty(academicYearId?)` - Stats per specialty
- `async getStatisticsByCompany(academicYearId?)` - Stats per company

### 2.4 ArchiveService

**File:** `server/archive-service.ts`

Methods:
- `async archiveProposal(proposalId, userId)` - Archive proposal with snapshot
- `async archiveDefense(defenseId, userId)` - Archive defense record
- `async listArchives(filters)` - List archived records
- `async restoreArchive(archiveId, userId)` - Restore from archive
- `async exportArchives(recordType, format)` - Export to CSV/JSON

### 2.5 SettingsService

**File:** `server/settings-service.ts`

Methods:
- `async getSetting(key)` - Get single setting
- `async getAllSettings(category?)` - Get settings by category
- `async updateSetting(key, value)` - Update setting
- `async getDefenseRooms()` - Get available defense rooms
- `async updateDefenseRooms(rooms)` - Update room list
- `async validateSettings()` - Validate all settings

---

## 📡 PHASE 3: API ROUTES

### 3.1 Notification Routes

```
GET    /api/notifications              - Get user's notifications
POST   /api/notifications/:id/read     - Mark as read
POST   /api/notifications/read-all     - Mark all as read
DELETE /api/notifications/:id          - Delete notification
GET    /api/notifications/unread-count - Get unread count
```

### 3.2 Notification Preference Routes

```
GET    /api/user/notification-preferences  - Get preferences
PATCH  /api/user/notification-preferences  - Update preferences
```

### 3.3 Analytics Routes

```
GET    /api/admin/analytics/system-stats           - System overview
GET    /api/admin/analytics/completion-rate        - Completion %
GET    /api/admin/analytics/average-scores         - Grade statistics
GET    /api/admin/analytics/defense-statistics     - Defense stats
GET    /api/admin/analytics/by-specialty           - Per specialty
GET    /api/admin/analytics/by-company             - Per company
GET    /api/admin/analytics/top-performers         - Top 10 students
GET    /api/admin/analytics/student/:id            - Individual student
```

### 3.4 Archive Routes

```
POST   /api/admin/archive/:type/:id    - Archive record
GET    /api/admin/archives              - List archives
GET    /api/admin/archives/:id          - Get single archive
DELETE /api/admin/archives/:id          - Delete archive
POST   /api/admin/archives/export       - Export archives
POST   /api/admin/archives/:id/restore  - Restore from archive
```

### 3.5 Settings Routes

```
GET    /api/admin/settings                - Get all settings
GET    /api/admin/settings/:key          - Get single setting
PATCH  /api/admin/settings/:key          - Update setting
GET    /api/admin/defense-rooms          - Get rooms
PATCH  /api/admin/defense-rooms          - Update rooms
```

### 3.6 User Management Routes

```
GET    /api/admin/users                  - List all users
PATCH  /api/admin/users/:id/role         - Change user role
PATCH  /api/admin/users/:id/status       - Activate/deactivate user
POST   /api/admin/users/bulk-import      - Bulk create users (CSV)
GET    /api/admin/users/export           - Export users
```

---

## 🎨 PHASE 4: FRONTEND PAGES

### 4.1 Admin Dashboard Page

**File:** `client/src/pages/admin-dashboard.tsx`

Components:
- **Header:** Title, refresh button, time range selector
- **Stats Cards:** 
  - Total users (by role)
  - Total PFE proposals
  - Total defenses scheduled
  - Average grade
  - Completion rate %
- **Charts:**
  - Line chart: Proposals over time
  - Bar chart: Average scores by category
  - Pie chart: Completion status distribution
  - Pie chart: Users by role
- **Recent Activity:**
  - Last 10 events (proposals, defenses, evaluations)
  - Timestamp, action, user info

### 4.2 Analytics Page

**File:** `client/src/pages/admin-analytics.tsx`

Sections:
- **System Statistics:**
  - Users breakdown (students, supervisors, coordinators, admins)
  - PFE statistics (total, by status, by specialty, by company)
  - Defense statistics (scheduled, completed, cancelled)
  - Grade distribution chart

- **Performance Metrics:**
  - Average completion rate (current year)
  - Average scores (report, presentation, company)
  - Top 10 performing students
  - Top 10 companies

- **Specialty Breakdown:**
  - Table: Specialty name, # of PFEs, avg score, completion rate
  - Filters: Year, status

- **Company Breakdown:**
  - Table: Company name, # of PFEs, avg scores, completion rate

- **Export Options:**
  - Export data as CSV/JSON
  - Date range selector

### 4.3 Notifications Page

**File:** `client/src/pages/notifications.tsx`

Components:
- **Notification List:**
  - Unread notifications highlighted
  - Notification type icons
  - Title, message, timestamp
  - Mark as read / Delete buttons
  - "Mark all as read" button

- **Notification Preferences Card:**
  - Email notification toggles:
    - Proposal submitted
    - Proposal validated
    - Defense scheduled
    - Evaluation ready
  - Email digest frequency (daily/weekly/never)

### 4.4 Settings Page

**File:** `client/src/pages/admin-settings.tsx`

Tabs:
1. **General Settings**
   - Platform name, description
   - Academic year settings
   - Timezone

2. **Defense Settings**
   - Default defense duration (minutes)
   - Available defense rooms (add/remove/edit)
   - Room availability calendar

3. **Evaluation Settings**
   - Grading scale (currently fixed, but editable)
   - Honor mention thresholds

4. **Email Settings**
   - SMTP configuration (if applicable)
   - Email sender name/address
   - Notification templates

5. **User Management**
   - List all users with role/status
   - Bulk import users (CSV upload)
   - Change user role / activate/deactivate
   - Export user list

### 4.5 User Management Page

**File:** `client/src/pages/admin-users.tsx`

Components:
- **User List Table:**
  - Email, name, role, status, created date
  - Sortable columns
  - Search/filter by email, role, status
  - Pagination (20 per page)

- **Action Buttons:**
  - Edit role (dropdown)
  - Deactivate/Activate (toggle)
  - Delete user
  - Export user data

- **Bulk Operations:**
  - CSV upload to create multiple users
  - Download template
  - Preview before import

### 4.6 Archive Management Page

**File:** `client/src/pages/admin-archives.tsx`

Components:
- **Archive List:**
  - Record type, record ID, archived date, archived by
  - Search by record ID or type
  - Filter by date range

- **Action Buttons:**
  - View/Preview archive
  - Restore archive
  - Download archive
  - Delete archive

---

## 🔌 PHASE 5: INTEGRATION POINTS

### 5.1 Event-Driven Notifications

Trigger notifications when:
- Student submits proposal → Create notification for coordinator/academic supervisor
- Proposal is validated → Create notification for student
- Defense is scheduled → Create notification for jury members, student
- Evaluation is submitted → Create notification for coordinator
- Defense is completed → Create notification for student

### 5.2 Dashboard Integration

Update existing dashboards to use analytics service:
- Student dashboard: Personal progress chart
- Supervisor dashboard: Supervision statistics
- Coordinator dashboard: System overview
- Admin dashboard: Full analytics

### 5.3 Sidebar Navigation Updates

Add new menu items for admin users:
- Dashboard (analytics)
- Notifications
- User Management
- Settings
- Archives

---

## 📋 PHASE 6: IMPLEMENTATION CHECKLIST

### Backend (Week 1)
- [ ] Create new database tables with migrations
- [ ] Implement NotificationService (4 methods)
- [ ] Implement NotificationPreferenceService (3 methods)
- [ ] Implement AnalyticsService (7 methods)
- [ ] Implement ArchiveService (5 methods)
- [ ] Implement SettingsService (6 methods)
- [ ] Add 25+ API routes for all services
- [ ] Update storage interface with new methods
- [ ] Add Zod validation schemas

### Frontend (Week 1-2)
- [ ] Create admin dashboard page with stats and charts
- [ ] Create analytics page with detailed statistics
- [ ] Create notifications page
- [ ] Create settings page (5 tabs)
- [ ] Create user management page
- [ ] Create archives page
- [ ] Update sidebar navigation
- [ ] Add 50+ data-testids for testing

### Testing (Week 2)
- [ ] Test notification creation and retrieval
- [ ] Test analytics calculations
- [ ] Test archive operations
- [ ] Test settings CRUD
- [ ] Test user management operations
- [ ] End-to-end testing of complete flows

---

## 🎯 SUCCESS CRITERIA

- All 4 new services fully implemented with error handling
- All 25+ API endpoints working with proper validation
- Admin dashboard displaying correct statistics
- Notifications working (create, read, delete)
- Settings configurable and persistent
- User management functional
- Archive system working for all record types
- No console errors or warnings
- All new pages have 50+ data-testids

---

## 📊 COMPLETION TARGET

- **Phase 1:** Data models & schema (1 day)
- **Phase 2:** Backend services (2-3 days)
- **Phase 3:** API routes (1-2 days)
- **Phase 4:** Frontend pages (2-3 days)
- **Phase 5:** Integration & testing (1-2 days)

**Total: 7-11 days (1.5-2 weeks)**

**Final Project Completion: 100% PFE Management Platform MVP**

---

## 🚀 NEXT STEPS

1. Read and understand this plan
2. Create database migrations for new tables
3. Implement backend services in order: Notification → Settings → Analytics → Archive
4. Implement API routes and integrate with services
5. Build frontend pages
6. Test complete workflows
7. Deploy to production

---

## 📝 NOTES

- Keep admin features behind role-based access (only coordinator/manager/admin can access)
- Implement caching for analytics (cache for 1 hour to prevent expensive recalculations)
- Use transactions for archive operations to ensure data consistency
- Consider email service integration (SendGrid, AWS SES, etc.) for notifications
- Archive system creates JSON snapshots for auditability
- Settings changes should trigger appropriate cache invalidation
