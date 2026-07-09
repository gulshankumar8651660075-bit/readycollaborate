import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Edit3, MessageSquare, Clipboard, Layers, Activity, Users, Check, Globe } from 'lucide-react';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#030408] text-zinc-100 saas-grid">
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute top-[40%] right-[25%] w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[130px] pointer-events-none" />

      {/* Header bar */}
      <header className="relative z-20 w-full border-b border-white/[0.04] bg-[#030408]/60 backdrop-blur-md sticky top-0 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 text-white shadow-lg shadow-indigo-500/20">
              <Layers size={18} className="animate-pulse" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              ReadyCollaborate
            </span>
          </div>

          <div className="flex items-center gap-6">
            {isLoggedIn ? (
              <Link 
                href="/dashboard" 
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/25 flex items-center gap-1.5"
              >
                Go to Workspace <ArrowRight size={13} />
              </Link>
            ) : (
              <>
                <Link href="/auth?tab=login" className="text-zinc-400 font-semibold hover:text-white transition text-xs">
                  Sign In
                </Link>
                <Link 
                  href="/auth?tab=signup" 
                  className="px-4.5 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition shadow-md"
                >
                  Start Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Body */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24 flex flex-col items-center text-center">
        
        {/* Banner Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-indigo-300 text-[10px] font-bold uppercase tracking-wider mb-8 shadow-inner shadow-white/5">
          <Sparkles size={11} className="text-indigo-400 animate-spin-slow" />
          The Ultimate Real-Time Workspace
        </div>

        {/* Catchy Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl leading-[1.08] mb-6">
          Collaborate on{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
            documents, tasks & sketchboards
          </span>
        </h1>

        <p className="text-zinc-400 text-sm md:text-lg max-w-2xl leading-relaxed mb-10">
          A premium, high-speed collaboration workspace engineered with JWT authentication, multi-user documents, task Kanban boards, and a shared vector whiteboard.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md mb-20">
          {isLoggedIn ? (
            <Link 
              href="/dashboard" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 text-white font-bold hover:opacity-95 transition shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 text-sm"
            >
              Enter Workspace Hub <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link 
                href="/auth?tab=signup" 
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 text-white font-bold hover:opacity-95 transition shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 text-sm"
              >
                Create Free Workspace <ArrowRight size={16} />
              </Link>
              <Link 
                href="/auth?tab=login" 
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] text-zinc-300 hover:text-white font-bold transition flex items-center justify-center text-sm"
              >
                Test Credentials
              </Link>
            </>
          )}
        </div>

        {/* CSS Interactive Workspace Preview Mockup */}
        <div className="w-full max-w-5xl saas-card rounded-2xl p-1.5 border-white/[0.08] shadow-2xl relative mb-28">
          <div className="absolute -inset-px bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 rounded-2xl -z-10 blur-xl opacity-70" />
          
          <div className="flex items-center gap-1.5 px-4 py-3 bg-[#0d0f17]/90 rounded-t-xl border-b border-white/[0.05]">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
            <span className="text-[10px] text-zinc-500 ml-4 font-mono bg-[#030408]/60 px-3 py-1 rounded border border-white/[0.04]">
              https://readycollaborate.com/workspace/design-team
            </span>
          </div>

          <div className="aspect-[16/9] w-full bg-[#030408]/40 p-4 flex gap-4 rounded-b-xl overflow-hidden text-left">
            {/* Sidebar Mock */}
            <div className="w-1/4 bg-[#0d0f17]/50 rounded-xl p-3 border border-white/[0.03] flex flex-col gap-4">
              <div className="h-4 bg-zinc-800/80 rounded w-2/3" />
              <div className="space-y-2 mt-4 flex-1">
                <div className="h-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded flex items-center px-2 text-[9px] text-indigo-400 font-bold">📄 Document Editor</div>
                <div className="h-3.5 bg-zinc-800/30 rounded flex items-center px-2 text-[9px] text-zinc-500">📋 Project Board</div>
                <div className="h-3.5 bg-zinc-800/30 rounded flex items-center px-2 text-[9px] text-zinc-500">🎨 Canvas Sketchpad</div>
              </div>
              <div className="space-y-2.5 pt-4 border-t border-white/[0.05]">
                <span className="text-[9px] text-zinc-600 block uppercase font-bold tracking-wider">Members (Online)</span>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 border border-indigo-400 flex items-center justify-center text-[9px] font-bold">JD</span>
                  <span className="text-[9px] text-zinc-400 font-semibold">John (You)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 border border-emerald-400 flex items-center justify-center text-[9px] font-bold text-white">EM</span>
                  <span className="text-[9px] text-zinc-400 font-semibold">Emma</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                </div>
              </div>
            </div>

            {/* Content Mock */}
            <div className="flex-1 bg-[#0d0f17]/50 rounded-xl p-4 border border-white/[0.03] flex flex-col gap-4 relative">
              <div className="flex justify-between items-center border-b border-white/[0.05] pb-2">
                <span className="text-[11px] font-extrabold text-zinc-200">📄 marketing_pitch.md</span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] text-emerald-400 font-bold">Auto-saved</span>
                </div>
              </div>

              <div className="space-y-3.5 flex-1 mt-2 text-xs text-zinc-500 font-mono">
                <p className="text-zinc-300 font-bold"># Landing Page Strategy</p>
                <p>1. Introduce the main value proposition with an animated heading.</p>
                <p>2. Display the sleek glassmorphic dashboard interface mockups.</p>
                <div className="inline-flex items-center gap-1.5 bg-indigo-500 text-white text-[9px] font-bold px-2 py-1 rounded shadow-lg shadow-indigo-500/20 relative animate-pulse">
                  <span>Emma is editing...</span>
                  <span className="w-2 h-2 bg-indigo-500 rotate-45 absolute -bottom-1 left-3" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid Redesign */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          <div className="saas-card p-8 rounded-2xl text-left saas-card-hover border-white/[0.06] relative">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit mb-6 border border-indigo-500/20">
              <Edit3 size={20} />
            </div>
            <h3 className="text-base font-extrabold text-zinc-200 mb-2">Live Markdown Editor</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Edit documents with others synchronously. Real-time cursor flags and selection highlights keep everyone coordinated.
            </p>
          </div>

          <div className="saas-card p-8 rounded-2xl text-left saas-card-hover border-white/[0.06]">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 w-fit mb-6 border border-cyan-500/20">
              <Clipboard size={20} />
            </div>
            <h3 className="text-base font-extrabold text-zinc-200 mb-2">Linear-style Kanban Board</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Manage and drag cards across work columns instantly. Create tasks, set priorities, and assign members dynamically.
            </p>
          </div>

          <div className="saas-card p-8 rounded-2xl text-left saas-card-hover border-white/[0.06]">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 w-fit mb-6 border border-purple-500/20">
              <Sparkles size={20} />
            </div>
            <h3 className="text-base font-extrabold text-zinc-200 mb-2">Vector Whiteboard Sketch</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Draw ideas and diagrams together on a shared real-time vector canvas. Custom brush colors and widths built-in.
            </p>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-white/[0.04] bg-[#030408]/30 py-8 px-6 text-center text-zinc-600 text-xs flex flex-col sm:flex-row justify-between items-center gap-4 max-w-7xl mx-auto">
        <div>&copy; 2026 ReadyCollaborate. Designed with high quality.</div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-zinc-400 transition">GitHub</a>
          <a href="#" className="hover:text-zinc-400 transition">Terms</a>
          <a href="#" className="hover:text-zinc-400 transition">Privacy</a>
        </div>
      </footer>
    </div>
  );
}
