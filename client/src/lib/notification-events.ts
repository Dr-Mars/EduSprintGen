import { apiRequest } from "./queryClient";

/**
 * Notification Events - Trigger notifications for system events
 */

export const notificationEvents = {
  /**
   * Trigger when a proposal is submitted
   */
  onProposalSubmitted: async (studentId: string, proposalTitle: string, coordinatorId: string) => {
    try {
      await apiRequest("/api/notifications", "POST", {
        userId: coordinatorId,
        type: "proposal_submitted",
        title: "Nouvelle proposition PFE",
        message: `Une nouvelle proposition a été soumise: "${proposalTitle}"`,
        relatedId: studentId,
      });
    } catch (error) {
      console.error("Error creating proposal submitted notification:", error);
    }
  },

  /**
   * Trigger when a proposal is validated
   */
  onProposalValidated: async (studentId: string, proposalTitle: string) => {
    try {
      await apiRequest("/api/notifications", "POST", {
        userId: studentId,
        type: "proposal_validated",
        title: "Proposition validée",
        message: `Votre proposition "${proposalTitle}" a été validée!`,
        relatedId: studentId,
      });
    } catch (error) {
      console.error("Error creating proposal validated notification:", error);
    }
  },

  /**
   * Trigger when a proposal is rejected
   */
  onProposalRejected: async (studentId: string, proposalTitle: string, reason?: string) => {
    try {
      await apiRequest("/api/notifications", "POST", {
        userId: studentId,
        type: "proposal_rejected",
        title: "Proposition rejetée",
        message: `Votre proposition "${proposalTitle}" a été rejetée. ${reason ? `Raison: ${reason}` : ""}`,
        relatedId: studentId,
      });
    } catch (error) {
      console.error("Error creating proposal rejected notification:", error);
    }
  },

  /**
   * Trigger when a defense is scheduled
   */
  onDefenseScheduled: async (studentId: string, defenseDate: string, room: string) => {
    try {
      await apiRequest("/api/notifications", "POST", {
        userId: studentId,
        type: "defense_scheduled",
        title: "Soutenance programmée",
        message: `Votre soutenance est programmée pour le ${new Date(defenseDate).toLocaleDateString("fr-FR")} en ${room}`,
        relatedId: studentId,
      });
    } catch (error) {
      console.error("Error creating defense scheduled notification:", error);
    }
  },

  /**
   * Trigger when a defense is completed
   */
  onDefenseCompleted: async (studentId: string, finalScore: number, mention: string) => {
    try {
      await apiRequest("/api/notifications", "POST", {
        userId: studentId,
        type: "defense_completed",
        title: "Soutenance complétée",
        message: `Votre soutenance est terminée. Note: ${finalScore}/20 - ${mention}`,
        relatedId: studentId,
      });
    } catch (error) {
      console.error("Error creating defense completed notification:", error);
    }
  },

  /**
   * Trigger when an evaluation is submitted
   */
  onEvaluationSubmitted: async (juryMemberId: string, studentName: string) => {
    try {
      await apiRequest("/api/notifications", "POST", {
        userId: juryMemberId,
        type: "evaluation_submitted",
        title: "Évaluation soumise",
        message: `Votre évaluation pour ${studentName} a été enregistrée`,
        relatedId: juryMemberId,
      });
    } catch (error) {
      console.error("Error creating evaluation submitted notification:", error);
    }
  },

  /**
   * Trigger when report is uploaded
   */
  onReportUploaded: async (supervisorId: string, studentName: string, isPlagiarismRisk: boolean) => {
    try {
      const riskMessage = isPlagiarismRisk ? " ⚠️ Risque de plagiat détecté" : "";
      await apiRequest("/api/notifications", "POST", {
        userId: supervisorId,
        type: "report_uploaded",
        title: "Rapport soumis",
        message: `${studentName} a soumis un rapport.${riskMessage}`,
        relatedId: supervisorId,
      });
    } catch (error) {
      console.error("Error creating report uploaded notification:", error);
    }
  },

  /**
   * Trigger when jury is assigned
   */
  onJuryAssigned: async (juryMemberId: string, proposalTitle: string, defenseDate: string) => {
    try {
      await apiRequest("/api/notifications", "POST", {
        userId: juryMemberId,
        type: "jury_assigned",
        title: "Affectation de jury",
        message: `Vous avez été affecté comme jury pour "${proposalTitle}" le ${new Date(defenseDate).toLocaleDateString("fr-FR")}`,
        relatedId: juryMemberId,
      });
    } catch (error) {
      console.error("Error creating jury assigned notification:", error);
    }
  },

  /**
   * Trigger for system announcements
   */
  broadcastAnnouncement: async (title: string, message: string, userIds: string[]) => {
    try {
      for (const userId of userIds) {
        await apiRequest("/api/notifications", "POST", {
          userId,
          type: "system_announcement",
          title,
          message,
          relatedId: "system",
        });
      }
    } catch (error) {
      console.error("Error creating announcement notifications:", error);
    }
  },
};
