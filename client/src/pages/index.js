import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Users, Edit3, MessageSquare, Clipboard, Activity, Layers } from 'lucide-react';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-workspace-900 grid-bg">
      {/* Absolute background blur bubbles */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 text-white shadow-lg shadow-indigo-500/25">
            <Layers size={22} className="animate-pulse-slow" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            ReadyCollaborate
          </span>
        </div>
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <Link href="/dashboard" className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20 text-sm flex items-center gap-1.5">
              Go to Workspace <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link href="/auth?tab=login" className="text-slate-300 font-medium hover:text-white transition text-sm">
                Sign In
              </Link>
              <Link href="/auth?tab=signup" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-medium hover:opacity-90 transition shadow-lg shadow-indigo-500/10 text-sm">
                Get Started Free
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border-white/15 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
          Real-time Full-Stack Collaborative Hub
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1] mb-6">
          Collaborate on{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Documents, Tasks & Canvas
          </span>{' '}
          in Real Time
        </h1>

        <p className="text-slate-400 text-base md:text-xl max-w-2xl leading-relaxed mb-12">
          ReadyCollaborate is a powerful multi-user workspace equipped with secure JWT authentication, conflict-handled documents, interactive Kanban boards, and a shared whiteboard.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-xs sm:max-w-md">
          {isLoggedIn ? (
            <Link href="/dashboard" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold hover:opacity-95 transition shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2">
              Enter Dashboard <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <Link href="/auth?tab=signup" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold hover:opacity-95 transition shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2">
                Start Collaborating <ArrowRight size={18} />
              </Link>
              <Link href="/auth?tab=login" className="w-full sm:w-auto px-8 py-4 rounded-xl glass hover:bg-white/5 text-slate-200 font-semibold transition border-white/10 flex items-center justify-center">
                Demo Sign In
              </Link>
            </>
          )}
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mt-24 lg:mt-32">
          {/* Card 1 */}
          <div className="glass-card p-6 rounded-2xl text-left glass-card-hover">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit mb-6">
              <Edit3 size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Collaborative Document</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Edit markdown documents with others simultaneously. Live cursor tracking shows exactly where everyone is typing.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card p-6 rounded-2xl text-left glass-card-hover">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 w-fit mb-6">
              <Clipboard size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Task Board (Kanban)</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Organize workflows collaboratively. Drag, drop, assign, and update cards. Changes sync immediately.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card p-6 rounded-2xl text-left glass-card-hover">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 w-fit mb-6">
              <Users size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Live Whiteboard</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Sketch diagrams, share ideas, and draw together on a shared real-time canvas with customizable colors.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass-card p-6 rounded-2xl text-left glass-card-hover">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit mb-6">
              <MessageSquare size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Chat & Presence</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Keep communication centralized. Real-time workspace chat logs history, and active presence lists online users.
            </p>
          </div>
        </div>
      </main>

      {/* Decorative Mockup */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <div className="glass-card rounded-2xl p-2 md:p-3 overflow-hidden border-white/10 shadow-2xl relative">
          <div className="flex items-center gap-1.5 px-4 py-3 bg-workspace-800/80 rounded-t-xl border-b border-white/5">
            <span className="w-3 h-3 rounded-full bg-rose-500/70" />
            <span className="w-3 h-3 rounded-full bg-amber-500/70" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
            <span className="text-xs text-slate-400 ml-4 font-mono bg-workspace-900/50 px-3 py-1 rounded border border-white/5">
              https://readycollaborate.vercel.app/workspace/active
            </span>
          </div>
          <div className="aspect-[16/9] w-full bg-workspace-800/40 p-4 flex flex-col relative overflow-hidden rounded-b-xl">
            {/* Inner interface mockup */}
            <div className="flex h-full gap-4 opacity-75">
              {/* Sidebar */}
              <div className="w-1/4 glass rounded-xl p-3 flex flex-col gap-4">
                <div className="h-4 bg-slate-700/50 rounded w-3/4" />
                <div className="space-y-2 mt-4">
                  <div className="h-3 bg-slate-700/30 rounded" />
                  <div className="h-3 bg-slate-700/30 rounded w-5/6" />
                  <div className="h-3 bg-slate-700/30 rounded w-2/3" />
                </div>
                <div className="mt-auto space-y-2">
                  <div className="h-3 bg-slate-700/30 rounded w-1/2" />
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-[10px] text-slate-400">John (You)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[10px] text-slate-400">Emma</span>
                  </div>
                </div>
              </div>
              {/* Main Content */}
              <div className="flex-1 glass rounded-xl p-4 flex flex-col gap-4">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <div className="h-5 bg-slate-700/60 rounded w-1/3" />
                  <div className="flex gap-2">
                    <div className="w-12 h-4 bg-indigo-500/20 rounded" />
                    <div className="w-12 h-4 bg-slate-700/20 rounded" />
                  </div>
                </div>
                <div className="space-y-3 flex-1 mt-2">
                  <div className="h-3 bg-slate-700/40 rounded w-full" />
                  <div className="h-3 bg-slate-700/40 rounded w-11/12" />
                  <div className="h-3 bg-slate-700/40 rounded w-5/6" />
                  <div className="h-3 bg-slate-700/40 rounded w-full" />
                  {/* Floating Cursor Mock */}
                  <div className="relative inline-flex items-center gap-1.5 bg-indigo-500 px-2 py-0.5 rounded text-[9px] text-white font-semibold font-mono shadow ml-12">
                    Emma is typing...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 border-t border-white/5 text-center text-slate-500 text-xs flex flex-col md:flex-row justify-between items-center gap-4">
        <div>&copy; 2026 ReadyCollaborate. Designed for high productivity.</div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-slate-300 transition">Terms</a>
          <a href="#" className="hover:text-slate-300 transition">Privacy</a>
          <a href="#" className="hover:text-slate-300 transition">Support</a>
        </div>
      </footer>
    </div>
  );
}
