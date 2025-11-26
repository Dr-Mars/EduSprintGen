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

  const httpServer = createServer(app);

  return httpServer;
}
