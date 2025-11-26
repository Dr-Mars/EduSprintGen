/**
 * Notification Preference Service
 * Manages user notification preferences
 */

import { storage } from "./storage";
import type { InsertNotificationPreference } from "@shared/schema";

export class NotificationPreferenceService {
  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string) {
    return storage.getNotificationPreferences(userId);
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId: string, preferences: Partial<InsertNotificationPreference>) {
    const existing = await storage.getNotificationPreferences(userId);

    if (!existing) {
      return storage.createNotificationPreferences({
        userId,
        emailOnProposalSubmitted: true,
        emailOnProposalValidated: true,
        emailOnDefenseScheduled: true,
        emailOnEvaluationReady: true,
        emailDigestFrequency: "daily",
        ...preferences,
      } as InsertNotificationPreference);
    }

    return storage.updateNotificationPreferences(userId, preferences);
  }

  /**
   * Set default preferences for new user
   */
  async setDefaultPreferences(userId: string) {
    return storage.createNotificationPreferences({
      userId,
      emailOnProposalSubmitted: true,
      emailOnProposalValidated: true,
      emailOnDefenseScheduled: true,
      emailOnEvaluationReady: true,
      emailDigestFrequency: "daily",
    } as InsertNotificationPreference);
  }

  /**
   * Check if user should receive notification
   */
  async shouldNotify(userId: string, notificationType: string): Promise<boolean> {
    const prefs = await this.getUserPreferences(userId);
    if (!prefs) return true;

    switch (notificationType) {
      case "proposal_submitted":
        return prefs.emailOnProposalSubmitted;
      case "proposal_validated":
        return prefs.emailOnProposalValidated;
      case "defense_scheduled":
        return prefs.emailOnDefenseScheduled;
      case "evaluation_ready":
        return prefs.emailOnEvaluationReady;
      default:
        return true;
    }
  }
}

export const notificationPreferenceService = new NotificationPreferenceService();
