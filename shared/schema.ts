import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, pgEnum, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", [
  "student",
  "academic_supervisor",
  "company_supervisor",
  "coordinator",
  "manager",
  "administrator",
]);

export const pfeTypeEnum = pgEnum("pfe_type", [
  "academic",
  "company",
  "research",
]);

export const pfeStatusEnum = pgEnum("pfe_status", [
  "draft",
  "submitted",
  "to_modify",
  "validated",
  "rejected",
]);

export const defenseStatusEnum = pgEnum("defense_status", [
  "scheduled",
  "completed",
  "cancelled",
]);

export const juryRoleEnum = pgEnum("jury_role", [
  "president",
  "rapporteur",
  "examiner",
  "supervisor",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "proposal_submitted",
  "proposal_validated",
  "proposal_rejected",
  "defense_scheduled",
  "defense_cancelled",
  "evaluation_ready",
  "evaluation_submitted",
  "results_available",
  "system_announcement",
]);

export const emailDigestEnum = pgEnum("email_digest_frequency", [
  "daily",
  "weekly",
  "never",
]);

export const recordTypeEnum = pgEnum("record_type", [
  "pfe_proposal",
  "defense",
  "report",
  "evaluation",
]);

export const actionTypeEnum = pgEnum("action_type", [
  "create",
  "update",
  "delete",
  "approve",
  "reject",
  "schedule",
  "cancel",
]);

// Tables
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  role: roleEnum("role").notNull().default("student"),
  photoUrl: text("photo_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const academicYears = pgTable("academic_years", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const specialties = pgTable("specialties", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  department: varchar("department", { length: 100 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  website: text("website"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pfeProposals = pgTable("pfe_proposals", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  type: pfeTypeEnum("type").notNull(),
  status: pfeStatusEnum("status").notNull().default("draft"),
  description: text("description"),
  context: text("context"),
  problematic: text("problematic"),
  objectives: text("objectives"),
  technologies: text("technologies"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  studentId: uuid("student_id").notNull().references(() => users.id),
  academicSupervisorId: uuid("academic_supervisor_id").references(() => users.id),
  companySupervisorId: uuid("company_supervisor_id").references(() => users.id),
  companyId: uuid("company_id").references(() => companies.id),
  specialtyId: uuid("specialty_id").references(() => specialties.id),
  academicYearId: uuid("academic_year_id").references(() => academicYears.id),
  validationComments: text("validation_comments"),
  cvUrl: text("cv_url"),
  motivationLetterUrl: text("motivation_letter_url"),
  documentsUrl: text("documents_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  submittedAt: timestamp("submitted_at"),
  validatedAt: timestamp("validated_at"),
});

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  pfeProposalId: uuid("pfe_proposal_id").notNull().references(() => pfeProposals.id),
  type: varchar("type", { length: 50 }).notNull(), // "midterm", "final", etc.
  version: integer("version").notNull().default(1),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"), // in bytes
  uploadedById: uuid("uploaded_by_id").notNull().references(() => users.id),
  comments: text("comments"),
  plagiarismScore: integer("plagiarism_score"), // 0-100
  plagiarismAnalyzedAt: timestamp("plagiarism_analyzed_at"),
  watermarkAppliedAt: timestamp("watermark_applied_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const defenses = pgTable("defenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  pfeProposalId: uuid("pfe_proposal_id").notNull().references(() => pfeProposals.id),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").notNull().default(60), // in minutes
  room: varchar("room", { length: 100 }),
  status: defenseStatusEnum("status").notNull().default("scheduled"),
  presentationScore: integer("presentation_score"), // 0-20
  reportScore: integer("report_score"), // 0-20
  companyScore: integer("company_score"), // 0-20
  finalScore: integer("final_score"), // calculated from all scores
  mention: varchar("mention", { length: 50 }), // "Excellent", "Très Bien", etc.
  comments: text("comments"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const juryMembers = pgTable("jury_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  defenseId: uuid("defense_id").notNull().references(() => defenses.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  role: juryRoleEnum("role").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const evaluations = pgTable("evaluations", {
  id: uuid("id").primaryKey().defaultRandom(),
  defenseId: uuid("defense_id").notNull().references(() => defenses.id),
  juryMemberId: uuid("jury_member_id").notNull().references(() => juryMembers.id),
  criteriaName: varchar("criteria_name", { length: 100 }).notNull(),
  score: integer("score").notNull(), // out of max points
  maxScore: integer("max_score").notNull(),
  comments: text("comments"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  relatedId: varchar("related_id", { length: 255 }),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => users.id),
  emailOnProposalSubmitted: boolean("email_on_proposal_submitted").default(true),
  emailOnProposalValidated: boolean("email_on_proposal_validated").default(true),
  emailOnDefenseScheduled: boolean("email_on_defense_scheduled").default(true),
  emailOnEvaluationReady: boolean("email_on_evaluation_ready").default(true),
  emailDigestFrequency: emailDigestEnum("email_digest_frequency").default("daily"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const archiveRecords = pgTable("archive_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  recordType: recordTypeEnum("record_type").notNull(),
  recordId: varchar("record_id", { length: 255 }).notNull(),
  recordData: text("record_data").notNull(),
  archivedAt: timestamp("archived_at").notNull().defaultNow(),
  archivedBy: uuid("archived_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const systemSettings = pgTable("system_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  action: actionTypeEnum("action").notNull(),
  resourceType: varchar("resource_type", { length: 50 }).notNull(),
  resourceId: varchar("resource_id", { length: 255 }),
  changes: text("changes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Password Reset Tokens Table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  pfeProposalsAsStudent: many(pfeProposals, { relationName: "studentProposals" }),
  pfeProposalsAsAcademicSupervisor: many(pfeProposals, { relationName: "academicSupervisorProposals" }),
  pfeProposalsAsCompanySupervisor: many(pfeProposals, { relationName: "companySupervisorProposals" }),
  reportsUploaded: many(reports),
  juryMemberships: many(juryMembers),
}));

export const pfeProposalsRelations = relations(pfeProposals, ({ one, many }) => ({
  student: one(users, {
    fields: [pfeProposals.studentId],
    references: [users.id],
    relationName: "studentProposals",
  }),
  academicSupervisor: one(users, {
    fields: [pfeProposals.academicSupervisorId],
    references: [users.id],
    relationName: "academicSupervisorProposals",
  }),
  companySupervisor: one(users, {
    fields: [pfeProposals.companySupervisorId],
    references: [users.id],
    relationName: "companySupervisorProposals",
  }),
  company: one(companies, {
    fields: [pfeProposals.companyId],
    references: [companies.id],
  }),
  specialty: one(specialties, {
    fields: [pfeProposals.specialtyId],
    references: [specialties.id],
  }),
  academicYear: one(academicYears, {
    fields: [pfeProposals.academicYearId],
    references: [academicYears.id],
  }),
  reports: many(reports),
  defenses: many(defenses),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  pfeProposal: one(pfeProposals, {
    fields: [reports.pfeProposalId],
    references: [pfeProposals.id],
  }),
  uploadedBy: one(users, {
    fields: [reports.uploadedById],
    references: [users.id],
  }),
}));

export const defensesRelations = relations(defenses, ({ one, many }) => ({
  pfeProposal: one(pfeProposals, {
    fields: [defenses.pfeProposalId],
    references: [pfeProposals.id],
  }),
  juryMembers: many(juryMembers),
  evaluations: many(evaluations),
}));

export const juryMembersRelations = relations(juryMembers, ({ one, many }) => ({
  defense: one(defenses, {
    fields: [juryMembers.defenseId],
    references: [defenses.id],
  }),
  user: one(users, {
    fields: [juryMembers.userId],
    references: [users.id],
  }),
  evaluations: many(evaluations),
}));

export const evaluationsRelations = relations(evaluations, ({ one }) => ({
  defense: one(defenses, {
    fields: [evaluations.defenseId],
    references: [defenses.id],
  }),
  juryMember: one(juryMembers, {
    fields: [evaluations.juryMemberId],
    references: [juryMembers.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

export const archiveRecordsRelations = relations(archiveRecords, ({ one }) => ({
  archivedByUser: one(users, {
    fields: [archiveRecords.archivedBy],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPfeProposalSchema = createInsertSchema(pfeProposals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true,
  validatedAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
});

export const insertDefenseSchema = createInsertSchema(defenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJuryMemberSchema = createInsertSchema(juryMembers).omit({
  id: true,
  createdAt: true,
});

export const insertEvaluationSchema = createInsertSchema(evaluations).omit({
  id: true,
  createdAt: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
});

export const insertSpecialtySchema = createInsertSchema(specialties).omit({
  id: true,
  createdAt: true,
});

export const insertAcademicYearSchema = createInsertSchema(academicYears).omit({
  id: true,
  createdAt: true,
});

// Sprint 5 Insert Schemas
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationPreferenceSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertArchiveRecordSchema = createInsertSchema(archiveRecords).omit({
  id: true,
  createdAt: true,
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPfeProposal = z.infer<typeof insertPfeProposalSchema>;
export type PfeProposal = typeof pfeProposals.$inferSelect;

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

export type InsertDefense = z.infer<typeof insertDefenseSchema>;
export type Defense = typeof defenses.$inferSelect;

export type InsertJuryMember = z.infer<typeof insertJuryMemberSchema>;
export type JuryMember = typeof juryMembers.$inferSelect;

export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;
export type Evaluation = typeof evaluations.$inferSelect;

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

export type InsertSpecialty = z.infer<typeof insertSpecialtySchema>;
export type Specialty = typeof specialties.$inferSelect;

export type InsertAcademicYear = z.infer<typeof insertAcademicYearSchema>;
export type AcademicYear = typeof academicYears.$inferSelect;

// Sprint 5 Types
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertNotificationPreference = z.infer<typeof insertNotificationPreferenceSchema>;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;

export type InsertArchiveRecord = z.infer<typeof insertArchiveRecordSchema>;
export type ArchiveRecord = typeof archiveRecords.$inferSelect;

export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

// Password reset schema
export const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalide"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token requis"),
  newPassword: z.string().min(8, "Minimum 8 caractères"),
});

export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;
