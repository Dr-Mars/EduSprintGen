/**
 * Notification Service
 * Handles notification creation, retrieval, and management
 */

import { storage } from "./storage";
import type { InsertNotification } from "@shared/schema";

export class NotificationService {
  /**
   * Create notification
   */
  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    relatedId?: string
  ) {
    return storage.createNotification({
      userId,
      type,
      title,
      message,
      relatedId,
      isRead: false,
    } as InsertNotification);
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, limit: number = 20) {
    return storage.getUserNotifications(userId, limit);
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string) {
    return storage.markNotificationAsRead(notificationId);
  }

  /**
   * Mark all user notifications as read
   */
  async markAllNotificationsAsRead(userId: string) {
    return storage.markAllNotificationsAsRead(userId);
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string) {
    return storage.deleteNotification(notificationId);
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return storage.getUnreadCount(userId);
  }

  /**
   * Notify on proposal submitted
   */
  async notifyProposalSubmitted(studentId: string, proposalTitle: string, proposalId: string) {
    return this.createNotification(
      studentId,
      "proposal_submitted",
      "Proposition soumise",
      `Votre proposition "${proposalTitle}" a été soumise avec succès`,
      proposalId
    );
  }

  /**
   * Notify on proposal validated
   */
  async notifyProposalValidated(studentId: string, proposalTitle: string, proposalId: string) {
    return this.createNotification(
      studentId,
      "proposal_validated",
      "Proposition validée",
      `Votre proposition "${proposalTitle}" a été validée`,
      proposalId
    );
  }

  /**
   * Notify on defense scheduled
   */
  async notifyDefenseScheduled(userId: string, studentName: string, defenseDate: Date, defenseId: string) {
    return this.createNotification(
      userId,
      "defense_scheduled",
      "Soutenance programmée",
      `Soutenance de ${studentName} programmée pour le ${defenseDate.toLocaleDateString("fr-FR")}`,
      defenseId
    );
  }

  /**
   * Notify on evaluation ready
   */
  async notifyEvaluationReady(userId: string, studentName: string, defenseId: string) {
    return this.createNotification(
      userId,
      "evaluation_ready",
      "Évaluation prête",
      `La soutenance de ${studentName} est prête pour évaluation`,
      defenseId
    );
  }
}

export const notificationService = new NotificationService();
