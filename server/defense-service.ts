/**
 * Defense Service
 * Handles defense scheduling, validation, and room/jury availability checks
 */

import { storage } from "./storage";

const DEFENSE_DURATION_DEFAULT = 60; // minutes
const DEFENSE_BUFFER = 30; // 30-minute buffer before/after defense

export class DefenseService {
  /**
   * Create a new defense with validation
   */
  async createDefense(
    pfeProposalId: string,
    scheduledAt: Date,
    room: string,
    duration: number = DEFENSE_DURATION_DEFAULT
  ) {
    // Validate scheduled time is in future
    if (new Date(scheduledAt) <= new Date()) {
      throw new Error("La date de soutenance doit être dans le futur");
    }

    // Check proposal exists
    const proposal = await storage.getPfeProposal(pfeProposalId);
    if (!proposal) {
      throw new Error("Proposition non trouvée");
    }

    // Check proposal is validated (can't schedule defense for non-validated proposals)
    if (proposal.status !== "validated") {
      throw new Error(
        "La proposition doit être validée avant de programmer une soutenance"
      );
    }

    // Check room availability
    const roomAvailable = await this.isRoomAvailable(
      room,
      new Date(scheduledAt),
      duration
    );
    if (!roomAvailable) {
      throw new Error("La salle n'est pas disponible à cette heure");
    }

    // Create defense
    const defense = await storage.createDefense({
      pfeProposalId,
      scheduledAt: new Date(scheduledAt),
      room,
      duration,
      status: "scheduled",
    });

    return defense;
  }

  /**
   * Check if a room is available for a given time slot
   * Adds buffer before and after to prevent consecutive defenses
   */
  async isRoomAvailable(
    room: string,
    scheduledAt: Date,
    duration: number
  ): Promise<boolean> {
    // Get all defenses in this room
    const allDefenses = await storage.listDefenses({});
    const roomDefenses = allDefenses.filter(
      (d: any) => d.room === room && d.status !== "cancelled"
    );

    const startTime = new Date(scheduledAt);
    const endTime = new Date(
      startTime.getTime() + duration * 60 * 1000
    );

    // Add buffer windows
    const bufferStart = new Date(startTime.getTime() - DEFENSE_BUFFER * 60 * 1000);
    const bufferEnd = new Date(endTime.getTime() + DEFENSE_BUFFER * 60 * 1000);

    // Check for conflicts
    for (const existingDefense of roomDefenses) {
      const existingStart = new Date(existingDefense.scheduledAt);
      const existingEnd = new Date(
        existingStart.getTime() + existingDefense.duration * 60 * 1000
      );

      // Check if time windows overlap
      if (bufferStart < existingEnd && bufferEnd > existingStart) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get jury member's schedule for a week
   * Used to check workload limits
   */
  async getJuryMemberSchedule(
    userId: string,
    weekStart: Date,
    weekEnd: Date
  ) {
    const allDefenses = await storage.listDefenses({});
    const allJuryMemberships = [];

    // Build jury memberships map
    for (const defense of allDefenses) {
      if (new Date(defense.scheduledAt) >= weekStart &&
          new Date(defense.scheduledAt) <= weekEnd &&
          defense.status !== "cancelled") {
        const juryMembers = await storage.listJuryMembersByDefense(defense.id);
        const userIsMember = juryMembers.some(
          (m: any) => m.userId === userId
        );
        if (userIsMember) {
          allJuryMemberships.push(defense);
        }
      }
    }

    return allJuryMemberships;
  }

  /**
   * Reschedule an existing defense
   */
  async rescheduleDefense(
    defenseId: string,
    newScheduledAt: Date,
    newRoom: string
  ) {
    const defense = await storage.getDefense(defenseId);
    if (!defense) {
      throw new Error("Soutenance non trouvée");
    }

    if (defense.status === "completed" || defense.status === "cancelled") {
      throw new Error("Impossible de reprogrammer une soutenance complétée ou annulée");
    }

    // Validate new time is in future
    if (new Date(newScheduledAt) <= new Date()) {
      throw new Error("La nouvelle date doit être dans le futur");
    }

    // Check new room available
    const roomAvailable = await this.isRoomAvailable(
      newRoom,
      new Date(newScheduledAt),
      defense.duration
    );
    if (!roomAvailable) {
      throw new Error("La nouvelle salle n'est pas disponible");
    }

    return storage.updateDefense(defenseId, {
      scheduledAt: new Date(newScheduledAt),
      room: newRoom,
    });
  }

  /**
   * Cancel a defense
   */
  async cancelDefense(defenseId: string, reason?: string) {
    const defense = await storage.getDefense(defenseId);
    if (!defense) {
      throw new Error("Soutenance non trouvée");
    }

    if (defense.status === "completed") {
      throw new Error("Impossible d'annuler une soutenance déjà complétée");
    }

    const updateData: any = { status: "cancelled" };
    if (reason) {
      updateData.comments = reason;
    }

    return storage.updateDefense(defenseId, updateData);
  }

  /**
   * Complete a defense (mark as completed)
   * Called after all evaluations submitted
   */
  async completeDefense(defenseId: string) {
    const defense = await storage.getDefense(defenseId);
    if (!defense) {
      throw new Error("Soutenance non trouvée");
    }

    return storage.updateDefense(defenseId, {
      status: "completed",
      updatedAt: new Date(),
    });
  }

  /**
   * Get all defenses for a proposal
   */
  async getProposalDefenses(pfeProposalId: string) {
    const allDefenses = await storage.listDefenses({});
    return allDefenses.filter((d: any) => d.pfeProposalId === pfeProposalId);
  }

  /**
   * Get upcoming defenses for a jury member
   */
  async getUpcomingDefensesForJury(userId: string, days: number = 30) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const allDefenses = await storage.listDefenses({});
    const userDefenses = [];

    for (const defense of allDefenses) {
      if (defense.status === "scheduled" || defense.status === "completed") {
        const defenseDate = new Date(defense.scheduledAt);
        if (defenseDate >= now && defenseDate <= futureDate) {
          const juryMembers = await storage.listJuryMembersByDefense(defense.id);
          const isMember = juryMembers.some((m: any) => m.userId === userId);
          if (isMember) {
            userDefenses.push(defense);
          }
        }
      }
    }

    return userDefenses.sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );
  }
}

export const defenseService = new DefenseService();
