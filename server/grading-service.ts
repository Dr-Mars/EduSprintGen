/**
 * Grading Service
 * Handles evaluation criteria, score calculation, and mention assignment
 */

import { storage } from "./storage";

// Evaluation criteria with max scores
export const EVALUATION_CRITERIA = {
  report: [
    {
      name: "content_quality",
      label: "Qualité du contenu",
      maxScore: 8,
      description: "Complétude et exactitude du rapport",
    },
    {
      name: "technical_depth",
      label: "Profondeur technique",
      maxScore: 8,
      description: "Analyse technique approfondie",
    },
    {
      name: "plagiarism_penalty",
      label: "Considération du plagiat",
      maxScore: 4,
      description: "Pénalité plagiat considérée",
    },
  ],
  presentation: [
    {
      name: "clarity",
      label: "Clarté",
      maxScore: 6,
      description: "Clarté de la présentation",
    },
    {
      name: "technical_knowledge",
      label: "Connaissance technique",
      maxScore: 7,
      description: "Maîtrise technique démontrée",
    },
    {
      name: "qa_handling",
      label: "Gestion des questions",
      maxScore: 7,
      description: "Réponses aux questions",
    },
  ],
  company: [
    {
      name: "professional_competency",
      label: "Compétence professionnelle",
      maxScore: 10,
      description: "Compétences professionnelles",
    },
    {
      name: "project_contribution",
      label: "Contribution au projet",
      maxScore: 10,
      description: "Contribution au projet",
    },
  ],
};

// Scoring weights
export const SCORING_WEIGHTS = {
  report: 0.3,
  presentation: 0.4,
  company: 0.3,
};

export class GradingService {
  /**
   * Submit evaluation scores from a jury member
   */
  async submitEvaluation(
    defenseId: string,
    juryMemberId: string,
    evaluations: Array<{ criteriaName: string; score: number; comments?: string }>
  ) {
    // Validate defense exists
    const defense = await storage.getDefense(defenseId);
    if (!defense) {
      throw new Error("Soutenance non trouvée");
    }

    // Validate jury member exists and belongs to this defense
    const allJury = await storage.listJuryMembersByDefense(defenseId);
    const juryMember = allJury.find((m: any) => m.id === juryMemberId);
    if (!juryMember) {
      throw new Error("Membre du jury non trouvé");
    }

    // Get all criteria
    const allCriteria = Object.values(EVALUATION_CRITERIA).flat();

    // Validate each evaluation
    for (const eval of evaluations) {
      const criteria = allCriteria.find((c) => c.name === eval.criteriaName);
      if (!criteria) {
        throw new Error(`Critère invalide: ${eval.criteriaName}`);
      }

      if (eval.score < 0 || eval.score > criteria.maxScore) {
        throw new Error(
          `Score invalide pour ${criteria.label}: doit être entre 0 et ${criteria.maxScore}`
        );
      }

      // Check for duplicate criteria from same jury member
      const existing = await storage.listEvaluationsByDefense(defenseId);
      const duplicate = existing.find(
        (e: any) =>
          e.juryMemberId === juryMemberId &&
          e.criteriaName === eval.criteriaName
      );
      if (duplicate) {
        throw new Error(
          `Le critère "${criteria.label}" a déjà été évalué par ce jury`
        );
      }

      // Create evaluation record
      await storage.createEvaluation({
        defenseId,
        juryMemberId,
        criteriaName: eval.criteriaName,
        score: eval.score,
        maxScore: criteria.maxScore,
        comments: eval.comments || "",
      });
    }

    // Check if all jury members have submitted
    const allJuryMembers = await storage.listJuryMembersByDefense(defenseId);
    const canCalculate = await this.canCalculateScores(defenseId, allJuryMembers);

    if (canCalculate) {
      // Calculate and update defense scores
      await this.calculateDefenseScores(defenseId);
    }
  }

  /**
   * Check if all jury members have submitted evaluations
   */
  private async canCalculateScores(
    defenseId: string,
    juryMembers: any[]
  ): Promise<boolean> {
    const allEvaluations = await storage.listEvaluationsByDefense(defenseId);
    const allCriteria = Object.values(EVALUATION_CRITERIA).flat();

    // Each jury member must have submitted all criteria
    for (const jury of juryMembers) {
      for (const criteria of allCriteria) {
        const hasEval = allEvaluations.some(
          (e: any) =>
            e.juryMemberId === jury.id &&
            e.criteriaName === criteria.name
        );
        if (!hasEval) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Calculate defense scores from all jury evaluations
   */
  private async calculateDefenseScores(defenseId: string) {
    const evaluations = await storage.listEvaluationsByDefense(defenseId);
    const juryMembers = await storage.listJuryMembersByDefense(defenseId);

    // Group evaluations by criteria
    const scoreByCriteria: { [key: string]: number[] } = {};

    for (const eval of evaluations) {
      if (!scoreByCriteria[eval.criteriaName]) {
        scoreByCriteria[eval.criteriaName] = [];
      }
      scoreByCriteria[eval.criteriaName].push(eval.score);
    }

    // Calculate component totals (average across jury members)
    const reportCriteria = EVALUATION_CRITERIA.report;
    const presentationCriteria = EVALUATION_CRITERIA.presentation;
    const companyCriteria = EVALUATION_CRITERIA.company;

    let reportTotal = 0;
    let reportMaxTotal = 0;
    for (const crit of reportCriteria) {
      const scores = scoreByCriteria[crit.name] || [];
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;
      reportTotal += avg;
      reportMaxTotal += crit.maxScore;
    }

    let presentationTotal = 0;
    let presentationMaxTotal = 0;
    for (const crit of presentationCriteria) {
      const scores = scoreByCriteria[crit.name] || [];
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;
      presentationTotal += avg;
      presentationMaxTotal += crit.maxScore;
    }

    let companyTotal = 0;
    let companyMaxTotal = 0;
    for (const crit of companyCriteria) {
      const scores = scoreByCriteria[crit.name] || [];
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;
      companyTotal += avg;
      companyMaxTotal += crit.maxScore;
    }

    // Normalize to /20 scale
    const reportScore = (reportTotal / reportMaxTotal) * 20;
    const presentationScore = (presentationTotal / presentationMaxTotal) * 20;
    const companyScore = (companyTotal / companyMaxTotal) * 20;

    // Calculate weighted final score (out of 20)
    const finalScore =
      reportScore * SCORING_WEIGHTS.report +
      presentationScore * SCORING_WEIGHTS.presentation +
      companyScore * SCORING_WEIGHTS.company;

    // Determine mention
    const mention = this.getMention(finalScore);

    // Update defense with scores
    await storage.updateDefense(defenseId, {
      reportScore: Math.round(reportScore * 100) / 100,
      presentationScore: Math.round(presentationScore * 100) / 100,
      companyScore: Math.round(companyScore * 100) / 100,
      finalScore: Math.round(finalScore * 100) / 100,
      mention,
      status: "completed",
      updatedAt: new Date(),
    });
  }

  /**
   * Get honor mention based on final score
   */
  private getMention(score: number): string {
    if (score >= 16) return "Excellent";
    if (score >= 14.4) return "Très Bien";
    if (score >= 12.6) return "Bien";
    if (score >= 10.8) return "Assez Bien";
    if (score >= 9) return "Passable";
    return "Non admis";
  }

  /**
   * Get all criteria (used for form generation)
   */
  getAllCriteria() {
    return EVALUATION_CRITERIA;
  }

  /**
   * Get scoring weights (for frontend preview)
   */
  getScoringWeights() {
    return SCORING_WEIGHTS;
  }

  /**
   * Calculate preview score (for frontend live calculation)
   */
  calculatePreviewScore(evaluations: {
    report: number;
    presentation: number;
    company: number;
  }): {
    finalScore: number;
    mention: string;
  } {
    const finalScore =
      evaluations.report * SCORING_WEIGHTS.report +
      evaluations.presentation * SCORING_WEIGHTS.presentation +
      evaluations.company * SCORING_WEIGHTS.company;

    return {
      finalScore: Math.round(finalScore * 100) / 100,
      mention: this.getMention(finalScore),
    };
  }
}

export const gradingService = new GradingService();
