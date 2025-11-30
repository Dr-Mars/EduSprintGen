import {
  users,
  pfeProposals,
  reports,
  defenses,
  juryMembers,
  evaluations,
  companies,
  specialties,
  academicYears,
  notifications,
  notificationPreferences,
  archiveRecords,
  systemSettings,
  auditLogs,
  passwordResetTokens,
  type User,
  type InsertUser,
  type PfeProposal,
  type InsertPfeProposal,
  type Report,
  type InsertReport,
  type Defense,
  type InsertDefense,
  type JuryMember,
  type InsertJuryMember,
  type Evaluation,
  type InsertEvaluation,
  type Company,
  type InsertCompany,
  type Specialty,
  type InsertSpecialty,
  type AcademicYear,
  type InsertAcademicYear,
  type Notification,
  type InsertNotification,
  type NotificationPreference,
  type InsertNotificationPreference,
  type ArchiveRecord,
  type InsertArchiveRecord,
  type SystemSetting,
  type InsertSystemSetting,
  type AuditLog,
  type InsertAuditLog,
  type PasswordResetToken,
  type InsertPasswordResetToken,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
  toggleUserActive(id: string, isActive: boolean): Promise<User | undefined>;
  
  // PFE Proposals
  getPfeProposal(id: string): Promise<any | undefined>;
  createPfeProposal(proposal: InsertPfeProposal): Promise<PfeProposal>;
  updatePfeProposal(id: string, data: Partial<InsertPfeProposal>): Promise<PfeProposal | undefined>;
  listPfeProposals(filters?: { status?: string; studentId?: string; academicSupervisorId?: string }): Promise<any[]>;
  updatePfeProposalStatus(id: string, status: string, comments?: string): Promise<PfeProposal | undefined>;
  assignAcademicSupervisor(proposalId: string, supervisorId: string): Promise<PfeProposal | undefined>;
  
  // Reports
  getReport(id: string): Promise<Report | undefined>;
  createReport(report: InsertReport): Promise<Report>;
  listReportsByProposal(proposalId: string): Promise<Report[]>;
  updatePlagiarismScore(id: string, score: number): Promise<Report | undefined>;
  
  // Defenses
  getDefense(id: string): Promise<any | undefined>;
  createDefense(defense: InsertDefense): Promise<Defense>;
  updateDefense(id: string, data: Partial<InsertDefense>): Promise<Defense | undefined>;
  listDefenses(filters?: { status?: string; userId?: string }): Promise<any[]>;
  
  // Jury Members
  addJuryMember(juryMember: InsertJuryMember): Promise<JuryMember>;
  removeJuryMember(id: string): Promise<void>;
  listJuryMembersByDefense(defenseId: string): Promise<any[]>;
  
  // Evaluations
  createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation>;
  listEvaluationsByDefense(defenseId: string): Promise<Evaluation[]>;
  
  // Companies
  getCompany(id: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  listCompanies(): Promise<Company[]>;
  
  // Specialties
  listSpecialties(): Promise<Specialty[]>;
  createSpecialty(specialty: InsertSpecialty): Promise<Specialty>;
  
  // Academic Years
  listAcademicYears(): Promise<AcademicYear[]>;
  getActiveAcademicYear(): Promise<AcademicYear | undefined>;
  createAcademicYear(year: InsertAcademicYear): Promise<AcademicYear>;

  // Sprint 5: Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string, limit?: number): Promise<Notification[]>;
  markNotificationAsRead(notificationId: string): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(notificationId: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;

  // Sprint 5: Notification Preferences
  getNotificationPreferences(userId: string): Promise<NotificationPreference | undefined>;
  createNotificationPreferences(prefs: InsertNotificationPreference): Promise<NotificationPreference>;
  updateNotificationPreferences(userId: string, prefs: Partial<InsertNotificationPreference>): Promise<NotificationPreference | undefined>;

  // Sprint 5: Archive Records
  createArchiveRecord(archive: InsertArchiveRecord): Promise<ArchiveRecord>;
  listArchiveRecords(filters?: { recordType?: string; recordId?: string; limit?: number; offset?: number }): Promise<ArchiveRecord[]>;
  getArchiveRecord(id: string): Promise<ArchiveRecord | undefined>;
  deleteArchiveRecord(id: string): Promise<void>;

  // Sprint 5: System Settings
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  getAllSystemSettings(category?: string): Promise<SystemSetting[]>;
  updateSystemSetting(key: string, value: string): Promise<SystemSetting>;
  deleteSystemSetting(key: string): Promise<void>;

  // Sprint 5: Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  listAuditLogs(filters?: { userId?: string; resourceType?: string; limit?: number; offset?: number }): Promise<AuditLog[]>;

  // Sprint 6: Password Reset
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  deletePasswordResetToken(token: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }

  async listUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async toggleUserActive(id: string, isActive: boolean): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }

  // PFE Proposals
  async getPfeProposal(id: string): Promise<any | undefined> {
    const [proposal] = await db.query.pfeProposals.findMany({
      where: eq(pfeProposals.id, id),
      with: {
        student: true,
        academicSupervisor: true,
        companySupervisor: true,
        company: true,
        specialty: true,
        academicYear: true,
        reports: true,
        defenses: true,
      },
    });
    return proposal || undefined;
  }

  async createPfeProposal(proposal: InsertPfeProposal): Promise<PfeProposal> {
    const [created] = await db.insert(pfeProposals).values(proposal).returning();
    return created;
  }

  async updatePfeProposal(id: string, data: Partial<InsertPfeProposal>): Promise<PfeProposal | undefined> {
    const [updated] = await db
      .update(pfeProposals)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(pfeProposals.id, id))
      .returning();
    return updated || undefined;
  }

  async listPfeProposals(filters?: { status?: string; studentId?: string; academicSupervisorId?: string }): Promise<any[]> {
    let query = db.query.pfeProposals.findMany({
      with: {
        student: true,
        academicSupervisor: true,
        specialty: true,
      },
      orderBy: desc(pfeProposals.createdAt),
    });

    // Note: Filtering would be done via where clause in production
    const results = await query;
    
    if (filters?.status) {
      return results.filter((p: any) => p.status === filters.status);
    }
    if (filters?.studentId) {
      return results.filter((p: any) => p.studentId === filters.studentId);
    }
    if (filters?.academicSupervisorId) {
      return results.filter((p: any) => p.academicSupervisorId === filters.academicSupervisorId);
    }
    
    return results;
  }

  async updatePfeProposalStatus(id: string, status: string, comments?: string): Promise<PfeProposal | undefined> {
    const updates: any = { status, updatedAt: new Date() };
    if (comments) updates.validationComments = comments;
    if (status === "submitted") updates.submittedAt = new Date();
    if (status === "validated") updates.validatedAt = new Date();

    const [updated] = await db
      .update(pfeProposals)
      .set(updates)
      .where(eq(pfeProposals.id, id))
      .returning();
    return updated || undefined;
  }

  async assignAcademicSupervisor(proposalId: string, supervisorId: string): Promise<PfeProposal | undefined> {
    const [updated] = await db
      .update(pfeProposals)
      .set({ academicSupervisorId: supervisorId, updatedAt: new Date() })
      .where(eq(pfeProposals.id, proposalId))
      .returning();
    return updated || undefined;
  }

  // Reports
  async getReport(id: string): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report || undefined;
  }

  async createReport(report: InsertReport): Promise<Report> {
    const [created] = await db.insert(reports).values(report).returning();
    return created;
  }

  async listReportsByProposal(proposalId: string): Promise<Report[]> {
    return db
      .select()
      .from(reports)
      .where(eq(reports.pfeProposalId, proposalId))
      .orderBy(desc(reports.createdAt));
  }

  async updatePlagiarismScore(id: string, score: number): Promise<Report | undefined> {
    const [updated] = await db
      .update(reports)
      .set({ plagiarismScore: score, plagiarismAnalyzedAt: new Date() })
      .where(eq(reports.id, id))
      .returning();
    return updated || undefined;
  }

  async updateReport(id: string, data: Partial<InsertReport>): Promise<Report | undefined> {
    const [updated] = await db
      .update(reports)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(reports.id, id))
      .returning();
    return updated || undefined;
  }

  // Defenses
  async getDefense(id: string): Promise<any | undefined> {
    const [defense] = await db.query.defenses.findMany({
      where: eq(defenses.id, id),
      with: {
        pfeProposal: {
          with: {
            student: true,
          },
        },
        juryMembers: {
          with: {
            user: true,
          },
        },
        evaluations: true,
      },
    });
    return defense || undefined;
  }

  async createDefense(defense: InsertDefense): Promise<Defense> {
    const [created] = await db.insert(defenses).values(defense).returning();
    return created;
  }

  async updateDefense(id: string, data: Partial<InsertDefense>): Promise<Defense | undefined> {
    const [updated] = await db
      .update(defenses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(defenses.id, id))
      .returning();
    return updated || undefined;
  }

  async listDefenses(filters?: { status?: string; userId?: string }): Promise<any[]> {
    const results = await db.query.defenses.findMany({
      with: {
        pfeProposal: {
          with: {
            student: true,
          },
        },
        juryMembers: {
          with: {
            user: true,
          },
        },
      },
      orderBy: desc(defenses.scheduledAt),
    });

    if (filters?.status) {
      return results.filter((d: any) => d.status === filters.status);
    }
    if (filters?.userId) {
      return results.filter((d: any) => 
        d.juryMembers.some((jm: any) => jm.userId === filters.userId)
      );
    }

    return results;
  }

  // Jury Members
  async addJuryMember(juryMember: InsertJuryMember): Promise<JuryMember> {
    const [created] = await db.insert(juryMembers).values(juryMember).returning();
    return created;
  }

  async removeJuryMember(id: string): Promise<void> {
    await db.delete(juryMembers).where(eq(juryMembers.id, id));
  }

  async listJuryMembersByDefense(defenseId: string): Promise<any[]> {
    return db.query.juryMembers.findMany({
      where: eq(juryMembers.defenseId, defenseId),
      with: {
        user: true,
      },
    });
  }

  // Evaluations
  async createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation> {
    const [created] = await db.insert(evaluations).values(evaluation).returning();
    return created;
  }

  async listEvaluationsByDefense(defenseId: string): Promise<Evaluation[]> {
    return db
      .select()
      .from(evaluations)
      .where(eq(evaluations.defenseId, defenseId))
      .orderBy(desc(evaluations.createdAt));
  }

  // Companies
  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company || undefined;
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [created] = await db.insert(companies).values(company).returning();
    return created;
  }

  async listCompanies(): Promise<Company[]> {
    return db.select().from(companies).orderBy(companies.name);
  }

  // Specialties
  async listSpecialties(): Promise<Specialty[]> {
    return db.select().from(specialties).where(eq(specialties.isActive, true)).orderBy(specialties.name);
  }

  async createSpecialty(specialty: InsertSpecialty): Promise<Specialty> {
    const [created] = await db.insert(specialties).values(specialty).returning();
    return created;
  }

  // Academic Years
  async listAcademicYears(): Promise<AcademicYear[]> {
    return db.select().from(academicYears).orderBy(desc(academicYears.startDate));
  }

  async getActiveAcademicYear(): Promise<AcademicYear | undefined> {
    const [year] = await db
      .select()
      .from(academicYears)
      .where(eq(academicYears.isActive, true))
      .limit(1);
    return year || undefined;
  }

  async createAcademicYear(year: InsertAcademicYear): Promise<AcademicYear> {
    const [created] = await db.insert(academicYears).values(year).returning();
    return created;
  }

  // Sprint 5: Notifications
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async getUserNotifications(userId: string, limit: number = 20): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async markNotificationAsRead(notificationId: string): Promise<Notification | undefined> {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.id, notificationId))
      .returning();
    return updated || undefined;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, notificationId));
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result[0]?.count || 0;
  }

  // Sprint 5: Notification Preferences
  async getNotificationPreferences(userId: string): Promise<NotificationPreference | undefined> {
    const [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));
    return prefs || undefined;
  }

  async createNotificationPreferences(prefs: InsertNotificationPreference): Promise<NotificationPreference> {
    const [created] = await db.insert(notificationPreferences).values(prefs).returning();
    return created;
  }

  async updateNotificationPreferences(userId: string, prefs: Partial<InsertNotificationPreference>): Promise<NotificationPreference | undefined> {
    const [updated] = await db
      .update(notificationPreferences)
      .set({ ...prefs, updatedAt: new Date() })
      .where(eq(notificationPreferences.userId, userId))
      .returning();
    return updated || undefined;
  }

  // Sprint 5: Archive Records
  async createArchiveRecord(archive: InsertArchiveRecord): Promise<ArchiveRecord> {
    const [created] = await db.insert(archiveRecords).values(archive).returning();
    return created;
  }

  async listArchiveRecords(filters?: { recordType?: string; recordId?: string; limit?: number; offset?: number }): Promise<ArchiveRecord[]> {
    let query = db.select().from(archiveRecords);
    
    if (filters?.recordType) {
      query = query.where(eq(archiveRecords.recordType, filters.recordType));
    }
    if (filters?.recordId) {
      query = query.where(eq(archiveRecords.recordId, filters.recordId));
    }
    
    query = query.orderBy(desc(archiveRecords.archivedAt));
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }
    
    return query;
  }

  async getArchiveRecord(id: string): Promise<ArchiveRecord | undefined> {
    const [record] = await db.select().from(archiveRecords).where(eq(archiveRecords.id, id));
    return record || undefined;
  }

  async deleteArchiveRecord(id: string): Promise<void> {
    await db.delete(archiveRecords).where(eq(archiveRecords.id, id));
  }

  // Sprint 5: System Settings
  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return setting || undefined;
  }

  async getAllSystemSettings(category?: string): Promise<SystemSetting[]> {
    if (category) {
      return db.select().from(systemSettings).where(eq(systemSettings.category, category));
    }
    return db.select().from(systemSettings);
  }

  async updateSystemSetting(key: string, value: string): Promise<SystemSetting> {
    const [updated] = await db
      .update(systemSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(systemSettings.key, key))
      .returning();
    
    if (!updated) {
      const [created] = await db.insert(systemSettings).values({ key, value, category: "general" }).returning();
      return created;
    }
    
    return updated;
  }

  async deleteSystemSetting(key: string): Promise<void> {
    await db.delete(systemSettings).where(eq(systemSettings.key, key));
  }

  // Sprint 5: Audit Logs
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log).returning();
    return created;
  }

  async listAuditLogs(filters?: { userId?: string; resourceType?: string; limit?: number; offset?: number }): Promise<AuditLog[]> {
    let query = db.select().from(auditLogs);
    
    if (filters?.userId) {
      query = query.where(eq(auditLogs.userId, filters.userId));
    }
    if (filters?.resourceType) {
      query = query.where(eq(auditLogs.resourceType, filters.resourceType));
    }
    
    query = query.orderBy(desc(auditLogs.createdAt));
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }
    
    return query;
  }

  // Sprint 6: Password Reset
  async createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [created] = await db.insert(passwordResetTokens).values(token).returning();
    return created;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    return resetToken || undefined;
  }

  async deletePasswordResetToken(token: string): Promise<void> {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
  }
}

export const storage = new DatabaseStorage();
