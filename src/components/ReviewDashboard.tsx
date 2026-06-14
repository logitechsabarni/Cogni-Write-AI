/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  Sparkles, 
  Trash2, 
  Save, 
  RotateCcw, 
  ArrowRight, 
  CheckCircle, 
  CircleAlert, 
  Layers, 
  Wrench, 
  PenTool, 
  UsersRound, 
  ChevronRight, 
  FileCheck2,
  ListRestart
} from "lucide-react";
import { SavedDraft, EvaluationScorecard, SeverityType } from "../types";

const CONTEXT_TEMPLATES = [
  {
    title: "Stanford CS MS Statement of Purpose",
    context: "SOP for Stanford University CS Masters Core Admissions",
    draftTitle: "My Statement of Purpose - Computer Science",
    text: `I am writing to express my candidacy for the Masters in Computer Science at Stanford. Ever since I was a teenager, I have always wanted to delve deep into artificial intelligence. This field is a testament to human potential and is an elegant tapestry compiling math and silicon. I have done countless things, like assisting in a laboratory setting where I worked extensively with large databases and made systems run quite a bit faster. 

Moreover, I have always wanted to leverage deep learning. Our laboratory had a main goal and we realized we had to create synergy. I assisted the professor in coding deep networks, which was responsible for increasing accuracy or something like that. I am a very hard-working individual and getting admitted into Stanford constitutes my ultimate life dream and will help me build a startup in Silicon Valley, which is the cradle of world-class innovation.`
  },
  {
    title: "McKinsey Associate Cover Letter",
    context: "Cover Letter for McKinsey & Company Management Consultant Associate",
    draftTitle: "McKinsey Consultant Cover Letter",
    text: `Dear Hiring Team, I am extremely thrilled to submit my interest for the Associate position. I am a seasoned analyst and I believe my background represents a strong fit. I was responsible for looking over financial reports and helping team members on projects. Over my tenure, I assisted in structuring customer acquisition databases where I did substantial analysis. 

Furthermore, I have spent years learning to coordinate stakeholders. I am exceptionally good at synergizing, and my unique background testaments that I can leverage strategic frameworks perfectly. I worked at a leading corporate where I watched market indicators and helped drive a 5% optimization. I would love to interview for this role and show how my passion fits McKinsey's stellar, world-changing values, which completely demystify consultancy.`
  },
  {
    title: "YC Partner Pitch Email",
    context: "Cold Startup Pitch Draft to Y-Combinator Partner",
    draftTitle: "YC Partner cold pitch - WriteMind AI",
    text: `Hi Partner, I hope this email finds you well. I am reaching out because we have built WriteMind AI, which we believe is going to disrupt the entire word processor industry. In the age of AI, everyone is writing content, but the content is extremely dry. Our platform leverages a multi-agent model to delve deep into drafts, which testaments a massive opportunity in SaaS.

We have been scaling quite rapidly and we are seeing some crazy early traction and interest. Over the last three weeks, we got some users and we synergized in a Slack channel. Furthermore, we want to scale to a billion dollar business quite soon. I would love to hop on a quick call with you next Tuesday at 10 AM to showcase our live product demo. Please let me know if that time works. Thanks!`
  }
];

export default function ReviewDashboard() {
  const [drafts, setDrafts] = useState<SavedDraft[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string>("");
  const [title, setTitle] = useState("My Statement of Purpose - Computer Science");
  const [context, setContext] = useState("SOP for Stanford University CS Masters Core Admissions");
  const [text, setText] = useState(`I am writing to express my candidacy for the Masters in Computer Science at Stanford. Ever since I was a teenager, I have always wanted to delve deep into artificial intelligence. This field is a testament to human potential and is an elegant tapestry compiling math and silicon. I have done countless things, like assisting in a laboratory setting where I worked extensively with large databases and made systems run quite a bit faster. 

Moreover, I have always wanted to leverage deep learning. Our laboratory had a main goal and we realized we had to create synergy. I assisted the professor in coding deep networks, which was responsible for increasing accuracy or something like that. I am a very hard-working individual and getting admitted into Stanford constitutes my ultimate life dream and will help me build a startup in Silicon Valley, which is the cradle of world-class innovation.`);
  
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalProgress, setEvalProgress] = useState<string>("");
  const [scorecard, setScorecard] = useState<EvaluationScorecard | null>(null);
  const [isLocalFallback, setIsLocalFallback] = useState(false);
  
  const [activeAgentDetail, setActiveAgentDetail] = useState<string>("grammar");
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteTargetId, setRewriteTargetId] = useState<string | null>(null);

  // Fetch saved drafts & scorecards on load
  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      const res = await fetch("/api/drafts");
      if (res.ok) {
        const data = await res.json();
        setDrafts(data);
        if (data.length > 0 && !activeDraftId) {
          loadDraft(data[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching drafts:", err);
    }
  };

  const loadDraft = (d: SavedDraft) => {
    setActiveDraftId(d.id);
    setTitle(d.title);
    setContext(d.context);
    setText(d.text);
    setScorecard(null); // Clear previous scorecard
  };

  const loadTemplate = (idx: number) => {
    const template = CONTEXT_TEMPLATES[idx];
    setTitle(template.draftTitle);
    setContext(template.context);
    setText(template.text);
    setScorecard(null);
    setActiveDraftId("");
  };

  const handleSaveDraft = async () => {
    if (!text.trim()) return;
    try {
      const draftPayload: Partial<SavedDraft> = {
        id: activeDraftId || undefined,
        title,
        text,
        context
      };
      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftPayload)
      });
      if (res.ok) {
        const saved = await res.json();
        setActiveDraftId(saved.id);
        fetchDrafts();
      }
    } catch (err) {
      console.error("Error saving draft:", err);
    }
  };

  const handleDeleteDraft = async () => {
    if (!activeDraftId) return;
    try {
      const res = await fetch(`/api/drafts/${activeDraftId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setText("");
        setTitle("Untitled Draft");
        setActiveDraftId("");
        setScorecard(null);
        fetchDrafts();
      }
    } catch (err) {
      console.error("Error deleting draft:", err);
    }
  };

  // High-Fidelity Client-Side Rule Optimization Review Engine
  const generateLocalEvaluation = (rawText: string, targetContext: string, docTitle: string): EvaluationScorecard => {
    const textLower = rawText.toLowerCase();
    
    // Detect slop and metrics
    const slopWords = [
      { word: "delve", severity: "critical" as SeverityType, agent: "ai_detection", text: "Detected robotic transition term 'delve'. Deep learning vocabulary detectors heavily flag this word.", suggestion: "explore", orig: "" },
      { word: "testament", severity: "critical" as SeverityType, agent: "ai_detection", text: "Signature corporate phrasing 'is a testament to'. Heavy marker of automated models.", suggestion: "proof of", orig: "" },
      { word: "tapestry", severity: "critical" as SeverityType, agent: "ai_detection", text: "Overly poetic semantic cliché 'elegant tapestry'. Highly targeted by automated screens.", suggestion: "integration", orig: "" },
      { word: "moreover", severity: "warning" as SeverityType, agent: "grammar", text: "Heavy transitional connector 'Moreover'. Disrupts natural cadence and sounds highly mechanical.", suggestion: "Furthermore,", orig: "" },
      { word: "leverage", severity: "warning" as SeverityType, agent: "brand", text: "Vague corporate buzzword 'leverage'. Use specific description instead of abstract fillers.", suggestion: "utilize", orig: "" },
      { word: "synergy", severity: "warning" as SeverityType, agent: "brand", text: "Overdone business jargon 'synergy' or 'synergize'. Represents standard commodity text.", suggestion: "cooperation", orig: "" },
      { word: "assisted in", severity: "warning" as SeverityType, agent: "ats", text: "Passive posture 'assisted in'. ATS algorithms prioritize direct responsibility assertions.", suggestion: "co-developed", orig: "" },
      { word: "was responsible for", severity: "critical" as SeverityType, agent: "ats", text: "Passive structural statement 'was responsible for'. Highlight authority to level up compliance metrics.", suggestion: "led and orchestrated", orig: "" }
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
      }
    };

    matchedSlops.forEach((item, index) => {
      const issueObj = {
        id: `local_issue_${item.agent}_${index}`,
        severity: item.severity,
        text: item.text,
        suggestion: item.suggestion,
        originalText: item.orig || item.word
      };
      
      if (agentResults[item.agent]) {
        agentResults[item.agent].issues.push(issueObj);
      }
    });

    const keyStrengths = [
      "Exceptional mechanical formatting with robust sentence structure.",
      "Highly explicit career alignment mapping straight to competitive criteria.",
      "Clear, ambitious long-term goals that showcase high personal resolve."
    ];

    const keyGaps = [
      matchedSlops.length > 0 
        ? "Presence of signature automated slop parameters that raise AI filters." 
        : "Overuse of passive structural verbs that soften personal accountability.",
      "Lack of specific data, metrics, or quantified parameters of success.",
      "Robotic, uniform sentence lengths that dilute individual writer rhythm."
    ];

    const actionPlan = [
      "Eradicate mechanical transitions and generic metaphors immediately.",
      "Revise sentences in active voice ('led' instead of 'was responsible for').",
      "Introduce strong sentence burstiness by pairing short assertions with complex claims.",
      "Anchor a sharp, unique value proposition focused on delivery instead of learning."
    ];

    return {
      id: "local_scorecard_" + Date.now(),
      title: docTitle || "Local Scorecard Assessment",
      text: rawText,
      context: targetContext || "General Writing",
      timestamp: Date.now(),
      overallScore,
      grade: letterGrade,
      agentResults,
      keyStrengths,
      keyGaps,
      actionPlan
    };
  };

  // Staged multi-agent flow simulation for immersive UX
  const triggerEvaluation = async () => {
    if (!text.trim()) return;
    setIsEvaluating(true);
    setScorecard(null);
    setIsLocalFallback(false);
    
    const steps = [
      "Linguistics check: Launching Grammar Agent...",
      "Cognition check: Launching Logic Auditor...",
      "Authenticity analysis: Running Humanization evaluation...",
      "Linguistic security: Booting AI Detection Scanner...",
      "Persona matching: Simulating target Reviewer checks...",
      "Database match: Auditing Resume ATS optimization...",
      "Strategic branding: Running Brand Identity check...",
      "Compiling agent data: Invoking Recommendation Synthesis Agent..."
    ];

    for (let i = 0; i < steps.length; i++) {
      setEvalProgress(steps[i]);
      await new Promise((r) => setTimeout(r, 400));
    }

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, context, title })
      });
      if (res.ok) {
        const compiledScorecard = await res.json();
        setScorecard(compiledScorecard);
        setIsLocalFallback(false);
        const agentKeys = Object.keys(compiledScorecard.agentResults);
        if (agentKeys.length > 0) {
          setActiveAgentDetail(agentKeys[0]);
        }
      } else {
        console.warn("API returned non-ok response, deploying local evaluation engine fallback");
        const localCard = generateLocalEvaluation(text, context, title);
        setScorecard(localCard);
        setIsLocalFallback(true);
        const agentKeys = Object.keys(localCard.agentResults);
        if (agentKeys.length > 0) {
          setActiveAgentDetail(agentKeys[0]);
        }
      }
    } catch (err) {
      console.warn("API request triggered catch block, deploying local evaluation engine fallback", err);
      const localCard = generateLocalEvaluation(text, context, title);
      setScorecard(localCard);
      setIsLocalFallback(true);
      const agentKeys = Object.keys(localCard.agentResults);
      if (agentKeys.length > 0) {
        setActiveAgentDetail(agentKeys[0]);
      }
    } finally {
      setIsEvaluating(false);
      setEvalProgress("");
    }
  };

  // Sandbox Live Rewrite suggestions implementation
  const handleApplyRewrite = async (issueId: string, suggestion: string, originalText?: string) => {
    if (!text) return;
    setIsRewriting(true);
    setRewriteTargetId(issueId);

    try {
      const instruction = originalText 
        ? `Incorporate this precise optimization: replace the block "${originalText}" with "${suggestion}". Maintain overall essay flow.`
        : `Revise the text to resolve this issue: "${suggestion}"`;

      const res = await fetch("/api/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, context, instruction, agentId: activeAgentDetail })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.revisedText) {
          setText(data.revisedText);
          updateResolvedIssue(issueId);
          setIsRewriting(false);
          setRewriteTargetId(null);
          return;
        }
      }
    } catch (err) {
      console.warn("API improve failed, executing high-fidelity client-side rewrite fallback:", err);
    }

    // High-Fidelity client-side replacement rewrite fallback
    try {
      if (originalText && text.includes(originalText)) {
        // Direct segment substitution
        const revised = text.replace(originalText, suggestion);
        setText(revised);
      } else {
        // Fallback pattern matching
        let revisedText = text;
        const replacePairs = [
          { pattern: /delve deep into/gi, replacement: "explore" },
          { pattern: /delve/gi, replacement: "explore" },
          { pattern: /testament to/gi, replacement: "proof of" },
          { pattern: /elegant tapestry/gi, replacement: "integration" },
          { pattern: /moreover/gi, replacement: "Furthermore" },
          { pattern: /leverage/gi, replacement: "utilize" },
          { pattern: /synergy/gi, replacement: "cooperation" },
          { pattern: /synergize/gi, replacement: "cooperate" },
          { pattern: /assisted in coding/gi, replacement: "engineered and developed" },
          { pattern: /assisted in/gi, replacement: "co-developed" },
          { pattern: /was responsible for/gi, replacement: "led and orchestrated" }
        ];

        let replaced = false;
        for (const pair of replacePairs) {
          if (revisedText.match(pair.pattern)) {
            revisedText = revisedText.replace(pair.pattern, pair.replacement);
            replaced = true;
          }
        }
        
        if (!replaced) {
          revisedText = text + "\n\n[Optimization review edit. Implemented recommendation: " + suggestion + "]";
        }
        setText(revisedText);
      }
      updateResolvedIssue(issueId);
    } catch (err) {
      console.error("Local rewrite fallback failed:", err);
    } finally {
      setIsRewriting(false);
      setRewriteTargetId(null);
    }
  };

  const updateResolvedIssue = (issueId: string) => {
    if (scorecard) {
      const updatedResults = { ...scorecard.agentResults };
      if (updatedResults[activeAgentDetail]) {
        updatedResults[activeAgentDetail].issues = updatedResults[activeAgentDetail].issues.filter(
          (issue) => issue.id !== issueId
        );
      }
      setScorecard({ ...scorecard, agentResults: updatedResults });
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="review_dashboard">
      
      {/* LEFT COLUMN: Editor Sandbox and context settings */}
      <div className="xl:col-span-6 space-y-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between justify-start gap-4 pb-3.5 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-mono text-indigo-600 uppercase tracking-widest block font-bold">
                PLATFORM WORKBENCH
              </span>
              <h3 className="text-base font-bold text-slate-800 tracking-tight">
                Drafting Canvas
              </h3>
            </div>
            
            {/* Quick Templates Trigger */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">Presets:</span>
              <div className="flex gap-1.5 overflow-x-auto py-1">
                {CONTEXT_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadTemplate(idx)}
                    className="text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-650 hover:text-slate-900 px-2 py-1 rounded font-medium transition"
                  >
                    {idx === 0 ? "CS SOP" : idx === 1 ? "Cover Letter" : "YC Pitch"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono uppercase font-semibold">
                  Document Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-sans text-xs rounded-lg px-3 py-2.5 outline-none focus:border-indigo-400 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono uppercase font-semibold">
                  Goal / Target Context
                </label>
                <input
                  type="text"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-sans text-xs rounded-lg px-3 py-2.5 outline-none focus:border-indigo-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-1 relative">
              <div className="flex justify-between items-center mb-0.5">
                <label className="text-[10px] text-slate-500 font-mono uppercase font-semibold">
                  Write or paste your draft text (English):
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {text.trim() ? text.trim().split(/\s+/).length : 0} words
                </span>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your cover letter, statement of purpose, or pitch email here..."
                rows={16}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-sans text-sm rounded-xl p-4 outline-none focus:border-indigo-350 focus:bg-white resize-y leading-relaxed font-normal shadow-inner transition-all min-h-[380px]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSaveDraft}
                disabled={!text.trim()}
                className="flex items-center space-x-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-650 hover:text-slate-900 disabled:opacity-40 disabled:hover:text-slate-600 rounded-lg text-xs font-semibold transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Draft</span>
              </button>
              
              {activeDraftId && (
                <button
                  onClick={handleDeleteDraft}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-semibold transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>

            <button
              id="sandbox_review_btn"
              onClick={triggerEvaluation}
              disabled={isEvaluating || !text.trim()}
              className="flex items-center space-x-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-lg text-xs tracking-wide uppercase shadow-md hover:shadow-indigo-100 transition-all active:translate-y-px disabled:opacity-45 disabled:pointer-events-none duration-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-100" />
              <span>{isEvaluating ? "Reviewing..." : "Review"}</span>
            </button>
          </div>
        </div>

        {/* Saved Drafts List */}
        {drafts.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              Saved Drafts History ({drafts.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[140px] overflow-y-auto">
              {drafts.map((d) => (
                <button
                  key={d.id}
                  onClick={() => loadDraft(d)}
                  className={`text-left p-2.5 rounded-lg border text-xs transition-colors flex justify-between items-center ${
                    activeDraftId === d.id
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold shadow-xs"
                      : "bg-slate-50 border-slate-200 hover:border-slate-350 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="font-semibold truncate">{d.title}</p>
                    <p className="text-[10px] text-slate-450 truncate mt-0.5">{d.context}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* RIGHT COLUMN: Pipeline Progress OR Scorecard Presentation */}
      <div className="xl:col-span-6 space-y-5">
        
        {/* Loading / Execution Animation Box */}
        {isEvaluating && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 min-h-[500px] flex flex-col justify-center items-center space-y-5 text-center shadow-sm animate-pulse">
            <div className="relative">
              <div className="h-14 w-14 rounded-full border-2 border-indigo-100 border-t-indigo-650 animate-spin"></div>
              <Sparkles className="w-6 h-6 text-indigo-650 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            
            <div className="space-y-2">
              <h4 className="font-extrabold text-slate-800 text-base">WriteMind Orchestration Engine Active</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                We are running an agentic pipeline, dispatching document content concurrently to specialized analytical domains...
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-lg font-mono text-[10px] text-indigo-700 font-semibold shadow-xs">
              {evalProgress}
            </div>
          </div>
        )}

        {/* Empty State Banner (No analysis run yet) */}
        {!isEvaluating && !scorecard && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 min-h-[500px] flex flex-col justify-center items-center text-center space-y-4 shadow-sm">
            <div className="p-4 bg-slate-50 rounded-full border border-slate-200 text-slate-400">
              <Layers className="w-10 h-10 text-slate-400" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-slate-800 text-sm">Review Engine Awaiting Document</h4>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Input your text or click one of our preset templates on the left, then click <strong className="text-indigo-650">"Review"</strong> to audit writing quality across 8 analytical dimensions.
              </p>
            </div>
          </div>
        )}

        {/* Scorecard Results Interface */}
        {!isEvaluating && scorecard && (
          <div className="space-y-5">
            
            {isLocalFallback && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-amber-800 shadow-xs animate-fade-in" id="local_fallback_notice_banner">
                <CircleAlert className="w-4.5 h-4.5 text-amber-600 flex-shrink-0 mt-0.5 animate-bounce" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-amber-900">Local Review Optimization Active</p>
                  <p className="text-amber-700 leading-relaxed">
                    Analyzing metrics of structure, logic, passive words, and AI vocabulary. To activate the fully generative 8-Agent Swarms with deep contextual intelligence, define your <code className="bg-amber-100 px-1 py-0.5 rounded font-bold text-amber-900 font-mono">GEMINI_API_KEY</code> in the secrets panel.
                  </p>
                </div>
              </div>
            )}
            
            {/* Main Scorecard Header Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden shadow-sm">
              
              <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-bl from-indigo-50 to-transparent rounded-full -mr-10 -mt-10" />
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                
                {/* Gauge Circle */}
                <div className="md:col-span-4 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-slate-100 pb-5 md:pb-0 md:pr-5">
                  <div className="relative flex justify-center items-center h-28 w-28">
                    {/* Circle SVG track */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle 
                        cx="56" cy="56" r="48" 
                        fill="transparent" 
                        stroke="#f1f5f9" strokeWidth="8"
                      />
                      <circle 
                        cx="56" cy="56" r="48" 
                        fill="transparent" 
                        stroke="#4f46e5" strokeWidth="8" 
                        strokeDasharray={2 * Math.PI * 48}
                        strokeDashoffset={(2 * Math.PI * 48) * (1 - scorecard.overallScore / 100)}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute flex flex-col justify-center items-center">
                      <span className="text-3xl font-extrabold text-slate-800 font-sans">{scorecard.overallScore}%</span>
                      <span className="text-[10px] text-slate-450 font-mono uppercase tracking-widest mt-0.5">Overall</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center space-x-1 border border-indigo-100 px-3 py-1 rounded-full bg-indigo-50">
                    <span className="text-[10px] text-indigo-500 font-mono font-bold">GRADE:</span>
                    <span className="text-xs font-bold text-indigo-700 font-sans">{scorecard.grade}</span>
                  </div>
                </div>

                {/* Overarching synthesis statement */}
                <div className="md:col-span-8 space-y-3">
                  <div>
                    <span className="text-[10px] font-mono text-indigo-600 uppercase tracking-wider font-bold">
                      PIPELINE SYNTHESIS
                    </span>
                    <h3 className="text-base font-extrabold text-slate-850 tracking-tight leading-snug">
                      {scorecard.title}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-150">
                      <span className="text-[9px] text-emerald-700 font-extrabold uppercase tracking-wider block">
                        Core Strengths
                      </span>
                      <ul className="space-y-1">
                        {scorecard.keyStrengths.slice(0, 2).map((str, i) => (
                           <li key={i} className="text-[11px] text-slate-650 truncate font-medium">
                            ✓ {str}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-150">
                      <span className="text-[9px] text-rose-700 font-extrabold uppercase tracking-wider block">
                        Critical Gaps
                      </span>
                      <ul className="space-y-1">
                        {scorecard.keyGaps.slice(0, 2).map((gap, i) => (
                          <li key={i} className="text-[11px] text-slate-650 truncate font-medium">
                            ⚠ {gap}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Agent scores summary row */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold mb-3">
                Agent Sub-Scores
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {Object.entries(scorecard.agentResults).map(([key, val]) => {
                  const value = val as any;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveAgentDetail(key)}
                      className={`p-2 rounded-lg border text-center transition ${
                        activeAgentDetail === key
                          ? "bg-indigo-50 border-indigo-600 text-indigo-850 font-bold"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      <span className="text-[10px] block truncate font-sans">{value.agentName.replace(" Agent", "")}</span>
                      <span className={`text-sm font-bold block mt-1 ${value.score >= 85 ? "text-emerald-600" : value.score >= 70 ? "text-amber-600" : "text-rose-600"}`}>{value.score}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drilldown Agent Card Display */}
            {scorecard.agentResults[activeAgentDetail] && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm text-slate-800 animate-fade-in">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">
                      {scorecard.agentResults[activeAgentDetail].agentName} Internal Report
                    </h3>
                    <p className="text-[10px] text-slate-450 font-mono uppercase mt-0.5 animate-pulse">
                      Sub-audit focus: {activeAgentDetail}
                    </p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    scorecard.agentResults[activeAgentDetail].score >= 85 
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                      : scorecard.agentResults[activeAgentDetail].score >= 70 
                        ? "bg-amber-50 text-amber-700 border border-amber-100" 
                        : "bg-rose-50 text-rose-700 border border-rose-100"
                  }`}>
                    Score: {scorecard.agentResults[activeAgentDetail].score}/100
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100 font-normal italic">
                    {scorecard.agentResults[activeAgentDetail].feedback}
                  </p>

                  {/* Strengths & Gaps lists */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono text-emerald-600 uppercase tracking-widest font-bold">
                        Aesthetic Strengths
                      </span>
                      <ul className="space-y-1.5">
                        {scorecard.agentResults[activeAgentDetail].strengths.map((st, i) => (
                          <li key={i} className="text-xs text-slate-705 flex items-start space-x-1.5">
                            <span className="text-emerald-600 mt-0.5">•</span>
                            <span className="leading-snug">{st}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[9px] font-mono text-rose-600 uppercase tracking-widest font-bold">
                        Dimension Deficiencies
                      </span>
                      <ul className="space-y-1.5">
                        {scorecard.agentResults[activeAgentDetail].gaps.map((gp, i) => (
                          <li key={i} className="text-xs text-slate-705 flex items-start space-x-1.5">
                            <span className="text-rose-600 mt-0.5">•</span>
                            <span className="leading-snug">{gp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Micro Issues and suggestion cards */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold block">
                      Targeted Corrections ({scorecard.agentResults[activeAgentDetail].issues.length})
                    </span>
                    
                    {scorecard.agentResults[activeAgentDetail].issues.length === 0 ? (
                      <p className="text-[11px] text-slate-450 italic">No micro-issues flagged in this dimension!</p>
                    ) : (
                      <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                        {scorecard.agentResults[activeAgentDetail].issues.map((issue) => (
                          <div 
                            key={issue.id} 
                            className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                                issue.severity === "critical"
                                  ? "bg-red-50 text-red-700 border border-red-100"
                                  : issue.severity === "warning"
                                    ? "bg-yellow-50 text-yellow-700 border border-yellow-105"
                                    : "bg-blue-50 text-blue-700 border border-blue-105"
                              }`}>
                                {issue.severity}
                              </span>
                              
                              <button
                                onClick={() => handleApplyRewrite(issue.id, issue.suggestion, issue.originalText)}
                                disabled={isRewriting}
                                className="text-[9px] bg-indigo-50 hover:bg-indigo-650 text-indigo-700 hover:text-white font-bold px-2.5 py-1 rounded border border-indigo-205 transition-all flex items-center gap-1 disabled:opacity-40"
                              >
                                {isRewriting && rewriteTargetId === issue.id ? (
                                  <span className="h-2.5 w-2.5 rounded-full border border-current border-t-transparent animate-spin"></span>
                                ) : (
                                  <Sparkles className="w-2.5 h-2.5" />
                                )}
                                Apply Auto-Rewrite
                              </button>
                            </div>

                            <p className="text-xs text-slate-700 font-sans">
                              {issue.text}
                            </p>

                            {issue.originalText && (
                              <div className="text-[11px] text-slate-650 bg-slate-100/90 border border-slate-200 p-2 rounded">
                                <span className="text-[9px] font-mono uppercase block text-slate-400 mb-0.5">Found:</span>
                                <span className="italic">"{issue.originalText}"</span>
                              </div>
                            )}

                            {issue.suggestion && (
                              <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-150 p-2 rounded font-medium">
                                <span className="text-[9px] font-mono uppercase block text-emerald-600/70 mb-0.5">Suggested:</span>
                                <span className="font-semibold">{issue.suggestion}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* Strategic Action Plan steps */}
            {scorecard.actionPlan && scorecard.actionPlan.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-slate-850">
                <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 mb-3">
                  <Wrench className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider font-bold">
                    Master Action Rewrite Schedule
                  </h4>
                </div>
                <ul className="space-y-3">
                  {scorecard.actionPlan.map((step, idx) => (
                    <li 
                      key={idx}
                      className="flex items-start space-x-3 text-xs text-slate-700 bg-slate-50 border border-slate-150 p-3 rounded-lg"
                    >
                      <span className="h-5 w-5 bg-indigo-50 text-indigo-650 rounded-full border border-indigo-250 flex items-center justify-center font-mono font-extrabold text-[10px] mt-0.5 flex-shrink-0 shadow-xs">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
