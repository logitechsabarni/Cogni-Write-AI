/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  PenTool, 
  UsersRound, 
  Presentation, 
  Terminal, 
  AlertCircle, 
  Database, 
  Linkedin, 
  Mail,
  Flame,
  Layout,
  ExternalLink
} from "lucide-react";
import ReviewDashboard from "./components/ReviewDashboard";
import AgentControlPanel from "./components/AgentControlPanel";
import PitchDeckView from "./components/PitchDeckView";
import MentorNotes from "./components/MentorNotes";

type NavTabType = "workbench" | "agents" | "pitch" | "mentor";

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTabType>("workbench");
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    // Quick startup health check on backend key detection
    const verifyBackend = async () => {
      try {
        const res = await fetch("/api/health");
        if (res.ok) {
          const data = await res.json();
          setIsConfigured(data.geminiConfigured);
        } else {
          setIsConfigured(false);
        }
      } catch (err) {
        console.error("Health check failure:", err);
        setIsConfigured(false);
      }
    };
    verifyBackend();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-indigo-500/20 selection:text-indigo-600" id="app_root">
      
      {/* Top micro status bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between text-xs text-slate-500 font-mono">
        <div className="flex items-center space-x-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-550 animate-pulse"></span>
          <span>MICROSOFT BUILD AI HACKATHON ENTRY • PLATFORM VERSION 1.1</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span>API Integration:</span>
            {isConfigured === null ? (
              <span className="text-slate-400">checking...</span>
            ) : isConfigured ? (
              <span className="text-emerald-600 font-bold uppercase text-[10px] bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">Active</span>
            ) : (
              <span className="text-amber-600 font-bold uppercase text-[10px] bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">Unconfigured (Safe Fallback)</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col md:flex-row">
        
        {/* Left Drawer/Sidebar */}
        <aside className="md:w-64 bg-slate-900 text-slate-400 p-5 flex flex-col justify-between border-r border-slate-800" id="app_sidebar">
          <div className="space-y-6">
            
            {/* Platform Branding Logo */}
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 text-white shadow-md">
                <Flame className="w-5 h-5 fill-current text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white leading-none font-sans">
                  WriteMind <span className="text-indigo-400 font-extrabold">AI</span>
                </h1>
                <span className="text-[9px] text-slate-400 font-mono tracking-wider uppercase">
                  Writing Intelligence
                </span>
              </div>
            </div>

            {/* Navigation Routes */}
            <nav className="space-y-1.5">
              {[
                { id: "workbench", label: "Writing Sandbox", icon: PenTool, desc: "Interactive audit workbench" },
                { id: "agents", label: "Swarm Agents", icon: UsersRound, desc: "Meet the 8 active agents" },
                { id: "pitch", label: "Hackathon Pitch Deck", icon: Presentation, desc: "Slide outline and moats" },
                { id: "mentor", label: "Technical Runway", icon: Terminal, desc: "FastAPI / Schema blue-prints" }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as NavTabType)}
                    className={`w-full text-left p-3 rounded-lg flex items-start space-x-3 transition group ${
                      activeTab === item.id
                        ? "bg-slate-800 text-white border-l-2 border-indigo-500"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 group-hover:text-indigo-400 transition-colors ${activeTab === item.id ? "text-indigo-400" : "text-slate-400"}`} />
                    <div className="leading-tight">
                      <span className="text-xs font-semibold block">{item.label}</span>
                      <span className="text-[10px] text-slate-500 block truncate max-w-[140px] mt-0.5">{item.desc}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer Mentor Card */}
          <div className="mt-8 border-t border-slate-800 pt-5 space-y-3.5">
            <div className="bg-slate-800/40 border border-slate-800/60 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                  MH-Coach
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Mentor Insights</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Need customized deployment scopes? Access the <strong className="text-white">Technical Runway</strong> tab to copy Python codes & PG tables instantly!
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Agent Status:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                ONLINE
              </span>
            </div>
          </div>

        </aside>

        {/* Right Main Panel */}
        <main className="flex-1 bg-slate-50 p-6 md:p-8 overflow-y-auto max-h-screen">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* System Info Banner for Unconfigured states */}
            {isConfigured === false && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-xs leading-normal text-amber-800">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-900">GEMINI_API_KEY Missing from Environments</p>
                  <p className="text-amber-700">
                    To connect live Multi-Agent Orchestrator pipelines, please configure your key in the **Settings &gt; Secrets** panel of the AI Studio. The system is currently primed to safely fall back to mock templates.
                  </p>
                </div>
              </div>
            )}

            {/* Router view body */}
            <div className="animate-fade-in">
              {activeTab === "workbench" && <ReviewDashboard />}
              {activeTab === "agents" && <AgentControlPanel />}
              {activeTab === "pitch" && <PitchDeckView />}
              {activeTab === "mentor" && <MentorNotes />}
            </div>

          </div>
        </main>
      </div>

      {/* Global Bottom Footer block */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center font-mono">
        <span>
          © {new Date().getFullYear()} WriteMind AI. Managed via Microsoft Build AI Hackathon Mentor Deck.
        </span>
        <div className="flex items-center space-x-4">
          <span className="text-slate-400">Architect: Sabarni Guha (sabarni.guha15@gmail.com)</span>
        </div>
      </footer>

    </div>
  );
}
