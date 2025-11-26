/**
 * Jury Service
 * Handles jury composition, conflict of interest detection, and workload validation
 */

import { storage } from "./storage";

const JURY_WORKLOAD_LIMIT = 4; // Max defenses per jury member per week

export class JuryService {
  /**
   * Add jury member with comprehensive validation
   */
  async addJuryMember(
    defenseId: string,
    userId: string,
    role: "president" | "rapporteur" | "examiner" | "supervisor"
  ) {
    // Validate defense exists
    const defense = await storage.getDefense(defenseId);
    if (!defense) {
      throw new Error("Soutenance non trouvée");
    }

    // Validate user exists
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    // Get proposal for conflict checking
    const proposal = await storage.getPfeProposal(defense.pfeProposalId);
    if (!proposal) {
      throw new Error("Proposition non trouvée");
    }

    // Get existing jury members
    const existingJury = await storage.listJuryMembersByDefense(defenseId);

    // ====================
    // CONFLICT OF INTEREST CHECKS
    // ====================

    // 1. Student cannot be on own jury
    if (userId === proposal.studentId) {
      throw new Error("L'étudiant ne peut pas être membre du jury");
    }

    // 2. Academic supervisor conflict
    if (
      userId === proposal.academicSupervisorId &&
      (role === "rapporteur" || role === "examiner")
    ) {
      throw new Error(
        "Le superviseur académique ne peut que tenir le rôle de 'superviseur' dans le jury"
      );
    }

    // 3. Company supervisor conflict
    if (
      userId === proposal.companySupervisorId &&
      (role === "rapporteur" || role === "examiner")
    ) {
      throw new Error(
        "Le superviseur d'entreprise ne peut que tenir le rôle de 'superviseur' dans le jury"
      );
    }

    // 4. No duplicate jury members
    if (existingJury.some((m: any) => m.userId === userId)) {
      throw new Error("Cet utilisateur est déjà membre du jury");
    }

    // 5. No multiple roles per person in same defense
    if (existingJury.some((m: any) => m.userId === userId)) {
      throw new Error(
        "La même personne ne peut pas avoir plusieurs rôles dans la même soutenance"
      );
    }

    // ====================
    // WORKLOAD CHECKS
    // ====================

    // Get jury member's week schedule
    const defenseDate = new Date(defense.scheduledAt);
    const weekStart = this.getWeekStart(defenseDate);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const allDefenses = await storage.listDefenses({});
    const userWeekDefenses = [];

    for (const d of allDefenses) {
      if (d.status !== "cancelled" && d.id !== defenseId) {
        const d_date = new Date(d.scheduledAt);
        if (d_date >= weekStart && d_date <= weekEnd) {
          const jury = await storage.listJuryMembersByDefense(d.id);
          if (jury.some((m: any) => m.userId === userId)) {
            userWeekDefenses.push(d);
          }
        }
      }
    }

    if (userWeekDefenses.length >= JURY_WORKLOAD_LIMIT) {
      throw new Error(
        `Le membre du jury a déjà ${JURY_WORKLOAD_LIMIT} soutenances cette semaine`
      );
    }

    // ====================
    // CREATE JURY MEMBER
    // ====================

    return storage.addJuryMember({
      defenseId,
      userId,
      role,
    });
  }

  /**
   * Remove jury member
   */
  async removeJuryMember(juryMemberId: string) {
    const defense = await storage.getDefense(juryMemberId);
    if (defense && defense.status === "completed") {
      throw new Error(
        "Impossible de retirer un membre du jury d'une soutenance complétée"
      );
    }

    await storage.removeJuryMember(juryMemberId);
  }

  /**
   * Validate jury composition for a defense
   * Ensures all required roles are assigned
   */
  async validateJuryComposition(defenseId: string): Promise<{
    isValid: boolean;
    missing: string[];
    jury: any[];
  }> {
    const juryMembers = await storage.listJuryMembersByDefense(defenseId);
    const defense = await storage.getDefense(defenseId);
    const proposal = await storage.getPfeProposal(defense.pfeProposalId);

    const missing: string[] = [];
    const roles: { [key: string]: number } = {
      president: 0,
      rapporteur: 0,
      examiner: 0,
      supervisor: 0,
    };

    for (const member of juryMembers) {
      roles[member.role]++;
    }

    // Check required roles
    if (roles.president < 1) missing.push("Président");
    if (roles.rapporteur < 1) missing.push("Rapporteur");
    if (roles.examiner < 1) missing.push("Examinateur");

    // For company PFEs, both supervisors required
    if (proposal.type === "company") {
      if (roles.supervisor < 2) missing.push("Superviseurs (académique et entreprise)");
    }

    return {
      isValid: missing.length === 0,
      missing,
      jury: juryMembers,
    };
  }

  /**
   * Get jury members with full user details
   */
  async getJuryMembersWithDetails(defenseId: string) {
    const juryMembers = await storage.listJuryMembersByDefense(defenseId);

    const withDetails = [];
    for (const member of juryMembers) {
      const user = await storage.getUser(member.userId);
      withDetails.push({
        ...member,
        user: {
          id: user?.id,
          firstName: user?.firstName,
          lastName: user?.lastName,
          email: user?.email,
          role: user?.role,
        },
      });
    }

    return withDetails;
  }

  /**
   * Get week start date (Monday)
   */
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }
}

export const juryService = new JuryService();
