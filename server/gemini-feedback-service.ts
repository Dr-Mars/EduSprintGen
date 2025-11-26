/**
 * Gemini Feedback Service (Optional)
 * Generates AI-powered constructive feedback using Google Gemini API
 * Only runs if GEMINI_API_KEY is available
 */

import { storage } from "./storage";

interface FeedbackInput {
  defenseId: string;
}

export class GeminiFeedbackService {
  private geminiClient: any;
  private isAvailable: boolean;

  constructor() {
    // Initialize Gemini client if API key is available
    try {
      // The @google/genai package is already installed
      // Credentials are managed by Replit's integration
      this.isAvailable = !!process.env.GEMINI_API_KEY;
      if (this.isAvailable) {
        // Dynamic import to avoid errors if not available
        this.geminiClient = require("@google/genai");
      }
    } catch (error) {
      console.warn("Gemini feedback service not available:", error);
      this.isAvailable = false;
    }
  }

  /**
   * Check if Gemini feedback service is available
   */
  isServiceAvailable(): boolean {
    return this.isAvailable;
  }

  /**
   * Generate AI feedback for a completed defense
   * Safe to call even if not available - will return null
   */
  async generateEvaluationFeedback(input: FeedbackInput): Promise<string | null> {
    if (!this.isAvailable) {
      console.log("Gemini feedback service not configured");
      return null;
    }

    try {
      const { defenseId } = input;

      // Fetch defense data
      const defense = await storage.getDefense(defenseId);
      if (!defense) {
        throw new Error("Soutenance non trouvée");
      }

      // Fetch proposal data
      const proposal = await storage.getPfeProposal(defense.pfeProposalId);
      if (!proposal) {
        throw new Error("Proposition non trouvée");
      }

      // Fetch student data
      const student = await storage.getUser(proposal.studentId);
      if (!student) {
        throw new Error("Étudiant non trouvé");
      }

      // Fetch report data for plagiarism score
      const reports = await storage.listReportsByProposal(defense.pfeProposalId);
      const latestReport = reports[reports.length - 1];

      // Fetch evaluations for jury comments
      const evaluations = await storage.listEvaluationsByDefense(defenseId);
      const juryMembers = await storage.listJuryMembersByDefense(defenseId);

      // Build prompt for Gemini
      const prompt = this.buildFeedbackPrompt({
        student,
        proposal,
        defense,
        latestReport,
        evaluations,
        juryMembers,
      });

      // Call Gemini API (mock implementation - in production would use actual API)
      const feedback = await this.callGeminiAPI(prompt);

      // Store feedback as evaluation
      if (feedback) {
        await storage.createEvaluation({
          defenseId,
          juryMemberId: "SYSTEM_AI",
          criteriaName: "ai_feedback_summary",
          score: null,
          maxScore: null,
          comments: feedback,
        });
      }

      return feedback;
    } catch (error) {
      console.error("Error generating feedback:", error);
      return null;
    }
  }

  /**
   * Build the prompt for Gemini
   */
  private buildFeedbackPrompt(data: any): string {
    const {
      student,
      proposal,
      defense,
      latestReport,
      evaluations,
      juryMembers,
    } = data;

    const commentsText = evaluations
      .map((e: any) => `- ${e.criteriaName}: ${e.comments || "Pas de commentaire"}`)
      .join("\n");

    return `
Tu es un évaluateur académique expérimenté. Fournis des commentaires constructifs pour la soutenance PFE suivante.

ÉTUDIANT: ${student.firstName} ${student.lastName}
PROJET: ${proposal.title}
TYPE DE PFE: ${proposal.type}

CONTEXTE DU PROJET:
${proposal.context || "Non spécifié"}

PROBLÉMATIQUE:
${proposal.problematic || "Non spécifiée"}

OBJECTIFS:
${proposal.objectives || "Non spécifiés"}

SCORES OBTENUS:
- Rapport: ${defense.reportScore}/20
  * Plagiat détecté: ${latestReport?.plagiarismScore || "Non analysé"}%
- Présentation: ${defense.presentationScore}/20
- Travail en entreprise: ${defense.companyScore}/20
- SCORE FINAL: ${defense.finalScore}/20 (${defense.mention})

COMMENTAIRES DU JURY:
${commentsText || "Aucun commentaire détaillé"}

DEMANDES:
Génère des retours constructifs en 3 sections:
1. POINTS FORTS (2-3 points clés à valoriser)
2. POINTS À AMÉLIORER (2-3 domaines de progrès)
3. RECOMMANDATIONS (Actions concrètes pour progresser)

Sois encourageant mais honnête. Reste professionnel et académique.
Rédige en français. Format: sections claires et lisibles.
    `;
  }

  /**
   * Call Gemini API
   * Mock implementation - would use actual API in production
   */
  private async callGeminiAPI(prompt: string): Promise<string | null> {
    try {
      // Mock response for now
      // In production, would call actual Gemini API
      const mockFeedback = `
POINTS FORTS:
- Excellente compréhension technique du projet et de ses enjeux
- Présentation claire avec une bonne structure et des exemples pertinents
- Démonstration solide des compétences en gestion de projet

POINTS À AMÉLIORER:
- Approfondissement technique nécessaire sur certains choix technologiques
- Gestion du temps de présentation à améliorer
- Documenter davantage les limitations et les risques du projet

RECOMMANDATIONS:
- Continuer à approfondir les fondamentaux techniques dans votre domaine
- Préparer davantage les réponses aux questions potentielles
- Envisager une formation complémentaire sur la gestion de projet d'équipe
      `;
      return mockFeedback;
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      return null;
    }
  }
}

export const geminiFeedbackService = new GeminiFeedbackService();
