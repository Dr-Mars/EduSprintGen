import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ProposalAnalysis {
  qualityScore: number; // 0-100
  issues: string[];
  suggestions: string[];
  isReadyForSubmission: boolean;
}

export interface PlagiarismAnalysis {
  plagiarismScore: number; // 0-100
  riskLevel: "low" | "medium" | "high";
  suspiciousSections: string[];
}

export async function analyzeProposalQuality(
  title: string,
  description: string,
  context: string,
  problematic: string,
  objectives: string
): Promise<ProposalAnalysis> {
  try {
    const prompt = `You are an academic PFE (Projet de Fin d'Études) proposal reviewer. Analyze the following PFE proposal for academic quality, clarity, and feasibility.

Title: ${title}
Description: ${description}
Context: ${context}
Problematic: ${problematic}
Objectives: ${objectives}

Provide your analysis as JSON with the following structure:
{
  "qualityScore": number (0-100),
  "issues": [list of identified issues],
  "suggestions": [list of improvement suggestions],
  "isReadyForSubmission": boolean
}

Focus on:
1. Clarity and coherence of the proposal
2. Feasibility and scope appropriateness
3. Alignment of objectives with problematic
4. Academic rigor and depth
5. Specificity and measurability of objectives`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            qualityScore: { type: "number" },
            issues: { type: "array", items: { type: "string" } },
            suggestions: { type: "array", items: { type: "string" } },
            isReadyForSubmission: { type: "boolean" },
          },
          required: ["qualityScore", "issues", "suggestions", "isReadyForSubmission"],
        },
      },
      contents: prompt,
    });

    const result = JSON.parse(response.text || "{}");
    return result;
  } catch (error) {
    console.error("Error analyzing proposal quality:", error);
    throw new Error("Erreur lors de l'analyse de la proposition");
  }
}

export async function analyzePlagiarismRisk(
  title: string,
  description: string,
  context: string
): Promise<PlagiarismAnalysis> {
  try {
    const prompt = `You are a plagiarism detection expert. Analyze the following PFE proposal text for potential plagiarism risks and common phrases that might indicate copied content.

Title: ${title}
Description: ${description}
Context: ${context}

Provide your analysis as JSON with the following structure:
{
  "plagiarismScore": number (0-100, where 100 is highest plagiarism risk),
  "riskLevel": "low" | "medium" | "high",
  "suspiciousSections": [list of sections or phrases that seem generic or commonly used]
}

Focus on detecting:
1. Generic or overly common phrases
2. Lack of specific details and personalization
3. Boilerplate content patterns
4. Missing unique institutional or company-specific references`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            plagiarismScore: { type: "number" },
            riskLevel: { type: "string", enum: ["low", "medium", "high"] },
            suspiciousSections: { type: "array", items: { type: "string" } },
          },
          required: ["plagiarismScore", "riskLevel", "suspiciousSections"],
        },
      },
      contents: prompt,
    });

    const result = JSON.parse(response.text || "{}");
    return result;
  } catch (error) {
    console.error("Error analyzing plagiarism risk:", error);
    throw new Error("Erreur lors de l'analyse de plagiat");
  }
}

export async function generateEvaluationFeedback(
  proposalTitle: string,
  evaluationCriteria: string[],
  scores: number[]
): Promise<string> {
  try {
    const criteriaDetails = evaluationCriteria
      .map((criterion, i) => `${criterion}: ${scores[i]}/20`)
      .join("\n");

    const prompt = `You are an academic evaluator. Generate constructive feedback for a PFE proposal defense evaluation.

Proposal Title: ${proposalTitle}

Evaluation Scores:
${criteriaDetails}

Generate a brief, encouraging feedback message in French that:
1. Acknowledges the overall performance
2. Highlights strengths based on scores
3. Suggests areas for improvement
4. Encourages the student

Keep it concise (2-3 paragraphs max) and professional but supportive.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Feedback non disponible";
  } catch (error) {
    console.error("Error generating evaluation feedback:", error);
    throw new Error("Erreur lors de la génération du feedback");
  }
}
