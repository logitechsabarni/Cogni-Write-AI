/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Copy, Check, Terminal, Database, CloudLightning, Layers, Code, Play } from "lucide-react";

export default function MentorNotes() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"architecture" | "fastapi" | "database" | "deployment" | "scale">("architecture");

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const codeFastAPI = `from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import google.generativeai as genai
import asyncio
import os

app = FastAPI(
    title="WriteMind AI Core Engin",
    description="Multi-agent writing intelligence audit platform",
    version="1.0.0"
)

# Configuration Setup
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

class EvaluationRequest(BaseModel):
    text: str = Field(..., min_length=15, description="The draft text to audit")
    context: str = Field("General", description="The professional context of the drafting process")
    title: Optional[str] = Field("Untitled Draft", description="A title tag for tracking")

# Analytical Agent Schema model
class AgentIssue(BaseModel):
    id: str
    severity: str # critical, warning, info
    text: str
    suggestion: str
    originalText: Optional[str] = None

class AgentResult(BaseModel):
    agent_name: str
    score: int
    feedback: str
    issues: List[AgentIssue]
    strengths: List[str]
    gaps: List[str]

class SynthesisResult(BaseModel):
    overallScore: int
    grade: str
    keyStrengths: List[str]
    keyGaps: List[str]
    actionPlan: List[str]

# Concurrently invoke a single analytical agent
async def invoke_agent(agent_id: str, agent_name: str, instruction: str, text: str, context: str) -> AgentResult:
    # Set up Gemini 3.5 Flash modeling configurations
    model = genai.GenerativeModel(
        model_name="gemini-3.5-flash",
        generation_config={
            "response_mime_type": "application/json",
            "response_schema": AgentResult,
            "temperature": 0.2
        },
        system_instruction=f"{instruction} Context scope: '{context}'. Must evaluate text objectively."
    )
    
    prompt = f"Evaluate the following document within context '{context}':\\n\\n{text}"
    
    # Run the model call via a threadpool since generativeai SDK is synchronous
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(None, lambda: model.generate_content(prompt))
    
    # Parse output schemas
    return AgentResult.model_validate_json(response.text)

@app.post("/api/evaluate", response_model=Dict)
async def evaluate_document(payload: EvaluationRequest):
    text = payload.text
    context = payload.context

    # Concurrently execute all 7 analytical agents
    agents = [
        {"id": "grammar", "name": "Grammar Agent", "inst": "Evaluate grammatical mechanical balance, punctuation style, run-ons, and correct syntactic phrasings."},
        {"id": "logic", "name": "Logic Agent", "inst": "Evaluate development consistency, premise support, logical fallacies, transition strength."},
        {"id": "human", "name": "Humanization Agent", "inst": "Evaluate rhythm pacing, sentence burstiness, overuse of technical cliché and dry terms."},
        {"id": "ai", "name": "AI Detector Agent", "inst": "Detect corporate and LLM-signature slop structures (delve, tapestry, testament)."},
        {"id": "reviewer", "name": "Reviewer Agent", "inst": "Simulate partner level criticism and feedback based on professional maturity and tone."},
        {"id": "ats", "name": "ATS Agent", "inst": "Review formatting, quantifiable impact metrics, passive verb identification, keyword levels."},
        {"id": "brand", "name": "Brand Agent", "inst": "Assess personal differentiation, value signaling, USP intensity, memorable takeaways."}
    ]

    try:
        # Run 1-7 in parallel
        tasks = [invoke_agent(a["id"], a["name"], a["inst"], text, context) for a in agents]
        agent_reports = await asyncio.gather(*tasks)

        reports_dict = {agents[i]["id"]: report.model_dump() for i, report in enumerate(agent_reports)}

        # Execute Synthesis Engine (Agent 8)
        synthesis_model = genai.GenerativeModel(
            model_name="gemini-3.5-flash",
            generation_config={
                "response_mime_type": "application/json",
                "response_schema": SynthesisResult,
                "temperature": 0.3
            },
            system_instruction="You are the synthesis agent. Review analytical reports of 7 agents and generate overall metrics and action plans."
        )

        synthesis_prompt = f"Draft Text: {text}\\n\\nAgent Reports: {reports_dict}"
        loop = asyncio.get_event_loop()
        synth_response = await loop.run_in_executor(None, lambda: synthesis_model.generate_content(synthesis_prompt))
        synthesis = SynthesisResult.model_validate_json(synth_response.text)

        return {
            "title": payload.title,
            "context": context,
            "overallScore": synthesis.overallScore,
            "grade": synthesis.grade,
            "agentResults": reports_dict,
            "keyStrengths": synthesis.keyStrengths,
            "keyGaps": synthesis.keyGaps,
            "actionPlan": synthesis.actionPlan
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))`;

  const codeGraphQLSchema = `// Drizzle ORM Schema definition for PostgreSQL
import { pgTable, text, timestamp, integer, jsonb, uuid } from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  displayName: text('display_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const draftsTable = pgTable('drafts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => usersTable.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  text: text('text').notNull(),
  context: text('context').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const scorecardsTable = pgTable('scorecards', {
  id: uuid('id').defaultRandom().primaryKey(),
  draftId: uuid('draft_id').references(() => draftsTable.id, { onDelete: 'set null' }),
  userId: uuid('user_id').references(() => usersTable.id, { onDelete: 'cascade' }),
  context: text('context').notNull(),
  overallScore: integer('overall_score').notNull(),
  grade: text('grade').notNull(),
  metaGaps: jsonb('meta_gaps').notNull(), // string array
  metaStrengths: jsonb('meta_strengths').notNull(), // string array
  actionPlan: jsonb('action_plan').notNull(), // step instructions list
  agentResults: jsonb('agent_results').notNull(), // Record<agent_id, AgentResult>
  createdAt: timestamp('created_at').defaultNow().notNull(),
});`;

  const codeDeployment = `# ================================================
# VERCEL DEPLOYMENT CONFIG (Frontend SPA Static)
# ================================================
# File: vercel.json (placed in root of React repo)
{
  "version": 2,
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://writemind-backend.onrender.com/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}

# ================================================
# RENDER DEPLOYMENT CONFIG (FastAPI Production Server-side)
# ================================================
# File: render.yaml
services:
  - type: web
    name: writemind-backend
    env: python
    buildCommand: "pip install -r requirements.txt"
    startCommand: "gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:$PORT"
    envVars:
      - key: GEMINI_API_KEY
        sync: false
      - key: DATABASE_URL
        sync: false`;

  const codeCelery = `# For highly active production environments, sequential pipeline latency 
# can be offset completely by switching to a decoupled task-queue design.

# celery_app.py
from celery import Celery
import os

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
celery = Celery("tasks", broker=redis_url, backend=redis_url)

@celery.task(name="tasks.orchestrate_eval")
def task_orchestrate_eval(document_id: str):
    # Retrieve draft from DB
    draft = db.get_draft(document_id)
    
    # 1. Trigger concurrent celery signature chords (the 7 analytical agents)
    # 2. Collect chords outputs in Redis cache once done
    # 3. Synchronize inputs into Synthesis Agent task
    # 4. Save results to RDS PostgreSQL
    # 5. Push real-time WS alert notifies client dashboard!
    pass`;

  return (
    <div className="space-y-6" id="mentor_notes">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 mb-2 font-sans flex items-center gap-2">
          <Terminal className="w-6 h-6 text-indigo-600" />
          Technical Runway & Mentor Hub
        </h2>
        <p className="text-slate-500 text-sm max-w-3xl">
          Review production layouts, database tables, Vercel/Render configurations, and scalability strategies. Designed to provide hackathon participants with a fully documented roadmap.
        </p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200/80 space-x-1.5 overflow-x-auto pb-px">
        {[
          { id: "architecture", label: "App Architecture", icon: Layers },
          { id: "fastapi", label: "FastAPI Backend", icon: Code },
          { id: "database", label: "Database Schema", icon: Database },
          { id: "deployment", label: "Deployment Rules", icon: CloudLightning },
          { id: "scale", label: "Scale & Workers", icon: Play }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`hover:text-slate-800 px-4 py-2.5 text-xs font-bold tracking-tight border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                  : "border-transparent text-slate-450 hover:border-slate-300 hover:text-slate-850"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active Tab View */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
        
        {activeTab === "architecture" && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-800 tracking-tight">WriteMind AI Swarm Architecture</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                The platform utilizes a structured **Split-Evaluate-Synthesize** pattern to ensure deep reviews while maintaining sub-second user responses.
              </p>
            </div>

            <div className="border border-slate-205 bg-slate-50 p-4 rounded-lg space-y-4">
              <span className="text-[10px] text-indigo-600 font-bold tracking-wider uppercase block">PIPELINE GRAPH:</span>
              <div className="space-y-3 font-mono text-xs text-slate-655">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="bg-slate-150 px-3 py-1 rounded text-slate-800 font-bold border border-slate-250 text-[11px]">Client Document Input</span>
                  <span className="hidden sm:inline">➜</span>
                  <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded border border-indigo-200 text-[11px] font-bold">Express/FastAPI Gateway</span>
                </div>
                <div className="h-6 w-0.5 bg-slate-305 ml-12"></div>
                <div className="pl-6 border-l border-slate-300 space-y-2">
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                    <span className="text-indigo-600 font-bold">⚡ CONCURRENT AUDITING (Promise.all Parallel Swarm):</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="bg-white p-2 rounded border border-slate-200 text-[10px] font-semibold text-slate-700 shadow-xs">1. Grammar Agent (Flash)</div>
                    <div className="bg-white p-2 rounded border border-slate-200 text-[10px] font-semibold text-slate-700 shadow-xs">2. Logic Agent (Flash)</div>
                    <div className="bg-white p-2 rounded border border-slate-200 text-[10px] font-semibold text-slate-700 shadow-xs">3. Human Agent (Flash)</div>
                    <div className="bg-white p-2 rounded border border-slate-200 text-[10px] font-semibold text-slate-700 shadow-xs">4. Forensic Agent (Flash)</div>
                    <div className="bg-white p-2 rounded border border-slate-200 text-[10px] font-semibold text-slate-700 shadow-xs">5. ATS Scanner (Flash)</div>
                    <div className="bg-white p-2 rounded border border-slate-200 text-[10px] font-semibold text-slate-700 shadow-xs">6. Partner Critic (Flash)</div>
                    <div className="bg-white p-2 rounded border border-slate-200 text-[10px] font-semibold text-slate-700 shadow-xs">7. Brand Agent (Flash)</div>
                  </div>
                </div>
                <div className="h-6 w-0.5 bg-slate-305 ml-12"></div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="bg-slate-150 px-3 py-1 rounded text-slate-800 border border-slate-250 text-[11px] font-semibold">Analytical Reports (Collected)</span>
                  <span className="hidden sm:inline">➜</span>
                  <span className="bg-amber-50 text-amber-800 px-3 py-1 rounded border border-amber-200 text-[11px] font-bold">8. Synthesis Agent (Consolidator)</span>
                </div>
                <div className="h-6 w-0.5 bg-slate-305 ml-12"></div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-indigo-700 font-bold">
                  <span className="bg-emerald-50 text-emerald-800 px-3 py-1 rounded border border-emerald-200 text-[11px] font-bold">Comprehensive Scorecard</span>
                  <span className="hidden sm:inline">➜</span>
                  <span className="text-slate-655 font-normal text-[11px]">Push to UI & Save in Relational DB</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-800">Why Gemini 3.5 Flash matters:</span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The low latency profile of `gemini-3.5-flash` allows concurrent audits to complete in under 2 seconds, which avoids the classic HTTP connection timeouts commonly seen when coordinating multiple sequential agents.
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-800">Structured Schema Enforcement:</span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  By supplying a native `response_schema` directly to the Gemini API, we eliminate raw output parsing bugs and guarantee that all agent reports contain perfect structure, types, and scores before compiling.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "fastapi" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight">Production FastAPI Backend Controller</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Complete Python implementation matching the Node.js orchestration pipeline.
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(codeFastAPI, "fastapi")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium transition self-start"
              >
                {copiedKey === "fastapi" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Code
              </button>
            </div>
            
            <div className="bg-slate-900 border border-slate-200 rounded-lg p-4 font-mono text-xs overflow-x-auto max-h-[380px] text-slate-200 shadow-inner">
              <pre>{codeFastAPI}</pre>
            </div>
          </div>
        )}

        {activeTab === "database" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight">Drizzle ORM Relational Schemas</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Models structured, relational audit historical tracking in PostgreSQL.
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(codeGraphQLSchema, "database")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium transition self-start"
              >
                {copiedKey === "database" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Code
              </button>
            </div>
            
            <div className="bg-slate-900 border border-slate-200 rounded-lg p-4 font-mono text-xs overflow-x-auto max-h-[380px] text-slate-200 shadow-inner">
              <pre>{codeGraphQLSchema}</pre>
            </div>
          </div>
        )}

        {activeTab === "deployment" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight">Vercel & Render Multi-Service Blueprint</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Separate static client hosting from backend services to optimize speed and secure secrets.
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(codeDeployment, "deploy")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium transition self-start"
              >
                {copiedKey === "deploy" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Code
              </button>
            </div>
            
            <div className="bg-slate-900 border border-slate-200 rounded-lg p-4 font-mono text-xs overflow-x-auto max-h-[380px] text-slate-200 shadow-inner">
              <pre>{codeDeployment}</pre>
            </div>
          </div>
        )}

        {activeTab === "scale" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight">Decoupled Celery Worker Scale Strategy</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Employ asynchronous workers with Celery & Redis to handles heavy, high-volume workloads cleanly.
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(codeCelery, "celery")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium transition self-start"
              >
                {copiedKey === "celery" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Code
              </button>
            </div>
            
            <div className="bg-slate-900 border border-slate-200 rounded-lg p-4 font-mono text-xs overflow-x-auto text-slate-200 shadow-inner">
              <pre>{codeCelery}</pre>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
