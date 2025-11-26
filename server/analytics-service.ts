/**
 * Analytics Service
 * Generates statistics and analytics for the platform
 */

import { storage } from "./storage";

export class AnalyticsService {
  /**
   * Get system statistics
   */
  async getSystemStats() {
    const users = await storage.listUsers();
    const proposals = await storage.listPfeProposals();
    const defenses = await storage.listDefenses();

    const studentCount = users.filter((u: any) => u.role === "student").length;
    const supervisorCount = users.filter((u: any) => u.role === "academic_supervisor" || u.role === "company_supervisor").length;
    const coordinatorCount = users.filter((u: any) => u.role === "coordinator").length;

    const proposalsSubmitted = proposals.filter((p: any) => p.status === "submitted").length;
    const proposalsValidated = proposals.filter((p: any) => p.status === "validated").length;
    const defensesCompleted = defenses.filter((d: any) => d.status === "completed").length;

    return {
      totalUsers: users.length,
      studentCount,
      supervisorCount,
      coordinatorCount,
      totalProposals: proposals.length,
      proposalsSubmitted,
      proposalsValidated,
      totalDefenses: defenses.length,
      defensesCompleted,
    };
  }

  /**
   * Get completion rate
   */
  async getCompletionRate(academicYearId?: string) {
    const proposals = await storage.listPfeProposals();
    const defenses = await storage.listDefenses();

    const totalProposals = proposals.length;
    const completedProposals = proposals.filter((p: any) => p.status === "validated").length;
    const completedDefenses = defenses.filter((d: any) => d.status === "completed").length;

    return {
      totalProposals,
      completedProposals,
      completionRate: totalProposals > 0 ? (completedProposals / totalProposals) * 100 : 0,
      defensesCompleted: completedDefenses,
      defenseRate: totalProposals > 0 ? (completedDefenses / totalProposals) * 100 : 0,
    };
  }

  /**
   * Get average scores
   */
  async getAverageScores(academicYearId?: string) {
    const defenses = await storage.listDefenses();
    const completedDefenses = defenses.filter((d: any) => d.status === "completed" && d.finalScore);

    if (completedDefenses.length === 0) {
      return {
        averageFinalScore: 0,
        averagePresentationScore: 0,
        averageReportScore: 0,
        averageCompanyScore: 0,
      };
    }

    const avgFinal = completedDefenses.reduce((sum: number, d: any) => sum + (d.finalScore || 0), 0) / completedDefenses.length;
    const avgPresentation = completedDefenses.reduce((sum: number, d: any) => sum + (d.presentationScore || 0), 0) / completedDefenses.length;
    const avgReport = completedDefenses.reduce((sum: number, d: any) => sum + (d.reportScore || 0), 0) / completedDefenses.length;
    const avgCompany = completedDefenses.reduce((sum: number, d: any) => sum + (d.companyScore || 0), 0) / completedDefenses.length;

    return {
      averageFinalScore: Math.round(avgFinal * 100) / 100,
      averagePresentationScore: Math.round(avgPresentation * 100) / 100,
      averageReportScore: Math.round(avgReport * 100) / 100,
      averageCompanyScore: Math.round(avgCompany * 100) / 100,
    };
  }

  /**
   * Get defense statistics
   */
  async getDefenseStatistics(academicYearId?: string) {
    const defenses = await storage.listDefenses();

    return {
      totalDefenses: defenses.length,
      scheduledDefenses: defenses.filter((d: any) => d.status === "scheduled").length,
      completedDefenses: defenses.filter((d: any) => d.status === "completed").length,
      cancelledDefenses: defenses.filter((d: any) => d.status === "cancelled").length,
    };
  }

  /**
   * Get individual student progress
   */
  async getStudentProgress(studentId: string) {
    const proposals = await storage.listPfeProposals({ studentId });
    const proposal = proposals[0];

    if (!proposal) {
      return {
        status: "not_started",
        proposal: null,
        defense: null,
      };
    }

    const defenses = await storage.listDefenses();
    const defense = defenses.find((d: any) => d.pfeProposalId === proposal.id);

    return {
      proposalStatus: proposal.status,
      proposal: {
        id: proposal.id,
        title: proposal.title,
        status: proposal.status,
        createdAt: proposal.createdAt,
      },
      defenseStatus: defense?.status || "not_scheduled",
      defense: defense ? {
        id: defense.id,
        scheduledAt: defense.scheduledAt,
        status: defense.status,
        finalScore: defense.finalScore,
        mention: defense.mention,
      } : null,
    };
  }

  /**
   * Get top performing students
   */
  async getTopPerformers(limit: number = 10, academicYearId?: string) {
    const defenses = await storage.listDefenses();
    const proposals = await storage.listPfeProposals();
    const users = await storage.listUsers();

    const topDefenses = defenses
      .filter((d: any) => d.status === "completed" && d.finalScore)
      .sort((a: any, b: any) => (b.finalScore || 0) - (a.finalScore || 0))
      .slice(0, limit);

    return topDefenses.map((d: any) => {
      const proposal = proposals.find((p: any) => p.id === d.pfeProposalId);
      const student = users.find((u: any) => u.id === proposal?.studentId);

      return {
        studentId: student?.id,
        studentName: `${student?.firstName} ${student?.lastName}`,
        projectTitle: proposal?.title,
        finalScore: d.finalScore,
        mention: d.mention,
      };
    });
  }

  /**
   * Get statistics by specialty
   */
  async getStatisticsBySpecialty(academicYearId?: string) {
    const proposals = await storage.listPfeProposals();
    const specialties = await storage.listSpecialties();
    const defenses = await storage.listDefenses();

    const stats = specialties.map((specialty: any) => {
      const specialtyProposals = proposals.filter((p: any) => p.specialtyId === specialty.id);
      const completedProposals = specialtyProposals.filter((p: any) => p.status === "validated").length;
      const specialtyDefenses = defenses.filter((d: any) => {
        const proposal = specialtyProposals.find((p: any) => p.id === d.pfeProposalId);
        return proposal && d.status === "completed";
      });

      const avgScore = specialtyDefenses.length > 0
        ? specialtyDefenses.reduce((sum: number, d: any) => sum + (d.finalScore || 0), 0) / specialtyDefenses.length
        : 0;

      return {
        specialtyId: specialty.id,
        specialtyName: specialty.name,
        totalProposals: specialtyProposals.length,
        completedProposals,
        completionRate: specialtyProposals.length > 0 ? (completedProposals / specialtyProposals.length) * 100 : 0,
        averageScore: Math.round(avgScore * 100) / 100,
      };
    });

    return stats;
  }

  /**
   * Get statistics by company
   */
  async getStatisticsByCompany(academicYearId?: string) {
    const proposals = await storage.listPfeProposals();
    const companies = await storage.listCompanies();
    const defenses = await storage.listDefenses();

    const stats = companies.map((company: any) => {
      const companyProposals = proposals.filter((p: any) => p.companyId === company.id);
      const completedProposals = companyProposals.filter((p: any) => p.status === "validated").length;
      const companyDefenses = defenses.filter((d: any) => {
        const proposal = companyProposals.find((p: any) => p.id === d.pfeProposalId);
        return proposal && d.status === "completed";
      });

      const avgScore = companyDefenses.length > 0
        ? companyDefenses.reduce((sum: number, d: any) => sum + (d.finalScore || 0), 0) / companyDefenses.length
        : 0;

      return {
        companyId: company.id,
        companyName: company.name,
        totalProposals: companyProposals.length,
        completedProposals,
        completionRate: companyProposals.length > 0 ? (completedProposals / companyProposals.length) * 100 : 0,
        averageScore: Math.round(avgScore * 100) / 100,
      };
    });

    return stats;
  }
}

export const analyticsService = new AnalyticsService();
