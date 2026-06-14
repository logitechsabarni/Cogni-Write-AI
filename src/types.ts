/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SeverityType = 'critical' | 'warning' | 'info';

export interface AgentIssue {
  id: string;
  severity: SeverityType;
  text: string;
  suggestion: string;
  originalText?: string;
}

export interface AgentResult {
  agentName: string;
  score: number; // 0 to 100
  feedback: string;
  issues: AgentIssue[];
  strengths: string[];
  gaps: string[];
}

export interface OverallSynthesis {
  overallScore: number;
  grade: string; // e.g., "A", "B+", "C"
  keyStrengths: string[];
  keyGaps: string[];
  actionPlan: string[]; // step-by-step actionable rewrites
}

export interface EvaluationScorecard {
  id: string;
  title: string;
  text: string;
  context: string; // e.g., "SOP for Stanford CS MS", "Cover Letter for Google MD", "Email to CEO"
  timestamp: number;
  overallScore: number;
  grade: string;
  agentResults: Record<string, AgentResult>; // keyed by agent type/ID
  keyStrengths: string[];
  keyGaps: string[];
  actionPlan: string[];
}

export interface SavedDraft {
  id: string;
  title: string;
  text: string;
  context: string;
  updatedAt: number;
}

export interface HackathonMetadata {
  projectName: string;
  hackathonName: string;
  mentorName: string;
  pitchDeck: Array<{
    slideNumber: number;
    title: string;
    description: string;
    bullets: string[];
    visuals: string;
  }>;
  differentiators: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
  scalabilityPlan: {
    databaseSchema: string;
    architectureType: string;
    backendStack: string;
    agentOrchestration: string;
    points: { phase: string; details: string[] }[];
  };
}
