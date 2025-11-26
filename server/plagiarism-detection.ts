/**
 * Plagiarism Detection Service
 * Compares report content against existing reports in the database
 * Uses Levenshtein distance algorithm for similarity calculation
 */

import { storage } from "./storage";

interface SimilarityResult {
  reportId: string;
  fileName: string;
  similarity: number;
  uploadedAt: Date;
}

/**
 * Calculate Levenshtein distance between two strings
 * Returns similarity percentage (0-100)
 */
function calculateSimilarity(text1: string, text2: string): number {
  const len1 = text1.length;
  const len2 = text2.length;
  
  // Create a 2D array for dynamic programming
  const matrix: number[][] = Array.from({ length: len2 + 1 }, () => Array(len1 + 1).fill(0));
  
  // Initialize first row and column
  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;
  
  // Fill the matrix
  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const cost = text1[i - 1] === text2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,      // deletion
        matrix[j - 1][i] + 1,      // insertion
        matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }
  
  const maxLen = Math.max(len1, len2);
  if (maxLen === 0) return 100;
  
  const distance = matrix[len2][len1];
  return Math.round(((maxLen - distance) / maxLen) * 100);
}

/**
 * Extract text from a mock PDF (simulated for development)
 * In production, use a PDF parser library like pdfjs-dist
 */
function extractTextFromMockPDF(fileUrl: string, fileName: string): string {
  // Simulated extraction - in production, parse actual PDF
  return `Content of ${fileName} - Mock extraction for plagiarism detection`;
}

/**
 * Perform plagiarism detection on a report
 * Compares against existing reports in the same specialty
 */
export async function detectPlagiarism(
  reportId: string,
  proposalId: string,
  fileUrl: string,
  fileName: string
): Promise<{ score: number; similarReports: SimilarityResult[] }> {
  try {
    // Get the current proposal to find specialty
    const proposal = await storage.getPfeProposal(proposalId);
    if (!proposal) {
      return { score: 0, similarReports: [] };
    }

    // Extract text from current report
    const currentText = extractTextFromMockPDF(fileUrl, fileName);
    
    // Get all existing reports from same specialty
    const allProposals = await storage.listPfeProposals();
    const proposalsInSpecialty = allProposals.filter(
      (p: any) => p.specialtyId === proposal.specialtyId && p.id !== proposalId
    );

    // Check similarity with existing reports from those proposals
    const similarReports: SimilarityResult[] = [];
    
    for (const otherProposal of proposalsInSpecialty) {
      const existingReports = await storage.listReportsByProposal(otherProposal.id);
      
      for (const existingReport of existingReports) {
        if (existingReport.fileUrl) {
          const existingText = extractTextFromMockPDF(existingReport.fileUrl, existingReport.fileName);
          const similarity = calculateSimilarity(currentText, existingText);
          
          if (similarity > 30) { // Only track reports with >30% similarity
            similarReports.push({
              reportId: existingReport.id,
              fileName: existingReport.fileName,
              similarity,
              uploadedAt: existingReport.createdAt,
            });
          }
        }
      }
    }

    // Calculate final plagiarism score (highest similarity found)
    const score = similarReports.length > 0 
      ? Math.max(...similarReports.map(r => r.similarity))
      : 0;

    // Sort by similarity descending
    similarReports.sort((a, b) => b.similarity - a.similarity);

    return { score, similarReports };
  } catch (error) {
    console.error("Plagiarism detection error:", error);
    return { score: 0, similarReports: [] };
  }
}

/**
 * Get plagiarism severity level
 */
export function getPlagiarismSeverity(score: number): "low" | "medium" | "high" {
  if (score < 30) return "low";
  if (score < 70) return "medium";
  return "high";
}
