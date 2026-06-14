/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;
const DRAFTS_FILE = path.join(process.cwd(), "data_drafts.json");
const SCORECARDS_FILE = path.join(process.cwd(), "data_scorecards.json");

// Helper to read/write mock persistent store
function readDataFile(filepath: string): any[] {
  try {
    if (fs.existsSync(filepath)) {
      return JSON.parse(fs.readFileSync(filepath, "utf-8"));
    }
  } catch (error) {
    console.error(`Error reading ${filepath}:`, error);
  }
  return [];
}

function writeDataFile(filepath: string, data: any[]) {
  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error(`Error writing to ${filepath}:`, error);
  }
}

// Lazy-initialized Gemini AI client
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured in secrets.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// Robust retry policy with exponential backoff for 503 / 429 errors
async function generateWithRetry<T>(
  apiCall: () => Promise<T>,
  retries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: any = null;
  for (let i = 0; i < retries; i++) {
    try {
      return await apiCall();
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      
      const isPermanentQuotaExceeded = 
        errMsg.includes("Quota exceeded") || 
        errMsg.includes("quota exceeded") || 
        errMsg.includes("exceeded your current quota") ||
        errMsg.includes("GenerateRequestsPerDayPerProjectPerModel-FreeTier");

      if (isPermanentQuotaExceeded) {
        console.warn(`[WriteMind AI Orchestrator] Permanent Daily Quota Limit detected. Bypassing retries to deploy local fallback instantly.`);
        throw err;
      }

      const isRetryable =
        errMsg.includes("553") || // Standard code errors
        errMsg.includes("503") ||
        errMsg.includes("UNAVAILABLE") ||
        errMsg.includes("high demand") ||
        errMsg.includes("temporary") ||
        errMsg.includes("429") ||
        errMsg.includes("Quotaexceeded") ||
        errMsg.includes("Rate limit");
      
      if (isRetryable) {
        console.warn(`[WriteMind AI Orchestrator Retry] Server retry attempt ${i + 1}/${retries} triggered by: ${errMsg}`);
        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
          continue;
        }
      } else {
        throw err;
      }
    }
  }
  throw lastError;
}

// Server-side robust fallback analysis engine for 100% up-time
function generateServerLocalEvaluation(rawText: string, targetContext: string, docTitle: string) {
  const textLower = rawText.toLowerCase();
  
  const slopWords = [
    { word: "delve", severity: "critical", agent: "ai_detection", text: "Detected robotic transition term 'delve'. Deep learning vocabulary detectors heavily flag this word.", suggestion: "explore", orig: "" },
    { word: "testament", severity: "critical", agent: "ai_detection", text: "Signature corporate phrasing 'is a testament to'. Heavy marker of automated models.", suggestion: "proof of", orig: "" },
    { word: "tapestry", severity: "critical", agent: "ai_detection", text: "Overly poetic semantic cliché 'elegant tapestry'. Highly targeted by automated screens.", suggestion: "integration", orig: "" },
    { word: "moreover", severity: "warning", agent: "grammar", text: "Heavy transitional connector 'Moreover'. Disrupts natural cadence and sounds highly mechanical.", suggestion: "Furthermore,", orig: "" },
    { word: "leverage", severity: "warning", agent: "brand", text: "Vague corporate buzzword 'leverage'. Use specific description instead of abstract fillers.", suggestion: "utilize", orig: "" },
    { word: "synergy", severity: "warning", agent: "brand", text: "Overdone business jargon 'synergy' or 'synergize'. Represents standard commodity text.", suggestion: "cooperation", orig: "" },
    { word: "assisted in", severity: "warning", agent: "ats", text: "Passive posture 'assisted in'. ATS algorithms prioritize direct responsibility assertions.", suggestion: "co-developed", orig: "" },
    { word: "was responsible for", severity: "critical", agent: "ats", text: "Passive structural statement 'was responsible for'. Highlight authority to level up compliance metrics.", suggestion: "led and orchestrated", orig: "" }
  ];

  let overallScore = 88;
  const matchedSlops = slopWords.filter(item => {
    const idx = textLower.indexOf(item.word);
    if (idx !== -1) {
      const start = Math.max(0, idx - 40);
      const end = Math.min(rawText.length, idx + item.word.length + 40);
      item.orig = rawText.slice(start, end);
      overallScore -= item.severity === "critical" ? 6 : 3;
      return true;
    }
    return false;
  });

  overallScore = Math.max(55, Math.min(98, overallScore));

  let letterGrade = "B";
  if (overallScore >= 95) letterGrade = "A+";
  else if (overallScore >= 90) letterGrade = "A";
  else if (overallScore >= 85) letterGrade = "A-";
  else if (overallScore >= 80) letterGrade = "B+";
  else if (overallScore >= 75) letterGrade = "B";
  else if (overallScore >= 70) letterGrade = "B-";
  else if (overallScore >= 65) letterGrade = "C+";
  else if (overallScore >= 60) letterGrade = "C";
  else letterGrade = "D";

  const agentResults: Record<string, any> = {
    grammar: {
      agentName: "Grammar Agent",
      score: overallScore + 2 > 100 ? 100 : overallScore + 2,
      feedback: "Your writing demonstrates reliable syntax structure with small punctuation and connector optimization needs. Swapping dry transitional words with natural alternatives will instantly raise the level.",
      issues: [],
      strengths: ["Excellent general subject-verb agreement", "Proper paragraph layout structure"],
      gaps: ["Over-reliance on repetitive transition formulas", "Periodic passive formulations"]
    },
    logic: {
      agentName: "Logic Agent",
      score: Math.max(70, overallScore - 4),
      feedback: "The core objectives are represented, but the connection between individual stories needs to be reinforced.",
      issues: [],
      strengths: ["Clear overarching personal motivation", "Structured career trajectory layout"],
      gaps: ["Lacks smooth logical transitions between paragraphs", "Abrupt pivot in final summary statements"]
    },
    humanization: {
      agentName: "Humanization Agent",
      score: Math.max(65, overallScore - 6),
      feedback: "Some sections suffer from uniform pacing and structure, typical of passive copy. Injecting direct conversational accents will boost reader engagement.",
      issues: [],
      strengths: ["Respectful professional registration", "Strong statement of core mission values"],
      gaps: ["Predictable sentence length rhythms", "Stiff, formal phrase constructions"]
    },
    ai_detection: {
      agentName: "AI Detection Agent",
      score: Math.max(60, overallScore - 10),
      feedback: "Elevated risk of automated style profiles! The draft contains multiple static markers such as redundant metaphors. Replacing cliché qualifiers creates a high-contrast human touch.",
      issues: [],
      strengths: ["Consistently clean mechanics", "Standard logical sequencing"],
      gaps: ["Robotic transition patterns", "Includes overused semantic markers"]
    },
    reviewer: {
      agentName: "Reviewer Agent",
      score: Math.max(72, overallScore - 2),
      feedback: "The profile is promising, but reads as slightly generic. Highlight individual ownership and direct outcomes to make a lasting impression on the panel.",
      issues: [],
      strengths: ["Highly ambitious career roadmap", "Proper alignment with context scope guidelines"],
      gaps: ["Generic self-praise instead of proof", "Lacks active leadership examples"]
    },
    ats: {
      agentName: "ATS Agent",
      score: Math.max(68, overallScore - 5),
      feedback: "Your document maps well to technical concepts, but requires substitution of weak words ('assisted in', 'was responsible for') with high-impact verbs to unlock prime scoring.",
      issues: [],
      strengths: ["Includes several rich industry keywords", "Proper contextual vocabulary placement"],
      gaps: ["Diluted by flat, passive descriptions", "Lacks quantifiable metric results"]
    },
    brand: {
      agentName: "Brand Agent",
      score: Math.max(70, overallScore - 3),
      feedback: "The branding represents a baseline standard, but needs a sharper Unique Selling Proposition (USP) so you stand out instantly as an authority in your field.",
      issues: [],
      strengths: ["Clear values orientation highlights", "Expresses distinct long-term career aspirations"],
      gaps: ["Narrative positions yourself as a follower", "Commodity self-introduction framework"]
    },
    recommendation: {
      agentName: "Recommendation Agent",
      score: overallScore,
      feedback: "Based on the multi-agent synthesis, your draft possesses strong baseline attributes but is held back by passive elements and predictable transition patterns. Executing the prioritized action plan will unlock a highly persuasive signature style.",
      issues: [],
      strengths: ["Cohesive structural progression", "Honorable thematic clarity throughout"],
      gaps: ["Standardize interactive sentence pacing index", "De-carbonize automated semantic patterns"]
    }
  };

  matchedSlops.forEach((item, index) => {
    const issueObj = {
      id: `server_issue_${item.agent}_${index}`,
      severity: item.severity,
      text: item.text,
      suggestion: item.suggestion,
      originalText: item.orig || undefined
    };
    if (agentResults[item.agent]) {
      agentResults[item.agent].issues.push(issueObj);
    }
  });

  return {
    id: "scorecard_" + Date.now(),
    title: docTitle || "New Writing Review",
    text: rawText,
    context: targetContext || "General Writing",
    timestamp: Date.now(),
    overallScore,
    grade: letterGrade,
    agentResults,
    keyStrengths: [
      "Explicit professional goals and timeline",
      "Proper paragraph structural balance",
      "Direct values focus aligned with target guidelines"
    ],
    keyGaps: [
      "Includes mechanical transition clichés like 'delve' or 'testament'",
      "Contains passive responsibility descriptions ('assisted in')",
      "Needs more quantifiable business or academic metrics"
    ],
    actionPlan: [
      "Swap identified LLM-slop words like 'delve' or 'tapestry' with direct, active synonyms",
      "Convert passive verbs ('assisted in') to outcome-oriented leadership assertions",
      "Inject distinct personal authority indicators and clear quantitative metrics to maximize ATS scoring"
    ],
    isLocalFallback: true,
    fallbackReason: undefined as string | undefined
  };
}

// Server-side robust fallback improvement engine for 100% uptime
function localImproveText(rawText: string, instruction: string): string {
  let revised = rawText;
  
  if (instruction && instruction.includes('replace the block "') && instruction.includes('" with "')) {
    const match = instruction.match(/replace the block "([^"]+)" with "([^"]+)"/);
    if (match) {
      const originalText = match[1];
      const suggestion = match[2];
      if (rawText.includes(originalText)) {
        return rawText.replace(originalText, suggestion);
      }
    }
  }

  const slopReplacements = [
    { word: "delve deep into", replacement: "explore" },
    { word: "delve into", replacement: "explore" },
    { word: "delve", replacement: "explore" },
    { word: "is a testament to", replacement: "proves" },
    { word: "a testament to", replacement: "proof of" },
    { word: "tapestry", replacement: "integration" },
    { word: "Moreover", replacement: "Furthermore" },
    { word: "moreover", replacement: "furthermore" },
    { word: "leverage", replacement: "utilize" },
    { word: "synergy", replacement: "collaboration" },
    { word: "assisted in", replacement: "co-developed" },
    { word: "was responsible for", replacement: "led" }
  ];

  for (const item of slopReplacements) {
    const regex = new RegExp(`\\b${item.word}\\b`, "gi");
    revised = revised.replace(regex, item.replacement);
  }

  return revised;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "15mb" }));

  // Helper JSON schema for analytical agents
  const analyticalAgentSchema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.INTEGER, description: "Score from 0 to 100 representing quality in this dimension." },
      feedback: { type: Type.STRING, description: "1-2 paragraphs of critical feedback." },
      issues: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "Unique snake_case identifier" },
            severity: { type: Type.STRING, description: "Must be exactly 'critical', 'warning', or 'info'" },
            text: { type: Type.STRING, description: "Explanation of the issue or improvement opportunity." },
            suggestion: { type: Type.STRING, description: "The exact replacement text or structural revision recommended." },
            originalText: { type: Type.STRING, description: "The text segment that triggered this issue (optional)." }
          },
          required: ["id", "severity", "text", "suggestion"]
        }
      },
      strengths: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "List of 2-3 specific strengths in this dimension."
      },
      gaps: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "List of 2-3 specific deficiencies or improvement vectors."
      }
    },
    required: ["score", "feedback", "issues", "strengths", "gaps"]
  };

  // API endpoints

  // Check connection status & lazy load test
  app.get("/api/health", (req, res) => {
    try {
      const hasKey = !!process.env.GEMINI_API_KEY;
      res.json({ status: "ok", geminiConfigured: hasKey });
    } catch {
      res.status(500).json({ status: "error", error: "Internal check failed" });
    }
  });

  // Saved Drafts Routes
  app.get("/api/drafts", (req, res) => {
    res.json(readDataFile(DRAFTS_FILE));
  });

  app.post("/api/drafts", (req, res) => {
    const drafts = readDataFile(DRAFTS_FILE);
    const newDraft = req.body;
    if (!newDraft.id) {
      newDraft.id = "draft_" + Date.now();
    }
    newDraft.updatedAt = Date.now();
    
    const existingIndex = drafts.findIndex((d) => d.id === newDraft.id);
    if (existingIndex >= 0) {
      drafts[existingIndex] = newDraft;
    } else {
      drafts.push(newDraft);
    }
    writeDataFile(DRAFTS_FILE, drafts);
    res.json(newDraft);
  });

  app.delete("/api/drafts/:id", (req, res) => {
    const drafts = readDataFile(DRAFTS_FILE);
    const filtered = drafts.filter((d) => d.id !== req.params.id);
    writeDataFile(DRAFTS_FILE, filtered);
    res.json({ success: true });
  });

  // Saved Scorecards Routes
  app.get("/api/scorecards", (req, res) => {
    res.json(readDataFile(SCORECARDS_FILE));
  });

  app.post("/api/scorecards", (req, res) => {
    const scorecards = readDataFile(SCORECARDS_FILE);
    const newCard = req.body;
    if (!newCard.id) {
      newCard.id = "scorecard_" + Date.now();
    }
    scorecards.push(newCard);
    writeDataFile(SCORECARDS_FILE, scorecards);
    res.json(newCard);
  });

  app.delete("/api/scorecards/:id", (req, res) => {
    const scorecards = readDataFile(SCORECARDS_FILE);
    const filtered = scorecards.filter((s) => s.id !== req.params.id);
    writeDataFile(SCORECARDS_FILE, filtered);
    res.json({ success: true });
  });

  // Multi-Agent Pipeline Orchestration (Optimized Unified Single-Pass Swarm Execution)
  app.post("/api/evaluate", async (req, res) => {
    const { text, context, title } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "No text provided for analysis." });
    }

    try {
      let scorecard;
      try {
        const ai = getGeminiClient();

        const masterScorecardSchema = {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.INTEGER, description: "Composite score from 0 to 100 based on all simulated agent audits." },
            grade: { type: Type.STRING, description: "Academic letter grade based on overallScore (A+, A, A-, B+, B, B-, C+, C, D)." },
            keyStrengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Top 3 overarching strengths compiled." },
            keyGaps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Top 3 overarching critical gaps compiled." },
            actionPlan: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Step-by-step instructions for editing the draft to perfection." },
            agentResults: {
              type: Type.OBJECT,
              properties: {
                grammar: {
                  type: Type.OBJECT,
                  properties: {
                    agentName: { type: Type.STRING },
                    score: { type: Type.INTEGER },
                    feedback: { type: Type.STRING, description: "1-2 paragraphs of critical feedback." },
                    issues: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING, description: "Unique snake_case identifier" },
                          severity: { type: Type.STRING, description: "Must be exactly 'critical', 'warning', or 'info'" },
                          text: { type: Type.STRING, description: "Explanation of issue or opportunity." },
                          suggestion: { type: Type.STRING, description: "Precise recommended replacement or correction text." },
                          originalText: { type: Type.STRING, description: "Optional precise substring inside the original document that triggers this." }
                        },
                        required: ["id", "severity", "text", "suggestion"]
                      }
                    },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 2-3 specific strengths in grammar." },
                    gaps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 2-3 specific gaps in grammar." }
                  },
                  required: ["agentName", "score", "feedback", "issues", "strengths", "gaps"]
                },
                logic: {
                  type: Type.OBJECT,
                  properties: {
                    agentName: { type: Type.STRING },
                    score: { type: Type.INTEGER },
                    feedback: { type: Type.STRING },
                    issues: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          severity: { type: Type.STRING },
                          text: { type: Type.STRING },
                          suggestion: { type: Type.STRING },
                          originalText: { type: Type.STRING }
                        },
                        required: ["id", "severity", "text", "suggestion"]
                      }
                    },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    gaps: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["agentName", "score", "feedback", "issues", "strengths", "gaps"]
                },
                humanization: {
                  type: Type.OBJECT,
                  properties: {
                    agentName: { type: Type.STRING },
                    score: { type: Type.INTEGER },
                    feedback: { type: Type.STRING },
                    issues: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          severity: { type: Type.STRING },
                          text: { type: Type.STRING },
                          suggestion: { type: Type.STRING },
                          originalText: { type: Type.STRING }
                        },
                        required: ["id", "severity", "text", "suggestion"]
                      }
                    },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    gaps: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["agentName", "score", "feedback", "issues", "strengths", "gaps"]
                },
                ai_detection: {
                  type: Type.OBJECT,
                  properties: {
                    agentName: { type: Type.STRING },
                    score: { type: Type.INTEGER },
                    feedback: { type: Type.STRING },
                    issues: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          severity: { type: Type.STRING },
                          text: { type: Type.STRING },
                          suggestion: { type: Type.STRING },
                          originalText: { type: Type.STRING }
                        },
                        required: ["id", "severity", "text", "suggestion"]
                      }
                    },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    gaps: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["agentName", "score", "feedback", "issues", "strengths", "gaps"]
                },
                reviewer: {
                  type: Type.OBJECT,
                  properties: {
                    agentName: { type: Type.STRING },
                    score: { type: Type.INTEGER },
                    feedback: { type: Type.STRING },
                    issues: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          severity: { type: Type.STRING },
                          text: { type: Type.STRING },
                          suggestion: { type: Type.STRING },
                          originalText: { type: Type.STRING }
                        },
                        required: ["id", "severity", "text", "suggestion"]
                      }
                    },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    gaps: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["agentName", "score", "feedback", "issues", "strengths", "gaps"]
                },
                ats: {
                  type: Type.OBJECT,
                  properties: {
                    agentName: { type: Type.STRING },
                    score: { type: Type.INTEGER },
                    feedback: { type: Type.STRING },
                    issues: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          severity: { type: Type.STRING },
                          text: { type: Type.STRING },
                          suggestion: { type: Type.STRING },
                          originalText: { type: Type.STRING }
                        },
                        required: ["id", "severity", "text", "suggestion"]
                      }
                    },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    gaps: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["agentName", "score", "feedback", "issues", "strengths", "gaps"]
                },
                brand: {
                  type: Type.OBJECT,
                  properties: {
                    agentName: { type: Type.STRING },
                    score: { type: Type.INTEGER },
                    feedback: { type: Type.STRING },
                    issues: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          severity: { type: Type.STRING },
                          text: { type: Type.STRING },
                          suggestion: { type: Type.STRING },
                          originalText: { type: Type.STRING }
                        },
                        required: ["id", "severity", "text", "suggestion"]
                      }
                    },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    gaps: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["agentName", "score", "feedback", "issues", "strengths", "gaps"]
                },
                recommendation: {
                  type: Type.OBJECT,
                  properties: {
                    agentName: { type: Type.STRING },
                    score: { type: Type.INTEGER },
                    feedback: { type: Type.STRING },
                    issues: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          severity: { type: Type.STRING },
                          text: { type: Type.STRING },
                          suggestion: { type: Type.STRING },
                          originalText: { type: Type.STRING }
                        },
                        required: ["id", "severity", "text", "suggestion"]
                      }
                    },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    gaps: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["agentName", "score", "feedback", "issues", "strengths", "gaps"]
                }
              },
              required: ["grammar", "logic", "humanization", "ai_detection", "reviewer", "ats", "brand", "recommendation"]
            }
          },
          required: ["overallScore", "grade", "keyStrengths", "keyGaps", "actionPlan", "agentResults"]
        };

        console.log(`[WriteMind AI Orchestrator] Invoking single-pass multi-agent swarm evaluation...`);

        const systemInstruction = `You are the WriteMind AI Swarm Director, an elite language and admissions/career optimization orchestrator. 
Your job is to run a multi-faceted agent review of the user's writing within the target context: "${context || "General Writing"}".

You will simulate 8 specialized analytical research agents and compiled recommendations to output a complete, unified scorecard JSON matching the requested schema.

The 8 analytical agents you must run internally and capture results for are:
1. Grammar Agent (grammar) [Master Editorial Linguist]: Evaluate grammar, mechanical errors, awkward phrasings, run-ons, stylistic formats. Cognitive style is mechanical, pedantic, precise. Identify syntax errors. Name the agent "Grammar Agent".
2. Logic Agent (logic) [Critical Thinking Auditor]: Evaluate logical progression, clear structured thesis alignment, cohesion, and logical flow. Cognitive style is skeptical, structured, forensic. Name the agent "Logic Agent".
3. Humanization Agent (humanization) [Authenticity & Rhythm Evaluator]: Evaluate read-rate speed, sentence length variation (burstiness), clichés, human 'soul' quotient. Cognitive style is empathetic, rhythmic, sensory. Name the agent "Humanization Agent".
4. AI Detection Agent (ai_detection) [Forensic LLM Scanner]: Search for signature corporate/LLM-slop markers (e.g., overused words like 'delve', 'testament', 'tapestry', 'moreover', 'leverage', 'synergy'). Cognitive style is probabilistic, pattern-aware. Name the agent "AI Detection Agent".
5. Reviewer Agent (reviewer) [Executive Impression Simulator]: Act as senior reviewer in the target context. Rate the overall impression, professional maturity, and drive. Cognitive style is high-status, outcome-driven. Name the agent "Reviewer Agent".
6. ATS Agent (ats) [Applicant Tracking Optimizer]: Check active verbs, professional accountability metrics, formatting, and industry-relevant keywords. Cognitive style is parser-focused, database-optimized. Name the agent "ATS Agent".
7. Brand Agent (brand) [Personal Positioning Strategist]: Check Unique Selling Proposition (USP), value-first positioning, authority signaling, and emotional impact. Cognitive style is marketing-first, prestige-seeking. Name the agent "Brand Agent".
8. Recommendation Agent (recommendation) [Master Pipeline Synthesizer]: Synthesize the overall weighted index and step-by-step revision tracks. Cognitive style is pragmatic, action-focused, instructional. Name the agent "Recommendation Agent".

Then, synthesize these findings to generate overall composite metrics:
- overallScore: Realistically tough composite score (0-100). Do not hand out A+ or 95+ unless writing is flawless.
- grade: Letter grade matching overallScore (A+, A, A-, B+, B, B-, C+, C, D, etc.).
- keyStrengths: List the top 3 overall strengths.
- keyGaps: List the top 3 critical gaps.
- actionPlan: List 3-4 prioritized step-by-step instructions (Action Plan) for rebuilding or finishing the draft.

For each of the 8 analytical agents, you must provide:
- agentName: String containing the name of the agent (e.g. "Recommendation Agent").
- score: Rating (0-100).
- feedback: 1-2 paragraphs of sharp critical advice.
- issues: An array of micro-issues with structural, grammatical, or AI-slop problems. If the issue is associated with a specific segment of the original input text, you MUST set "originalText" to the EXACT mechanical text segment so the user can trigger an automatic swap, and provide the exact "suggestion".
- strengths: Array of 2-3 specific strengths.
- gaps: Array of 2-3 specific gaps or improvement vectors.

You MUST output strictly formatted JSON matching the provided schema. Ensure you generate comprehensive outputs for all 8 agents.`;

        // Run multi-agent pipeline with robust retry
        const response = await generateWithRetry(async () => {
          return await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: [
              { text: `Target Context: ${context || "General Writing"}\n\nDocument to Evaluate:\n"""\n${text}\n"""` }
            ],
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema: masterScorecardSchema,
              temperature: 0.2
            }
          });
        });

        const rawText = response.text || "{}";
        const parsedSynthesis = JSON.parse(rawText.trim());

        scorecard = {
          id: "scorecard_" + Date.now(),
          title: title || "New Writing Review",
          text,
          context: context || "General Writing",
          timestamp: Date.now(),
          overallScore: parsedSynthesis.overallScore ?? 80,
          grade: parsedSynthesis.grade ?? "B",
          agentResults: parsedSynthesis.agentResults ?? {},
          keyStrengths: parsedSynthesis.keyStrengths ?? [],
          keyGaps: parsedSynthesis.keyGaps ?? [],
          actionPlan: parsedSynthesis.actionPlan ?? []
        };
      } catch (geminiError: any) {
        console.warn("[WriteMind AI Orchestrator Error] Gemini execution failed, deploying local audit engine fallback:", geminiError);
        const errMsg = geminiError?.message || String(geminiError);
        const isQuota = errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("Quota") || errMsg.includes("Rate limit") || errMsg.includes("RESOURCE_EXHAUSTED");
        scorecard = generateServerLocalEvaluation(text, context, title);
        scorecard.fallbackReason = isQuota ? "quota_exceeded" : "unavailable";
      }

      res.json(scorecard);
    } catch (error: any) {
      console.error("[WriteMind AI Evaluator Hard Error]:", error);
      const scorecard = generateServerLocalEvaluation(text, context, title);
      scorecard.fallbackReason = "unavailable";
      res.json(scorecard);
    }
  });

  // Action rewrite endpoint
  app.post("/api/improve", async (req, res) => {
    const { text, context, instruction, agentId } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No text provided for improvements." });
    }

    try {
      let revisedText;
      try {
        const ai = getGeminiClient();

        const response = await generateWithRetry(async () => {
          return await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: [
              {
                text: `Document to Rewrite:\n"""\n${text}\n"""\n\nTarget Context:\n"${context || "General"}"\n\nSpecific Action Instruction:\n"${instruction || "Improve clarity and style"}"\n\nFocused Agent Sector: ${agentId || "general"}`
              }
            ],
            config: {
              systemInstruction: `You are an elite AI Writing Coach of WriteMind AI. Perform a precise rewrite of the document. Keep the core personal content intact (do not invent fake facts or new stories unless necessary), but significantly level up the style, critical thinking depth, logical transitions, human rhythm, and branding alignment based on the instruction. Output the revised text clearly. Do not wrap in Markdown annotations other than optional formatting if fitting. Simply return the prose.`,
              temperature: 0.4
            }
          });
        });

        revisedText = response.text;
      } catch (geminiRewriteError) {
        console.warn("[WriteMind AI Improve Error] Gemini failed, applying high-fidelity search-and-replace local rewrite:", geminiRewriteError);
        revisedText = localImproveText(text, instruction);
      }

      res.json({ revisedText });
    } catch (error) {
      console.error("[Improvement Hard Error]:", error);
      res.json({ revisedText: localImproveText(text, instruction) });
    }
  });

  // Serve static assets in production
  if (process.env.NODE_ENV === "production" || process.env.DISABLE_HMR === "true") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    // Vite middleware for lightning-fast development feedback
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[WriteMind AI Engine] Running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical server startup crash:", err);
});
