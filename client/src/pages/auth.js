import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { apiFetch } from '../utils/api';
import { Layers, Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';

const AVATARS = [
  { id: 'dev_m', emoji: '👨‍💻', label: 'Dev Boy' },
  { id: 'dev_f', emoji: '👩‍💻', label: 'Dev Girl' },
  { id: 'fox', emoji: '🦊', label: 'Clever Fox' },
  { id: 'cat', emoji: '🐱', label: 'Chill Cat' },
  { id: 'panda', emoji: '🐼', label: 'Lazy Panda' },
  { id: 'unicorn', emoji: '🦄', label: 'Magic Horse' }
];

export default function Auth() {
  const router = useRouter();
  const [tab, setTab] = useState('login');
  
  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('dev_m');
  
  // UI States
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (router.query.tab === 'signup') {
      setTab('signup');
    } else if (router.query.tab === 'login') {
      setTab('login');
    }
  }, [router.query.tab]);

  const toggleTab = (newTab) => {
    setTab(newTab);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 'login') {
        const data = await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        const data = await apiFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ username, email, password, avatar })
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030408] saas-grid relative px-4">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Brand Link */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition">
              <Layers size={18} />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              ReadyCollaborate
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="saas-card rounded-2xl p-8 border-white/[0.08] shadow-2xl">
          
          {/* Header Tab Toggles */}
          <div className="flex bg-[#030408]/60 p-1 rounded-xl border border-white/[0.05] mb-8">
            <button
              onClick={() => toggleTab('login')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                tab === 'login'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => toggleTab('signup')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                tab === 'signup'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Create Account
            </button>
          </div>

          <h2 className="text-xl font-extrabold text-zinc-100 mb-1">
            {tab === 'login' ? 'Welcome back' : 'Join ReadyCollaborate'}
          </h2>
          <p className="text-zinc-500 text-[11px] mb-6">
            {tab === 'login'
              ? 'Enter your credentials to enter the workspace.'
              : 'Create a free account and start collaborating in real-time.'}
          </p>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-[11px] mb-6 animate-pulse">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Username</label>
                <div className="relative border-glow-hover">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-600">
                    <User size={14} />
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="john_doe"
                    className="w-full bg-[#030408]/60 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500/50 transition font-medium"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Email Address</label>
              <div className="relative border-glow-hover">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-600">
                  <Mail size={14} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#030408]/60 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500/50 transition font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Password</label>
              <div className="relative border-glow-hover">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-600">
                  <Lock size={14} />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#030408]/60 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500/50 transition font-medium"
                />
              </div>
            </div>

            {tab === 'signup' && (
              <div className="space-y-2 pt-1">
                <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 block">Workspace Profile Icon</label>
                <div className="grid grid-cols-3 gap-2">
                  {AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setAvatar(av.id)}
                      className={`py-2 rounded-xl text-[10px] font-bold border text-center transition flex items-center justify-center gap-1.5 ${
                        avatar === av.id
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 shadow-md'
                          : 'border-white/[0.04] bg-[#030408]/40 text-zinc-500 hover:bg-[#030408]/60 hover:text-zinc-300'
                      }`}
                    >
                      <span className="text-xs">{av.emoji}</span>
                      <span>{av.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/10 text-xs flex items-center justify-center gap-2 pt-3"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin text-white" /> Loading...
                </>
              ) : tab === 'login' ? (
                'Log In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Link */}
          {tab === 'login' && (
            <div className="mt-8 pt-5 border-t border-white/[0.05] text-center">
              <span className="text-[9px] text-zinc-600 block uppercase tracking-widest font-bold mb-2">Want a quick walkthrough?</span>
              <button
                type="button"
                onClick={() => {
                  setEmail('test@readycollaborate.com');
                  setPassword('password123');
                }}
                className="text-[11px] text-indigo-400 font-bold hover:text-indigo-300 transition"
              >
                Auto-fill Test Account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
