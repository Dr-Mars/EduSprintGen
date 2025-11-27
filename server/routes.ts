import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  loginSchema,
  insertUserSchema,
  insertPfeProposalSchema,
  insertReportSchema,
  insertDefenseSchema,
  insertJuryMemberSchema,
  insertEvaluationSchema,
  insertCompanySchema,
  insertSpecialtySchema,
  insertAcademicYearSchema,
  insertNotificationSchema,
  insertNotificationPreferenceSchema,
  insertArchiveRecordSchema,
  insertSystemSettingSchema,
  insertAuditLogSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import express from "express";
import {
  analyzeProposalQuality,
  analyzePlagiarismRisk,
  generateEvaluationFeedback,
} from "./ai-validation";
import { defenseService } from "./defense-service";
import { juryService } from "./jury-service";
import { gradingService } from "./grading-service";
import { geminiFeedbackService } from "./gemini-feedback-service";
import { notificationService } from "./notification-service";
import { notificationPreferenceService } from "./notification-preference-service";
import { analyticsService } from "./analytics-service";
import { archiveService } from "./archive-service";
import { settingsService } from "./settings-service";
import { passwordResetService } from "./password-reset-service";
import { pdfWatermarkService } from "./pdf-watermark-service";

// Middleware for authentication (simplified - in production would use JWT)
const authMiddleware = (req: Request, res: Response, next: Function) => {
  // For now, we'll skip auth in development
  // In production, this would verify JWT tokens
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Parse JSON bodies
  app.use(express.json());

  // ============================================
  // AUTHENTICATION ROUTES
  // ============================================

  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Email ou mot de passe incorrect" });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: "Compte désactivé" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Email ou mot de passe incorrect" });
      }

      // Don't send password in response
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Données invalides", details: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Logout (client-side mostly, server can invalidate sessions)
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    res.json({ success: true });
  });

  // Get current user (would verify JWT in production)
  app.get("/api/auth/me", authMiddleware, async (req: Request, res: Response) => {
    try {
      // In production, get user ID from JWT token
      // For now, return mock data or require userId in query
      res.json({ user: null });
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Forgot Password
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Return success even if user not found (security best practice)
        return res.json({ success: true, message: "Si cet email existe, vous recevrez un lien de réinitialisation" });
      }

      const resetToken = await passwordResetService.generateResetToken(user.id);
      const resetLink = passwordResetService.generateResetLink(resetToken);
      
      // TODO: Send email with reset link (integrate email service)
      console.log(`Password reset link for ${email}: ${resetLink}`);
      
      res.json({ success: true, message: "Vérifiez votre email pour le lien de réinitialisation" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Email invalide" });
      }
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Reset Password
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = resetPasswordSchema.parse(req.body);
      
      const success = await passwordResetService.resetPassword(token, newPassword);
      
      if (!success) {
        return res.status(401).json({ error: "Lien de réinitialisation invalide ou expiré" });
      }

      res.json({ success: true, message: "Mot de passe réinitialisé avec succès" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Données invalides", details: error.errors });
      }
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Verify Reset Token
  app.get("/api/auth/verify-reset-token/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const result = await passwordResetService.verifyResetToken(token);
      
      if (!result) {
        return res.status(401).json({ error: "Lien de réinitialisation invalide ou expiré" });
      }

      res.json({ valid: true });
    } catch (error) {
      console.error("Verify token error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // ============================================
  // USER ROUTES
  // ============================================

  // List all users (admin only)
  app.get("/api/users", authMiddleware, async (req: Request, res: Response) => {
    try {
      const users = await storage.listUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password: _, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("List users error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Get single user
  app.get("/api/users/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Create user
  app.post("/api/users", authMiddleware, async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existing = await storage.getUserByEmail(userData.email);
      if (existing) {
        return res.status(409).json({ error: "Un utilisateur avec cet email existe déjà" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Données invalides", details: error.errors });
      }
      console.error("Create user error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Update user
  app.patch("/api/users/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const updates = req.body;
      
      // If password is being updated, hash it
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10);
      }

      const user = await storage.updateUser(req.params.id, updates);
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Toggle user active status
  app.patch("/api/users/:id/toggle-active", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { isActive } = req.body;
      const user = await storage.toggleUserActive(req.params.id, isActive);
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // ============================================
  // PFE PROPOSAL ROUTES
  // ============================================

  // List proposals (with filters)
  app.get("/api/proposals", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { status, studentId, academicSupervisorId } = req.query;
      
      const proposals = await storage.listPfeProposals({
        status: status as string,
        studentId: studentId as string,
        academicSupervisorId: academicSupervisorId as string,
      });

      res.json(proposals);
    } catch (error) {
      console.error("List proposals error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Get single proposal
  app.get("/api/proposals/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const proposal = await storage.getPfeProposal(req.params.id);
      if (!proposal) {
        return res.status(404).json({ error: "Proposition non trouvée" });
      }
      res.json(proposal);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Create proposal
  app.post("/api/proposals", authMiddleware, async (req: Request, res: Response) => {
    try {
      const proposalData = insertPfeProposalSchema.parse(req.body);
      const proposal = await storage.createPfeProposal(proposalData);
      res.status(201).json(proposal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Données invalides", details: error.errors });
      }
      console.error("Create proposal error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Update proposal
  app.patch("/api/proposals/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const proposal = await storage.updatePfeProposal(req.params.id, req.body);
      if (!proposal) {
        return res.status(404).json({ error: "Proposition non trouvée" });
      }
      res.json(proposal);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Update proposal status (validate/reject/request modification)
  app.patch("/api/proposals/:id/status", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { status, comments } = req.body;
      
      if (!["draft", "submitted", "to_modify", "validated", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Statut invalide" });
      }

      const proposal = await storage.updatePfeProposalStatus(req.params.id, status, comments);
      if (!proposal) {
        return res.status(404).json({ error: "Proposition non trouvée" });
      }

      res.json(proposal);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Assign academic supervisor
  app.patch("/api/proposals/:id/assign-supervisor", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { supervisorId } = req.body;
      
      const proposal = await storage.assignAcademicSupervisor(req.params.id, supervisorId);
      if (!proposal) {
        return res.status(404).json({ error: "Proposition non trouvée" });
      }

      res.json(proposal);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // ============================================
  // REPORT ROUTES
  // ============================================

  // List reports for a proposal
  app.get("/api/proposals/:proposalId/reports", authMiddleware, async (req: Request, res: Response) => {
    try {
      const reports = await storage.listReportsByProposal(req.params.proposalId);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Get single report
  app.get("/api/reports/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const report = await storage.getReport(req.params.id);
      if (!report) {
        return res.status(404).json({ error: "Rapport non trouvé" });
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Create report (simplified - file upload would be handled differently)
  app.post("/api/reports", authMiddleware, async (req: Request, res: Response) => {
    try {
      const reportData = insertReportSchema.parse(req.body);
      
      // Validate PDF (mock - in production use actual file handling)
      if (reportData.fileName && !reportData.fileName.endsWith('.pdf')) {
        return res.status(400).json({ error: "Seuls les fichiers PDF sont acceptés" });
      }
      
      // Check file size (mock - in production validate actual file)
      const mockFileSize = reportData.fileSize || 0;
      if (mockFileSize > 50 * 1024 * 1024) { // 50MB max
        return res.status(400).json({ error: "Le fichier ne doit pas dépasser 50MB" });
      }
      
      const report = await storage.createReport(reportData);
      
      // Apply PDF watermarking
      try {
        const proposal = await storage.getPfeProposal(reportData.pfeProposalId);
        if (proposal && reportData.fileUrl && reportData.fileName) {
          const outputPath = reportData.fileUrl.replace('.pdf', '-watermarked.pdf');
          await pdfWatermarkService.addWatermarkToPDF(
            reportData.fileUrl,
            outputPath,
            proposal.student.id,
            `${proposal.student.firstName} ${proposal.student.lastName}`,
            new Date()
          );
          
          // Update report with watermarked file URL and timestamp
          await storage.updateReport(report.id, {
            fileUrl: outputPath,
            watermarkAppliedAt: new Date(),
          });
        }
      } catch (watermarkError) {
        console.warn("Watermarking warning (continuing without watermark):", watermarkError);
      }
      
      // Run plagiarism detection
      const { detectPlagiarism } = await import("./plagiarism-detection");
      const { score: plagiarismScore } = await detectPlagiarism(
        report.id,
        reportData.pfeProposalId,
        reportData.fileUrl,
        reportData.fileName
      );
      
      // Update report with plagiarism score
      const updatedReport = await storage.updatePlagiarismScore(report.id, plagiarismScore);
      
      res.status(201).json(updatedReport);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Données invalides", details: error.errors });
      }
      console.error("Create report error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Check plagiarism for a report
  app.patch("/api/reports/:id/plagiarism", authMiddleware, async (req: Request, res: Response) => {
    try {
      const report = await storage.getReport(req.params.id);
      if (!report) {
        return res.status(404).json({ error: "Rapport non trouvé" });
      }
      
      // Re-run plagiarism detection
      const { detectPlagiarism } = await import("./plagiarism-detection");
      const { score: plagiarismScore, similarReports } = await detectPlagiarism(
        report.id,
        report.pfeProposalId,
        report.fileUrl,
        report.fileName
      );
      
      // Update report with plagiarism score
      const updatedReport = await storage.updatePlagiarismScore(req.params.id, plagiarismScore);
      
      res.json({ report: updatedReport, similarReports });
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // ============================================
  // DEFENSE ROUTES
  // ============================================

  // List defenses
  app.get("/api/defenses", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { status, userId } = req.query;
      
      const defenses = await storage.listDefenses({
        status: status as string,
        userId: userId as string,
      });

      res.json(defenses);
    } catch (error) {
      console.error("List defenses error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Get single defense
  app.get("/api/defenses/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const defense = await storage.getDefense(req.params.id);
      if (!defense) {
        return res.status(404).json({ error: "Soutenance non trouvée" });
      }
      res.json(defense);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Create defense
  app.post("/api/defenses", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { pfeProposalId, scheduledAt, room, duration } = req.body;
      const defense = await defenseService.createDefense(
        pfeProposalId,
        new Date(scheduledAt),
        room,
        duration
      );
      res.status(201).json(defense);
    } catch (error) {
      console.error("Create defense error:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Erreur serveur" });
    }
  });

  // Update defense (reschedule)
  app.patch("/api/defenses/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { scheduledAt, room } = req.body;
      if (scheduledAt && room) {
        const defense = await defenseService.rescheduleDefense(
          req.params.id,
          new Date(scheduledAt),
          room
        );
        return res.json(defense);
      }
      const defense = await storage.updateDefense(req.params.id, req.body);
      if (!defense) {
        return res.status(404).json({ error: "Soutenance non trouvée" });
      }
      res.json(defense);
    } catch (error) {
      console.error("Update defense error:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Erreur serveur" });
    }
  });

  // Delete/Cancel defense
  app.delete("/api/defenses/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { reason } = req.body;
      const defense = await defenseService.cancelDefense(req.params.id, reason);
      res.json(defense);
    } catch (error) {
      console.error("Cancel defense error:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Erreur serveur" });
    }
  });

  // Add jury member to defense
  app.post("/api/defenses/:defenseId/jury", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { userId, role } = req.body;
      const juryMember = await juryService.addJuryMember(
        req.params.defenseId,
        userId,
        role
      );
      res.status(201).json(juryMember);
    } catch (error) {
      console.error("Add jury member error:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Erreur serveur" });
    }
  });

  // Remove jury member
  app.delete("/api/jury-members/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      await storage.removeJuryMember(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // List jury members for a defense
  app.get("/api/defenses/:defenseId/jury", authMiddleware, async (req: Request, res: Response) => {
    try {
      const juryMembers = await juryService.getJuryMembersWithDetails(req.params.defenseId);
      res.json(juryMembers);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Validate jury composition for a defense
  app.get("/api/defenses/:defenseId/jury/validate", authMiddleware, async (req: Request, res: Response) => {
    try {
      const validation = await juryService.validateJuryComposition(req.params.defenseId);
      res.json(validation);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // ============================================
  // EVALUATION ROUTES
  // ============================================

  // Submit evaluations for a defense
  app.post("/api/evaluations", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { defenseId, juryMemberId, evaluations } = req.body;
      await gradingService.submitEvaluation(defenseId, juryMemberId, evaluations);
      
      // Try to generate AI feedback if service is available
      if (geminiFeedbackService.isServiceAvailable()) {
        await geminiFeedbackService.generateEvaluationFeedback({ defenseId });
      }
      
      res.status(201).json({ success: true, message: "Évaluations soumises avec succès" });
    } catch (error) {
      console.error("Submit evaluation error:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Erreur serveur" });
    }
  });

  // List evaluations for a defense
  app.get("/api/defenses/:defenseId/evaluations", authMiddleware, async (req: Request, res: Response) => {
    try {
      const evaluations = await storage.listEvaluationsByDefense(req.params.defenseId);
      res.json(evaluations);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Get defense results
  app.get("/api/defenses/:id/results", authMiddleware, async (req: Request, res: Response) => {
    try {
      const defense = await storage.getDefense(req.params.id);
      if (!defense) {
        return res.status(404).json({ error: "Soutenance non trouvée" });
      }
      
      const evaluations = await storage.listEvaluationsByDefense(req.params.id);
      const juryMembers = await storage.listJuryMembersByDefense(req.params.id);
      
      res.json({
        defense,
        evaluations,
        juryMembers,
        scoringWeights: gradingService.getScoringWeights(),
      });
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Get student results
  app.get("/api/students/:studentId/results", authMiddleware, async (req: Request, res: Response) => {
    try {
      const proposals = await storage.listPfeProposals({ studentId: req.params.studentId });
      const results = [];
      
      for (const proposal of proposals) {
        const defenses = await defenseService.getProposalDefenses(proposal.id);
        for (const defense of defenses) {
          if (defense.status === "completed") {
            const evaluations = await storage.listEvaluationsByDefense(defense.id);
            results.push({
              defense,
              proposal,
              evaluations,
            });
          }
        }
      }
      
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Check room availability
  app.get("/api/defenses/rooms/available", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { room, scheduledAt, duration } = req.query;
      if (!room || !scheduledAt) {
        return res.status(400).json({ error: "Paramètres manquants" });
      }
      
      const available = await defenseService.isRoomAvailable(
        room as string,
        new Date(scheduledAt as string),
        parseInt(duration as string) || 60
      );
      
      res.json({ room, available });
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Generate AI feedback for a defense
  app.post("/api/defenses/:id/generate-feedback", authMiddleware, async (req: Request, res: Response) => {
    try {
      if (!geminiFeedbackService.isServiceAvailable()) {
        return res.status(400).json({ error: "Service de feedback IA non disponible" });
      }
      
      const feedback = await geminiFeedbackService.generateEvaluationFeedback({ defenseId: req.params.id });
      res.json({ feedback });
    } catch (error) {
      console.error("Generate feedback error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // ============================================
  // SPECIALTY ROUTES
  // ============================================

  app.get("/api/specialties", authMiddleware, async (req: Request, res: Response) => {
    try {
      const specialties = await storage.listSpecialties();
      res.json(specialties);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.post("/api/specialties", authMiddleware, async (req: Request, res: Response) => {
    try {
      const specialtyData = insertSpecialtySchema.parse(req.body);
      const specialty = await storage.createSpecialty(specialtyData);
      res.status(201).json(specialty);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Données invalides", details: error.errors });
      }
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // ============================================
  // COMPANY ROUTES
  // ============================================

  app.get("/api/companies", authMiddleware, async (req: Request, res: Response) => {
    try {
      const companies = await storage.listCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.post("/api/companies", authMiddleware, async (req: Request, res: Response) => {
    try {
      const companyData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(companyData);
      res.status(201).json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Données invalides", details: error.errors });
      }
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // ============================================
  // ACADEMIC YEAR ROUTES
  // ============================================

  app.get("/api/academic-years", authMiddleware, async (req: Request, res: Response) => {
    try {
      const years = await storage.listAcademicYears();
      res.json(years);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.get("/api/academic-years/active", authMiddleware, async (req: Request, res: Response) => {
    try {
      const year = await storage.getActiveAcademicYear();
      if (!year) {
        return res.status(404).json({ error: "Aucune année académique active" });
      }
      res.json(year);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.post("/api/academic-years", authMiddleware, async (req: Request, res: Response) => {
    try {
      const yearData = insertAcademicYearSchema.parse(req.body);
      const year = await storage.createAcademicYear(yearData);
      res.status(201).json(year);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Données invalides", details: error.errors });
      }
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // ============================================
  // DASHBOARD/STATS ROUTES
  // ============================================

  app.get("/api/dashboard/stats", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { userId, role } = req.query;
      
      // Mock stats - in production, calculate from database
      const stats = {
        totalProposals: 0,
        pendingProposals: 0,
        validatedProposals: 0,
        upcomingDefenses: 0,
        mySupervisions: 0,
        totalStudents: 0,
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // ============================================
  // AI VALIDATION ROUTES
  // ============================================

  // Analyze proposal quality
  app.post("/api/ai/analyze-proposal", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { title, description, context, problematic, objectives } = req.body;

      if (!title || !description || !context || !problematic || !objectives) {
        return res.status(400).json({ error: "Données manquantes pour l'analyse" });
      }

      const analysis = await analyzeProposalQuality(
        title,
        description,
        context,
        problematic,
        objectives
      );

      res.json(analysis);
    } catch (error: any) {
      console.error("AI analysis error:", error);
      res.status(500).json({ error: error.message || "Erreur lors de l'analyse IA" });
    }
  });

  // Analyze plagiarism risk
  app.post("/api/ai/check-plagiarism", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { title, description, context } = req.body;

      if (!title || !description || !context) {
        return res.status(400).json({ error: "Données manquantes pour la vérification" });
      }

      const analysis = await analyzePlagiarismRisk(title, description, context);

      res.json(analysis);
    } catch (error: any) {
      console.error("Plagiarism check error:", error);
      res.status(500).json({ error: error.message || "Erreur lors de la vérification" });
    }
  });

  // Generate evaluation feedback
  app.post("/api/ai/generate-feedback", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { proposalTitle, criteria, scores } = req.body;

      if (!proposalTitle || !criteria || !scores) {
        return res.status(400).json({ error: "Données manquantes pour la génération" });
      }

      const feedback = await generateEvaluationFeedback(proposalTitle, criteria, scores);

      res.json({ feedback });
    } catch (error: any) {
      console.error("Feedback generation error:", error);
      res.status(500).json({ error: error.message || "Erreur lors de la génération" });
    }
  });

  // ============================================
  // SPRINT 5: NOTIFICATION ROUTES
  // ============================================

  // Create notification
  app.post("/api/notifications", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { userId, type, title, message, relatedId } = req.body;
      const notification = await notificationService.createNotification(userId, type, title, message, relatedId);
      res.status(201).json(notification);
    } catch (error: any) {
      console.error("Create notification error:", error);
      res.status(500).json({ error: "Erreur lors de la création de la notification" });
    }
  });

  // Get user notifications
  app.get("/api/users/:userId/notifications", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      const notifications = await notificationService.getUserNotifications(userId, limit);
      res.json(notifications);
    } catch (error: any) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des notifications" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:notificationId/read", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { notificationId } = req.params;
      const notification = await notificationService.markNotificationAsRead(notificationId);
      if (!notification) {
        return res.status(404).json({ error: "Notification non trouvée" });
      }
      res.json(notification);
    } catch (error: any) {
      console.error("Mark as read error:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour" });
    }
  });

  // Mark all notifications as read
  app.patch("/api/users/:userId/notifications/read-all", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      await notificationService.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Mark all as read error:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour" });
    }
  });

  // Delete notification
  app.delete("/api/notifications/:notificationId", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { notificationId } = req.params;
      await notificationService.deleteNotification(notificationId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete notification error:", error);
      res.status(500).json({ error: "Erreur lors de la suppression" });
    }
  });

  // Get unread count
  app.get("/api/users/:userId/notifications/unread/count", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const count = await notificationService.getUnreadCount(userId);
      res.json({ count });
    } catch (error: any) {
      console.error("Get unread count error:", error);
      res.status(500).json({ error: "Erreur lors de la récupération du compte" });
    }
  });

  // ============================================
  // SPRINT 5: NOTIFICATION PREFERENCE ROUTES
  // ============================================

  // Get user notification preferences
  app.get("/api/users/:userId/notification-preferences", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const preferences = await notificationPreferenceService.getUserPreferences(userId);
      if (!preferences) {
        return res.status(404).json({ error: "Préférences non trouvées" });
      }
      res.json(preferences);
    } catch (error: any) {
      console.error("Get preferences error:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des préférences" });
    }
  });

  // Update notification preferences
  app.patch("/api/users/:userId/notification-preferences", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const preferences = await notificationPreferenceService.updatePreferences(userId, req.body);
      res.json(preferences);
    } catch (error: any) {
      console.error("Update preferences error:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour des préférences" });
    }
  });

  // ============================================
  // SPRINT 5: ANALYTICS ROUTES
  // ============================================

  // Get system statistics
  app.get("/api/analytics/system-stats", authMiddleware, async (req: Request, res: Response) => {
    try {
      const stats = await analyticsService.getSystemStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Get system stats error:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
    }
  });

  // Get completion rate
  app.get("/api/analytics/completion-rate", authMiddleware, async (req: Request, res: Response) => {
    try {
      const rate = await analyticsService.getCompletionRate();
      res.json(rate);
    } catch (error: any) {
      console.error("Get completion rate error:", error);
      res.status(500).json({ error: "Erreur lors de la récupération du taux de complétion" });
    }
  });

  // Get average scores
  app.get("/api/analytics/average-scores", authMiddleware, async (req: Request, res: Response) => {
    try {
      const scores = await analyticsService.getAverageScores();
      res.json(scores);
    } catch (error: any) {
      console.error("Get average scores error:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des moyennes" });
    }
  });

  // Get defense statistics
  app.get("/api/analytics/defense-stats", authMiddleware, async (req: Request, res: Response) => {
    try {
      const stats = await analyticsService.getDefenseStatistics();
      res.json(stats);
    } catch (error: any) {
      console.error("Get defense stats error:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
    }
  });

  // Get student progress
  app.get("/api/analytics/student-progress/:studentId", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const progress = await analyticsService.getStudentProgress(studentId);
      res.json(progress);
    } catch (error: any) {
      console.error("Get student progress error:", error);
      res.status(500).json({ error: "Erreur lors de la récupération de la progression" });
    }
  });

  // Get top performers
  app.get("/api/analytics/top-performers", authMiddleware, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const performers = await analyticsService.getTopPerformers(limit);
      res.json(performers);
    } catch (error: any) {
      console.error("Get top performers error:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des meilleurs" });
    }
  });

  // Get statistics by specialty
  app.get("/api/analytics/statistics-by-specialty", authMiddleware, async (req: Request, res: Response) => {
    try {
      const stats = await analyticsService.getStatisticsBySpecialty();
      res.json(stats);
    } catch (error: any) {
      console.error("Get specialty stats error:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
    }
  });

  // Get statistics by company
  app.get("/api/analytics/statistics-by-company", authMiddleware, async (req: Request, res: Response) => {
    try {
      const stats = await analyticsService.getStatisticsByCompany();
      res.json(stats);
    } catch (error: any) {
      console.error("Get company stats error:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
    }
  });

  // ============================================
  // SPRINT 5: ARCHIVE ROUTES
  // ============================================

  // List archives
  app.get("/api/archives", authMiddleware, async (req: Request, res: Response) => {
    try {
      const recordType = req.query.recordType as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const archives = await archiveService.listArchives({ recordType, limit, offset });
      res.json(archives);
    } catch (error: any) {
      console.error("List archives error:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des archives" });
    }
  });

  // Archive proposal
  app.post("/api/archives/proposal", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { proposalId, userId } = req.body;
      if (!proposalId || !userId) {
        return res.status(400).json({ error: "Données manquantes" });
      }
      const archive = await archiveService.archiveProposal(proposalId, userId);
      res.status(201).json(archive);
    } catch (error: any) {
      console.error("Archive proposal error:", error);
      res.status(500).json({ error: error.message || "Erreur lors de l'archivage" });
    }
  });

  // Archive defense
  app.post("/api/archives/defense", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { defenseId, userId } = req.body;
      if (!defenseId || !userId) {
        return res.status(400).json({ error: "Données manquantes" });
      }
      const archive = await archiveService.archiveDefense(defenseId, userId);
      res.status(201).json(archive);
    } catch (error: any) {
      console.error("Archive defense error:", error);
      res.status(500).json({ error: error.message || "Erreur lors de l'archivage" });
    }
  });

  // Get archive
  app.get("/api/archives/:archiveId", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { archiveId } = req.params;
      const archive = await archiveService.getArchive(archiveId);
      if (!archive) {
        return res.status(404).json({ error: "Archive non trouvée" });
      }
      res.json(archive);
    } catch (error: any) {
      console.error("Get archive error:", error);
      res.status(500).json({ error: "Erreur lors de la récupération" });
    }
  });

  // Restore from archive
  app.post("/api/archives/:archiveId/restore", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { archiveId } = req.params;
      const result = await archiveService.restoreArchive(archiveId);
      res.json(result);
    } catch (error: any) {
      console.error("Restore archive error:", error);
      res.status(500).json({ error: error.message || "Erreur lors de la restauration" });
    }
  });

  // Export archives as JSON
  app.get("/api/archives/export/json", authMiddleware, async (req: Request, res: Response) => {
    try {
      const recordType = req.query.recordType as string;
      const limit = parseInt(req.query.limit as string) || 100;
      const data = await archiveService.exportArchivesJSON({ recordType, limit });
      res.json(data);
    } catch (error: any) {
      console.error("Export archives error:", error);
      res.status(500).json({ error: "Erreur lors de l'export" });
    }
  });

  // Delete archive
  app.delete("/api/archives/:archiveId", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { archiveId } = req.params;
      await archiveService.deleteArchive(archiveId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete archive error:", error);
      res.status(500).json({ error: "Erreur lors de la suppression" });
    }
  });

  // ============================================
  // SPRINT 5: SETTINGS ROUTES
  // ============================================

  // Get setting
  app.get("/api/settings/:key", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const setting = await settingsService.getSetting(key);
      if (!setting) {
        return res.status(404).json({ error: "Paramètre non trouvé" });
      }
      res.json(setting);
    } catch (error: any) {
      console.error("Get setting error:", error);
      res.status(500).json({ error: "Erreur lors de la récupération" });
    }
  });

  // Get all settings
  app.get("/api/settings", authMiddleware, async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string;
      const settings = await settingsService.getAllSettings(category);
      res.json(settings);
    } catch (error: any) {
      console.error("Get all settings error:", error);
      res.status(500).json({ error: "Erreur lors de la récupération" });
    }
  });

  // Update setting
  app.patch("/api/settings/:key", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const { value, description } = req.body;
      if (!value) {
        return res.status(400).json({ error: "Valeur requise" });
      }
      const setting = await settingsService.updateSetting(key, value, description);
      res.json(setting);
    } catch (error: any) {
      console.error("Update setting error:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour" });
    }
  });

  // Initialize default settings
  app.post("/api/settings/initialize-defaults", authMiddleware, async (req: Request, res: Response) => {
    try {
      const defaults = await settingsService.initializeDefaults();
      res.json(defaults);
    } catch (error: any) {
      console.error("Initialize defaults error:", error);
      res.status(500).json({ error: "Erreur lors de l'initialisation" });
    }
  });

  // Get defense rooms
  app.get("/api/settings-defense-rooms", authMiddleware, async (req: Request, res: Response) => {
    try {
      const rooms = await settingsService.getDefenseRooms();
      res.json(rooms);
    } catch (error: any) {
      console.error("Get defense rooms error:", error);
      res.status(500).json({ error: "Erreur lors de la récupération" });
    }
  });

  // Update defense rooms
  app.patch("/api/settings-defense-rooms", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { rooms } = req.body;
      if (!Array.isArray(rooms)) {
        return res.status(400).json({ error: "Salles doit être un tableau" });
      }
      await settingsService.updateDefenseRooms(rooms);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Update defense rooms error:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour" });
    }
  });

  // Get grading thresholds
  app.get("/api/settings-grading-thresholds", authMiddleware, async (req: Request, res: Response) => {
    try {
      const thresholds = await settingsService.getGradingThresholds();
      res.json(thresholds);
    } catch (error: any) {
      console.error("Get grading thresholds error:", error);
      res.status(500).json({ error: "Erreur lors de la récupération" });
    }
  });

  // Get scoring weights
  app.get("/api/settings-scoring-weights", authMiddleware, async (req: Request, res: Response) => {
    try {
      const weights = await settingsService.getScoringWeights();
      res.json(weights);
    } catch (error: any) {
      console.error("Get scoring weights error:", error);
      res.status(500).json({ error: "Erreur lors de la récupération" });
    }
  });

  // Validate settings
  app.post("/api/settings/validate", authMiddleware, async (req: Request, res: Response) => {
    try {
      const result = await settingsService.validateSettings();
      res.json(result);
    } catch (error: any) {
      console.error("Validate settings error:", error);
      res.status(500).json({ error: "Erreur lors de la validation" });
    }
  });

  // ============================================
  // SPRINT 5: USER MANAGEMENT ROUTES
  // ============================================

  // Update user role
  app.patch("/api/users/:userId/role", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      if (!role) {
        return res.status(400).json({ error: "Rôle requis" });
      }
      const updated = await storage.updateUser(userId, { role });
      if (!updated) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }
      const { password: _, ...userWithoutPassword } = updated;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Update user role error:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour" });
    }
  });

  // Toggle user active status
  app.patch("/api/users/:userId/toggle-active", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;
      if (isActive === undefined) {
        return res.status(400).json({ error: "Statut requis" });
      }
      const updated = await storage.toggleUserActive(userId, isActive);
      if (!updated) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }
      const { password: _, ...userWithoutPassword } = updated;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Toggle user active error:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
