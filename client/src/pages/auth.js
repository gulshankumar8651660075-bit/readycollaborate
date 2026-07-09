import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { apiFetch } from '../utils/api';
import { Layers, Mail, Lock, User, AlertCircle, Loader } from 'lucide-react';

const AVATARS = [
  { id: 'dev_m', label: '👨‍💻 Dev Boy' },
  { id: 'dev_f', label: '👩‍💻 Dev Girl' },
  { id: 'fox', label: '🦊 Clever Fox' },
  { id: 'cat', label: '🐱 Chill Cat' },
  { id: 'panda', label: '🐼 Lazy Panda' },
  { id: 'unicorn', label: '🦄 Magic Horse' }
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
    // If routing has tab parameter, respect it
    if (router.query.tab === 'signup') {
      setTab('signup');
    } else if (router.query.tab === 'login') {
      setTab('login');
    }
  }, [router.query.tab]);

  // Clear error on tab toggle
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
    <div className="min-h-screen flex items-center justify-center bg-workspace-900 grid-bg relative px-4">
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 text-white shadow-lg shadow-indigo-500/25">
              <Layers size={20} />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              ReadyCollaborate
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl overflow-hidden shadow-2xl p-8 border-white/10">
          {/* Header Tab Toggles */}
          <div className="flex items-center bg-workspace-900/60 p-1.5 rounded-xl border border-white/5 mb-8">
            <button
              onClick={() => toggleTab('login')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                tab === 'login'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => toggleTab('signup')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                tab === 'signup'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          <h2 className="text-2xl font-bold text-slate-100 mb-2">
            {tab === 'login' ? 'Welcome Back!' : 'Get Started'}
          </h2>
          <p className="text-slate-400 text-xs mb-6">
            {tab === 'login'
              ? 'Enter your credentials to continue collaborating.'
              : 'Create a free account and start collaborating in real-time.'}
          </p>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3.5 rounded-xl text-xs mb-6">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Username</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="john_doe"
                    className="w-full bg-workspace-900/60 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 transition"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-workspace-900/60 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-workspace-900/60 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 transition"
                />
              </div>
            </div>

            {tab === 'signup' && (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-slate-300 block">Choose Workspace Avatar</label>
                <div className="grid grid-cols-3 gap-2">
                  {AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setAvatar(av.id)}
                      className={`py-2 rounded-lg text-xs font-semibold border text-center transition flex items-center justify-center ${
                        avatar === av.id
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                          : 'border-white/5 bg-workspace-900/40 text-slate-400 hover:bg-workspace-900/60'
                      }`}
                    >
                      {av.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold hover:opacity-95 transition shadow-lg shadow-indigo-600/10 text-sm flex items-center justify-center gap-2 pt-4"
            >
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin" /> Processing...
                </>
              ) : tab === 'login' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Footer */}
          {tab === 'login' && (
            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <span className="text-[10px] text-slate-500 block uppercase tracking-wider mb-2">Need a quick test?</span>
              <button
                type="button"
                onClick={() => {
                  setEmail('test@readycollaborate.com');
                  setPassword('password123');
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline transition"
              >
                Auto-fill Demo Credentials
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
