/**
 * Settings Service
 * Manages system settings and configuration
 */

import { storage } from "./storage";
import type { InsertSystemSetting } from "@shared/schema";

export class SettingsService {
  /**
   * Get single setting
   */
  async getSetting(key: string) {
    return storage.getSystemSetting(key);
  }

  /**
   * Get all settings by category
   */
  async getAllSettings(category?: string) {
    return storage.getAllSystemSettings(category);
  }

  /**
   * Update setting
   */
  async updateSetting(key: string, value: string, description?: string) {
    return storage.updateSystemSetting(key, value);
  }

  /**
   * Initialize default settings
   */
  async initializeDefaults() {
    const defaultSettings = [
      {
        key: "default_defense_duration",
        value: "60",
        category: "defense",
        description: "Durée par défaut des soutenances (minutes)",
      },
      {
        key: "defense_buffer_time",
        value: "30",
        category: "defense",
        description: "Temps tampon entre les soutenances (minutes)",
      },
      {
        key: "max_defenses_per_jury_per_week",
        value: "4",
        category: "defense",
        description: "Nombre maximum de soutenances par jury par semaine",
      },
      {
        key: "grading_scale_excellent",
        value: "16",
        category: "grading",
        description: "Note seuil pour Excellent (sur 20)",
      },
      {
        key: "grading_scale_tres_bien",
        value: "14.4",
        category: "grading",
        description: "Note seuil pour Très Bien (sur 20)",
      },
      {
        key: "grading_scale_bien",
        value: "12.6",
        category: "grading",
        description: "Note seuil pour Bien (sur 20)",
      },
      {
        key: "report_weight",
        value: "0.3",
        category: "grading",
        description: "Poids du rapport dans la note finale",
      },
      {
        key: "presentation_weight",
        value: "0.4",
        category: "grading",
        description: "Poids de la présentation dans la note finale",
      },
      {
        key: "company_weight",
        value: "0.3",
        category: "grading",
        description: "Poids de l'évaluation entreprise dans la note finale",
      },
      {
        key: "email_notifications_enabled",
        value: "true",
        category: "email",
        description: "Activer les notifications par email",
      },
      {
        key: "default_email_digest_frequency",
        value: "daily",
        category: "email",
        description: "Fréquence par défaut du résumé email (daily/weekly/never)",
      },
    ];

    for (const setting of defaultSettings) {
      const existing = await storage.getSystemSetting(setting.key);
      if (!existing) {
        await storage.updateSystemSetting(setting.key, setting.value);
      }
    }

    return defaultSettings;
  }

  /**
   * Get defense rooms
   */
  async getDefenseRooms() {
    const roomsSetting = await storage.getSystemSetting("defense_rooms");
    if (!roomsSetting) {
      return [];
    }

    try {
      return JSON.parse(roomsSetting.value);
    } catch {
      return [];
    }
  }

  /**
   * Update defense rooms
   */
  async updateDefenseRooms(rooms: string[]) {
    return storage.updateSystemSetting("defense_rooms", JSON.stringify(rooms));
  }

  /**
   * Add defense room
   */
  async addDefenseRoom(room: string) {
    const rooms = await this.getDefenseRooms();
    if (!rooms.includes(room)) {
      rooms.push(room);
      await this.updateDefenseRooms(rooms);
    }
    return rooms;
  }

  /**
   * Remove defense room
   */
  async removeDefenseRoom(room: string) {
    const rooms = await this.getDefenseRooms();
    const filtered = rooms.filter((r: string) => r !== room);
    await this.updateDefenseRooms(filtered);
    return filtered;
  }

  /**
   * Get grading thresholds
   */
  async getGradingThresholds() {
    const excellent = await storage.getSystemSetting("grading_scale_excellent");
    const tresBien = await storage.getSystemSetting("grading_scale_tres_bien");
    const bien = await storage.getSystemSetting("grading_scale_bien");

    return {
      excellent: excellent ? parseFloat(excellent.value) : 16,
      tresBien: tresBien ? parseFloat(tresBien.value) : 14.4,
      bien: bien ? parseFloat(bien.value) : 12.6,
    };
  }

  /**
   * Get scoring weights
   */
  async getScoringWeights() {
    const reportWeight = await storage.getSystemSetting("report_weight");
    const presentationWeight = await storage.getSystemSetting("presentation_weight");
    const companyWeight = await storage.getSystemSetting("company_weight");

    return {
      report: reportWeight ? parseFloat(reportWeight.value) : 0.3,
      presentation: presentationWeight ? parseFloat(presentationWeight.value) : 0.4,
      company: companyWeight ? parseFloat(companyWeight.value) : 0.3,
    };
  }

  /**
   * Validate settings
   */
  async validateSettings(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    const weights = await this.getScoringWeights();
    const totalWeight = weights.report + weights.presentation + weights.company;

    if (Math.abs(totalWeight - 1.0) > 0.01) {
      errors.push(`Les poids doivent totaliser 1.0, actuellement: ${totalWeight}`);
    }

    const thresholds = await this.getGradingThresholds();
    if (thresholds.excellent <= thresholds.tresBien) {
      errors.push("Le seuil Excellent doit être supérieur à Très Bien");
    }
    if (thresholds.tresBien <= thresholds.bien) {
      errors.push("Le seuil Très Bien doit être supérieur à Bien");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const settingsService = new SettingsService();
