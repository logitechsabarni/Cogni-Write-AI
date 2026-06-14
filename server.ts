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
              }
            },
            required: ["grammar", "logic", "humanization", "ai_detection", "reviewer", "ats", "brand"]
          }
        },
        required: ["overallScore", "grade", "keyStrengths", "keyGaps", "actionPlan", "agentResults"]
      };

      console.log(`[WriteMind AI Orchestrator] Invoking single-pass multi-agent swarm evaluation...`);

      const systemInstruction = `You are the WriteMind AI Swarm Director, an elite language and admissions/career optimization orchestrator. 
Your job is to run a multi-faceted agent review of the user's writing within the target context: "${context || "General Writing"}".

You will simulate 7 specialized analytical research agents and compiled recommendations to output a complete, unified scorecard JSON matching the requested schema.

The 7 analytical agents you must run internally and capture results for are:
1. Grammar Agent (grammar): Evaluate grammar, mechanical errors, awkward phrasings, run-ons, stylistic formats. Extract specific issues. Name the agent "Grammar Agent".
2. Logic Agent (logic): Evaluate logical progression, clear structured thesis alignment, and logical flow. Name the agent "Logic Agent".
3. Humanization Agent (humanization): Evaluate read-rate speed, sentence length variation (burstiness), clichés. Identify artificial-sounding zones. Name the agent "Humanization Agent".
4. AI Detection Agent (ai_detection): Search for signature corporate/LLM-slop markers (e.g., overused words like 'delve', 'testament', 'tapestry', 'moreover', 'leverage', 'synergy'). Name the agent "AI Detection Agent".
5. Reviewer Agent (reviewer): Act as senior reviewer in the target context. Rate the overall impression, professional maturity, and drive. Name the agent "Reviewer Agent".
6. ATS Agent (ats): Check active verbs, professional accountability metrics, and industry-relevant keywords. Name the agent "ATS Agent".
7. Brand Agent (brand): Check Unique Selling Proposition (USP), value-first positioning, and authority. Name the agent "Brand Agent".

Then, synthesize these findings to generate overall composite metrics:
- overallScore: Realistically tough composite score (0-100). Do not hand out A+ or 95+ unless writing is flawless.
- grade: Letter grade matching overallScore (A+, A, A-, B+, B, B-, C+, C, D, etc.).
- keyStrengths: List the top 3 overall strengths.
- keyGaps: List the top 3 critical gaps.
- actionPlan: List 3-4 prioritized step-by-step instructions (Action Plan) for rebuilding or finishing the draft.

For each of the 7 analytical agents, you must provide:
- agentName: String containing the name of the agent (e.g. "AI Detection Agent").
- score: Rating (0-100).
- feedback: 1-2 paragraphs of sharp critical advice.
- issues: An array of micro-issues with structural, grammatical, or AI-slop problems. If the issue is associated with a specific segment of the original input text, you MUST set "originalText" to the EXACT mechanical text segment so the user can trigger an automatic swap, and provide the exact "suggestion".
- strengths: Array of 2-3 specific strengths.
- gaps: Array of 2-3 specific gaps or improvement vectors.

You MUST output strictly formatted JSON matching the provided schema. Ensure you generate comprehensive outputs for all 7 agents.`;

      const response = await ai.models.generateContent({
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

      const rawText = response.text || "{}";
      const parsedSynthesis = JSON.parse(rawText.trim());

      const scorecard = {
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

      res.json(scorecard);
    } catch (error) {
      console.error("[WriteMind AI Error]:", error);
      res.status(500).json({
        error: "Multi-agent orchestration pipeline failed.",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Action rewrite endpoint
  app.post("/api/improve", async (req, res) => {
    const { text, context, instruction, agentId } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No text provided for improvements." });
    }

    try {
      const ai = getGeminiClient();

      const response = await ai.models.generateContent({
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

      res.json({ revisedText: response.text });
    } catch (error) {
      console.error("[Improvement Error]:", error);
      res.status(500).json({ error: "Failed to apply writing enhancements." });
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
