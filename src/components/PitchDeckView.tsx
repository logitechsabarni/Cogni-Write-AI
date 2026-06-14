/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { ChevronLeft, ChevronRight, Presentation, Award, ShieldAlert, Sparkles, Network } from "lucide-react";
import { motion } from "motion/react";

interface Slide {
  slideNumber: number;
  category: string;
  title: string;
  subtitle: string;
  bullets: string[];
  visualType: 'problem' | 'solution' | 'swarm' | 'differentiator' | 'market' | 'runway';
  diagramText?: string;
  badgeText?: string;
}

const PITCH_SLIDES: Slide[] = [
  {
    slideNumber: 1,
    category: "The Problem",
    title: "Grammar Checking is a Solved Problem. Writing Polish is NOT.",
    subtitle: "In the age of LLM commoditization, professional communication is facing deep sub-problems:",
    bullets: [
      "Grammarly blindspot: Clean syntax does not guarantee robust critical thinking or logical transitions.",
      "The 'AI Slop' Epidemic: Generic corporate templates, overusing words like 'delve', 'testament', or 'tapestry' immediately signal automation and alienate human readers.",
      "ATS Keyword Stuffed Deception: Keyword tracking scores cheat the filter but present mechanical, passive narratives that human managers instantly reject.",
      "Extreme Coaching Costs: Private statement of purpose (SOP) or advisory coaches cost upwards of $300/hour, which is inaccessible to most candidates."
    ],
    visualType: "problem",
    badgeText: "STAGNANT STATUS QUO"
  },
  {
    slideNumber: 2,
    category: "The Solution",
    title: "WriteMind AI: Platform for Writing Intelligence",
    subtitle: "We've built an autonomous AI platform that doesn't just fix verbs; it checks for critical reasoning, style freshness, and review preparedness:",
    bullets: [
      "Swarm Audit Execution: Runs a coordinated team of 8 specialized agents designed around the exact traits of Ivy League editors and veteran executive committees.",
      "Comprehensive Critique Scorecard: Delivers quantitative analysis cross-analyzed through logic, brand positioning, humanization, and target reviewer perspectives.",
      "Instant Micro-Corrections: Pinpoints exact phrases, run-ons, and clichés with direct contextual re-writes.",
      "Interactive Context Integration: Customizes its cognitive model based on whether the document is a Venture Pitch, an Ivy League SOP, or a Critical Email to a CEO."
    ],
    visualType: "solution",
    badgeText: "THE COGNITIVE UPGRADE"
  },
  {
    slideNumber: 3,
    category: "Architecture",
    title: "Under the Hood: Multi-Agent Pipeline",
    subtitle: "A dual-stage parallel execution structure powered by Gemini 3.5 models:",
    bullets: [
      "Parallel Analysis Phase: Input is split and concurrently dispatched to 7 specialized agents (Grammar, Logic, Humanization, AI Fingerprinting, Resume ATS, Executive Reviewer, Brand Identity).",
      "Asynchronous Orchestration: Keeps end-to-end response times under 4 seconds while running thousands of prompt rules.",
      "Synthesis Phase: The 8th Master Recommendation Agent ingests raw reports to compile the master score, overall letter grade, major gaps, and the action rewrite schedule."
    ],
    visualType: "swarm",
    badgeText: "SYSTEM CONCURRENCY"
  },
  {
    slideNumber: 4,
    category: "Unique Differentiators",
    title: "Three Crucial Moats Over Standard Editors",
    subtitle: "What makes WriteMind AI superior to classic GPT wrappers or simple grammar checkers:",
    bullets: [
      "Cognitive Fallacy Screening: Evaluates transition logic to identify circular arguments, unproven assertions, or weak thesis development.",
      "AI Forensics & Anti-Slop Filter: De-automates writing by looking for signature LLM patterns, sentence length monotony, and predictable rhythmic patterns.",
      "Adversarial Reviewer Simulator: Simulates a highly critical Admissions Director or Executive Partner, preparing writers to pass the highest human friction."
    ],
    visualType: "differentiator",
    badgeText: "OUR MOAT"
  },
  {
    slideNumber: 5,
    category: "Market & Vision",
    title: "Market Capture & Future Product Roadmap",
    subtitle: "Expanding from an intuitive interactive utility to an omnipresent enterprise system:",
    bullets: [
      "High Ticket TAM: Targets 20M annual academic applicants, 150M corporate professionals, and 500K job-seekers.",
      "B2C Premium Tier: Subscription for deeper simulated modules (e.g., specific VC profiles, custom firm-tuned ATS engines, personalized brand guides).",
      "Enterprise Platform Integration: Browser SDK, Google Workspace Add-ons, Microsoft Outlook/Word plug-ins, and secure SSO team instances."
    ],
    visualType: "market",
    badgeText: "SCALABILITY & RUNWAY"
  }
];

export default function PitchDeckView() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const slide = PITCH_SLIDES[currentIdx];

  const handleNext = () => {
    if (currentIdx < PITCH_SLIDES.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };
  return (
    <div className="space-y-6" id="pitch_deck_view">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between justify-start gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <Presentation className="w-6 h-6 text-indigo-600" />
            Hackathon Mentor Package: Pitch Deck
          </h2>
          <p className="text-slate-500 text-sm">
            Interactive pitch deck outline ready for the Microsoft Build AI Hackathon. Toggle through the slides to inspect slides, visual structures, and positioning.
          </p>
        </div>

        {/* Slide selectors */}
        <div className="flex items-center space-x-2 bg-white border border-slate-200 p-1.5 rounded-lg self-start shadow-sm">
          <button 
            onClick={handlePrev} 
            disabled={currentIdx === 0}
            className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:hover:text-slate-400 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs text-slate-600 font-mono px-3">
            Slide {currentIdx + 1} of {PITCH_SLIDES.length}
          </span>
          <button 
            onClick={handleNext} 
            disabled={currentIdx === PITCH_SLIDES.length - 1}
            className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:hover:text-slate-400 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Interactive Deck Canvas */}
      <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-lg relative min-h-[480px] flex flex-col justify-between" id="slide_content_wrapper">
        
        {/* Top bar of mock slide */}
        <div className="border-b border-slate-200/60 px-6 py-4 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs text-slate-400 font-mono pl-2">
              BUILD_AI_HACKATHON_ENTRY.pdf
            </span>
          </div>
          <span className="text-[10px] bg-indigo-50 border border-indigo-150 text-indigo-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            {slide.category}
          </span>
        </div>

        {/* Slide Inner Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 lg:p-8 flex-grow">
          
          {/* Bullet Points */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase block">
                {slide.badgeText}
              </span>
              <h3 className="text-xl lg:text-2xl font-extrabold tracking-tight text-slate-850 leading-snug">
                {slide.title}
              </h3>
              <p className="text-sm text-slate-550 italic">
                {slide.subtitle}
              </p>
            </div>

            <ul className="space-y-3">
              {slide.bullets.map((bullet, i) => (
                <li key={i} className="flex items-start space-x-2.5 text-xs lg:text-sm text-slate-600">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 mt-2 flex-shrink-0" />
                  <span className="leading-relaxed">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Visual Simulation Sidebar */}
          <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-center items-center min-h-[250px] space-y-4 relative overflow-hidden">
            
            {slide.visualType === "problem" && (
              <div className="space-y-4 w-full">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                  <span>Grammar Scanners</span>
                  <span className="text-rose-600 font-bold">Blind to fallacies</span>
                </div>
                <div className="h-4 bg-slate-200/60 border border-slate-200 rounded overflow-hidden">
                  <div className="h-full w-[100%] bg-rose-500/25 flex items-center px-2 text-[10px] text-rose-800 font-bold">
                    ONLY DETECTS COMMAS & VERBS
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-slate-500 pt-2">
                  <span>Standard GPT-4 Wrapper</span>
                  <span className="text-amber-700 font-bold">AI slop markers</span>
                </div>
                <div className="h-4 bg-slate-200/60 border border-slate-200 rounded overflow-hidden">
                  <div className="h-full w-[90%] bg-amber-500/25 flex items-center px-2 text-[10px] text-amber-800 font-bold">
                    LACKS ADVERSARIAL REVIEW CONTOURS
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-slate-500 pt-2">
                  <span>WriteMind AI Swarm</span>
                  <span className="text-emerald-700 font-bold">Perfect Compliance</span>
                </div>
                <div className="h-4 bg-slate-200/60 border border-slate-150 rounded overflow-hidden">
                  <div className="h-full w-[95%] bg-emerald-500/35 flex items-center px-2 text-[10px] text-emerald-800 font-bold animate-pulse">
                    COGNITIVE LOGIC + ATS + BRAND INTEGRITY
                  </div>
                </div>
              </div>
            )}

            {slide.visualType === "solution" && (
              <div className="flex flex-col items-center text-center space-y-3 w-full">
                <div className="p-3 bg-indigo-50 border border-indigo-150 text-indigo-750 rounded-full shadow-xs">
                  <Sparkles className="w-10 h-10 animate-spin-slow" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-805">Advanced Writing Cognition</h4>
                  <p className="text-[11px] text-slate-500 px-4 mt-1 leading-relaxed">
                    Evaluates the reasoning depth of a personal statement. Converts flat, average copy into an authoritative brand narrative instantly.
                  </p>
                </div>
              </div>
            )}

            {slide.visualType === "swarm" && (
              <div className="flex flex-col justify-center items-center h-full w-full space-y-4">
                <div className="flex items-center space-x-3 bg-white border border-slate-200 p-3 rounded-lg w-full shadow-xs">
                  <p className="text-[11px] font-mono text-slate-600 leading-normal">
                    <strong className="text-indigo-650 block mb-0.5">Stage 1: Multi-Agent Parallel Evaluators</strong>
                    1. Grammar 2. Logic 3. Human 4. AI Forensics 5. ATS 6. Executive 7. Brand
                  </p>
                </div>
                <div className="h-6 w-0.5 bg-indigo-600"></div>
                <div className="flex items-center space-x-3 bg-white border border-slate-200 p-3 rounded-lg w-full shadow-xs">
                  <p className="text-[11px] font-mono text-slate-600 leading-normal">
                    <strong className="text-emerald-600 block mb-0.5">Stage 2: Synthesis Engine (Agent 8)</strong>
                    Weighted average aggregation, grade generation, step-by-step action plan synthesis.
                  </p>
                </div>
              </div>
            )}

            {slide.visualType === "differentiator" && (
              <div className="w-full space-y-3 font-mono">
                <div className="border border-slate-200 bg-white p-2.5 rounded text-left shadow-xs">
                  <span className="text-[10px] text-indigo-700 font-bold block mb-1">✓ THESIS LINKAGE AUDITOR</span>
                  <p className="text-[10px] text-slate-500 leading-relaxed">Runs dynamic semantic dependency traces across transition elements.</p>
                </div>
                <div className="border border-slate-200 bg-white p-2.5 rounded text-left shadow-xs">
                  <span className="text-[10px] text-rose-700 font-bold block mb-1">✗ ROBOTIC REPETITION BLOCKER</span>
                  <p className="text-[10px] text-slate-500 leading-relaxed">Screens against 40+ corporate/LLM fluff phrases and normalizes burstiness.</p>
                </div>
              </div>
            )}

            {slide.visualType === "market" && (
              <div className="w-full text-center p-3.5 rounded bg-indigo-50 border border-indigo-150">
                <span className="text-2xl font-bold font-sans text-indigo-700 block mb-1">$1.4B+</span>
                <span className="text-xs text-indigo-650 font-bold block">Total Addressable Market</span>
                <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                  Combining college admissions essay coaching, executive communication platforms, and premium resume evaluation niches.
                </p>
              </div>
            )}

          </div>

        </div>

        {/* Slide Footer */}
        <div className="border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <span className="text-[10px] text-slate-450 font-mono">
            MICROSOFT BUILD AI HACKATHON 2026 • WRITEMIND AI
          </span>
          <div className="flex space-x-1.5 h-1.5 animate-pulse">
            {PITCH_SLIDES.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentIdx(idx)}
                className={`w-6 rounded-full transition-all duration-300 ${idx === currentIdx ? "bg-indigo-600" : "bg-slate-200 hover:bg-slate-300"}`}
              />
            ))}
          </div>
        </div>

      </div>

      {/* Pitch Summary Deck Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-4.5 rounded-xl space-y-1 shadow-sm text-slate-800">
          <div className="flex items-center space-x-2 text-indigo-600">
            <Award className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-indigo-600">The Hackathon Goal</h4>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Positioned as a premium companion platform showcasing deep multi-agent workflow pipelines and concrete evaluation reasoning rather than a generic text prompt interface.
          </p>
        </div>
        <div className="bg-white border border-slate-200 p-4.5 rounded-xl space-y-1 shadow-sm text-slate-800">
          <div className="flex items-center space-x-2 text-indigo-600">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-rose-600">Anti AI-Slop Positioning</h4>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Uniquely targets LLM vocabulary and uniform pacing to allow human users to recover their authentic human voice and beat automated detectors.
          </p>
        </div>
        <div className="bg-white border border-slate-200 p-4.5 rounded-xl space-y-1 shadow-sm text-slate-800">
          <div className="flex items-center space-x-2 text-indigo-600">
            <Network className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-emerald-600">Multi-Agent Value</h4>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Dramatically reduces cognitive tunnel-vision. Highlights exact dimensions of weakness instead of vague corrections.
          </p>
        </div>
      </div>
    </div>
  );
}
