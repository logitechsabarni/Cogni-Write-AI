/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Languages, 
  BrainCircuit, 
  UserRound, 
  Fingerprint, 
  Building2, 
  ScrollText, 
  Sparkles, 
  Award, 
  HelpCircle,
  FileCheck2
} from "lucide-react";

interface AgentProfile {
  id: string;
  name: string;
  role: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  focus: string[];
  cognitiveStyle: string;
  criteria: string;
}

const AGENT_PROFILES: AgentProfile[] = [
  {
    id: "grammar",
    name: "Grammar Agent",
    role: "Master Editorial Linguist",
    icon: Languages,
    color: "from-blue-500 to-cyan-500 text-blue-400 border-blue-500/20",
    cognitiveStyle: "Mechanical, pedantic, precise, and standard-seeking.",
    criteria: "Syntactic correctness, run-ons, structural balance, proper punctuation, flow alignment.",
    focus: ["Mechanical syntax errors", "Awkward/archaic phrasings", "Active vs passive balance", "Verb-subject concordance"]
  },
  {
    id: "logic",
    name: "Logic Agent",
    role: "Critical Thinking Auditor",
    icon: BrainCircuit,
    color: "from-purple-500 to-indigo-500 text-purple-400 border-purple-500/20",
    cognitiveStyle: "Skeptical, structured, forensic, and argumentative.",
    criteria: "Logical consistency, premise support, cohesion between paragraphs, transition strength, structural fallacies.",
    focus: ["Circular arguments", "Unsubstantiated claims", "Paragraph transition flow", "Thesis-to-evidence tightness"]
  },
  {
    id: "humanization",
    name: "Humanization Agent",
    role: "Authenticity & Rhythm Evaluator",
    icon: UserRound,
    color: "from-emerald-500 to-teal-500 text-emerald-400 border-emerald-500/20",
    cognitiveStyle: "Empathetic, rhythmic, sensory, and vocabulary-rich.",
    criteria: "Fluency pace, cliches, sentence length distribution (burstiness), vocabulary freshness, human 'soul' quotient.",
    focus: ["Monotonous text rhythms", "Stiff corporate jargon", "Overused cliches", "Organic connection intensity"]
  },
  {
    id: "ai_detection",
    name: "AI Detection Agent",
    role: "Forensic LLM Scanner",
    icon: Fingerprint,
    color: "from-rose-500 to-red-500 text-rose-400 border-rose-500/20",
    cognitiveStyle: "Probabilistic, pattern-aware, and word-frequency-obsessed.",
    criteria: "GPT signature identifiers, sentence construction repetition, burstiness variance.",
    focus: ["LLM-slop words ('delve', 'tapestry')", "Uniform robotic sentence lengths", "Predictable transitional phrases", "Predictability score index"]
  },
  {
    id: "reviewer",
    name: "Reviewer Agent",
    role: "Executive Impression Simulator",
    icon: Building2,
    color: "from-amber-500 to-orange-500 text-amber-400 border-amber-500/20",
    cognitiveStyle: "High-status, outcome-driven, critical, and discerning.",
    criteria: "Professional maturity, respectfulness, alignment with target elite context (e.g., VC pitch, Ivy League SOP).",
    focus: ["Tone-of-voice suitability", "Value-to-humility ratio", "Admissions/funding thresholds", "Executive polish"]
  },
  {
    id: "ats",
    name: "ATS Agent",
    role: "Applicant Tracking Optimizer",
    icon: ScrollText,
    color: "from-sky-500 to-indigo-500 text-sky-400 border-sky-500/20",
    cognitiveStyle: "Parser-focused, database-optimized, keyword-driven.",
    criteria: "Role alignment, context word-cloud frequency, action verb strength, and readability of metrics.",
    focus: ["Passive verb identification", "Industry core keyword count", "Outcome quantifiable metrics", "Formatting readability blocks"]
  },
  {
    id: "brand",
    name: "Brand Agent",
    role: "Personal Positioning Strategist",
    icon: Sparkles,
    color: "from-violet-500 to-fuchsia-500 text-violet-400 border-violet-500/20",
    cognitiveStyle: "Marketing-first, differentiation-obsessed, prestige-seeking.",
    criteria: "Unique Selling Proposition (USP) representation, authority metrics, brand-voice focus, and emotional impact.",
    focus: ["Commodity sounding paragraphs", "Differentiator clarity", "Authority signaling", "Memorable takeaways"]
  },
  {
    id: "recommendation",
    name: "Recommendation Agent",
    role: "Master Pipeline Synthesizer",
    icon: Award,
    color: "from-yellow-500 to-amber-600 text-yellow-400 border-yellow-500/20",
    cognitiveStyle: "Pragmatic, action-focused, instructional, and cohesive.",
    criteria: "Weighted index blending, letter grade calibrations, strategic step-by-step sequential action planning.",
    focus: ["Comprehensive score carding", "Overarching strengths/gaps", "Step-by-step revision tracks", "Prioritized rewrite orders"]
  }
];

export default function AgentControlPanel() {
  return (
    <div className="space-y-6" id="agent_control_panel">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-850 mb-2 font-sans">
          Agent Core Intelligence
        </h2>
        <p className="text-slate-500 text-sm max-w-3xl">
          WriteMind AI coordinates an 8-agent swarm to analyze documents. Each agent performs a dedicated linguistic audit based on distinct professional perspectives and criteria.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {AGENT_PROFILES.map((agent) => {
          const IconComponent = agent.icon;
          return (
            <div 
              key={agent.id}
              className="bg-white border border-slate-200/80 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-50/50 transition-all shadow-sm group h-full flex flex-col justify-between"
              id={`agent_card_${agent.id}`}
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <IconComponent className="w-5 h-5 text-current" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm tracking-tight group-hover:text-indigo-650 transition-colors">
                      {agent.name}
                    </h3>
                    <p className="text-xs text-slate-450 font-mono">
                      {agent.role}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <div>
                    <span className="text-[10px] text-indigo-600 font-bold tracking-wider uppercase block">
                      Cognitive Style
                    </span>
                    <p className="text-xs text-slate-600">
                      {agent.cognitiveStyle}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-indigo-600 font-bold tracking-wider uppercase block">
                      Primary Criteria
                    </span>
                    <p className="text-xs text-slate-650">
                      {agent.criteria}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3">
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block mb-1">
                  Target Vectors
                </span>
                <div className="flex flex-wrap gap-1">
                  {agent.focus.map((f, i) => (
                    <span 
                      key={i}
                      className="text-[10px] bg-slate-50 text-slate-550 border border-slate-200 px-2 py-0.5 rounded-full font-medium"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200/80 rounded-xl p-5 flex items-start space-x-4 shadow-sm">
        <div className="p-2 bg-indigo-50 border border-indigo-150 text-indigo-650 rounded-lg mt-0.5">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-slate-800">
            How the Swarm Orchestrates
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
            When you press <strong className="text-indigo-650 font-semibold">"Review"</strong>, WriteMind AI initiates an asynchronous split-then-synthesize routine. Agents 1-7 inspect the source material simultaneously. Their multi-faceted audit reports are fed into Agent 8, which compiles the composite metrics, provides a unified letter grade, and arranges a prioritized step-by-step repair schedule (the Action Plan).
          </p>
        </div>
      </div>
    </div>
  );
}
