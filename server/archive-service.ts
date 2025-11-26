/**
 * Archive Service
 * Handles archiving and restoration of records
 */

import { storage } from "./storage";
import type { InsertArchiveRecord } from "@shared/schema";

export class ArchiveService {
  /**
   * Archive proposal
   */
  async archiveProposal(proposalId: string, userId: string) {
    const proposal = await storage.getPfeProposal(proposalId);
    if (!proposal) {
      throw new Error("Proposition non trouvée");
    }

    return storage.createArchiveRecord({
      recordType: "pfe_proposal",
      recordId: proposalId,
      recordData: JSON.stringify(proposal),
      archivedBy: userId,
    } as InsertArchiveRecord);
  }

  /**
   * Archive defense
   */
  async archiveDefense(defenseId: string, userId: string) {
    const defense = await storage.getDefense(defenseId);
    if (!defense) {
      throw new Error("Soutenance non trouvée");
    }

    return storage.createArchiveRecord({
      recordType: "defense",
      recordId: defenseId,
      recordData: JSON.stringify(defense),
      archivedBy: userId,
    } as InsertArchiveRecord);
  }

  /**
   * Archive report
   */
  async archiveReport(reportId: string, userId: string) {
    const report = await storage.getReport(reportId);
    if (!report) {
      throw new Error("Rapport non trouvé");
    }

    return storage.createArchiveRecord({
      recordType: "report",
      recordId: reportId,
      recordData: JSON.stringify(report),
      archivedBy: userId,
    } as InsertArchiveRecord);
  }

  /**
   * List archives
   */
  async listArchives(filters?: { recordType?: string; recordId?: string; limit?: number; offset?: number }) {
    return storage.listArchiveRecords(filters);
  }

  /**
   * Get single archive
   */
  async getArchive(archiveId: string) {
    return storage.getArchiveRecord(archiveId);
  }

  /**
   * Delete archive
   */
  async deleteArchive(archiveId: string) {
    return storage.deleteArchiveRecord(archiveId);
  }

  /**
   * Restore from archive
   */
  async restoreArchive(archiveId: string) {
    const archive = await storage.getArchiveRecord(archiveId);
    if (!archive) {
      throw new Error("Archive non trouvée");
    }

    try {
      const data = JSON.parse(archive.recordData);
      return {
        success: true,
        data,
        message: "Archive restaurée avec succès",
      };
    } catch (error) {
      throw new Error("Impossible de restaurer l'archive - données corrompues");
    }
  }

  /**
   * Export archives to JSON
   */
  async exportArchivesJSON(filters?: { recordType?: string; limit?: number }) {
    const archives = await this.listArchives(filters);
    return archives.map((archive) => ({
      id: archive.id,
      type: archive.recordType,
      recordId: archive.recordId,
      archivedAt: archive.archivedAt,
      data: JSON.parse(archive.recordData),
    }));
  }

  /**
   * Export archives to CSV
   */
  async exportArchivesCSV(filters?: { recordType?: string; limit?: number }) {
    const archives = await this.listArchives(filters);

    let csv = "ID,Type,RecordID,ArchivedAt\n";
    archives.forEach((archive) => {
      csv += `${archive.id},"${archive.recordType}","${archive.recordId}","${archive.archivedAt.toISOString()}"\n`;
    });

    return csv;
  }
}

export const archiveService = new ArchiveService();
