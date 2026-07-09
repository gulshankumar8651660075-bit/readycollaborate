import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { apiFetch } from '../utils/api';
import { 
  Plus, LogOut, FileText, Clipboard, Activity, 
  Users, Layers, ArrowRight, Loader, Clock, Trash2, ShieldAlert
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  
  // States
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalDocs: 0,
    totalTasks: 0,
    todoTasks: 0,
    inProgressTasks: 0,
    doneTasks: 0
  });
  const [documents, setDocuments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (!token || !savedUser) {
      router.push('/auth');
      return;
    }

    setUser(JSON.parse(savedUser));
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/dashboard/stats');
      setStats(data.stats);
      setDocuments(data.recentDocs || []);
      setActivities(data.recentActivities || []);
      setAllUsers(data.users || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Could not fetch server statistics.');
      if (err.message === 'Token is not valid' || err.message === 'No token provided, authorization denied') {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async (e) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;

    setCreateLoading(true);
    try {
      const doc = await apiFetch('/documents', {
        method: 'POST',
        body: JSON.stringify({ title: newDocTitle })
      });
      setNewDocTitle('');
      setShowModal(false);
      router.push(`/workspace/${doc.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create document');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteDocument = async (docId, e) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!confirm('Are you sure you want to delete this workspace? All contents, tasks, and drawings will be deleted.')) {
      return;
    }

    try {
      await apiFetch(`/documents/${docId}`, {
        method: 'DELETE'
      });
      fetchDashboardData();
    } catch (err) {
      alert(err.message || 'Failed to delete workspace');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth');
  };

  const getAvatarEmoji = (avId) => {
    const map = {
      dev_m: '👨‍💻',
      dev_f: '👩‍💻',
      fox: '🦊',
      cat: '🐱',
      panda: '🐼',
      unicorn: '🦄'
    };
    return map[avId] || '👤';
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030408]">
        <Loader className="animate-spin text-indigo-500" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030408] saas-grid pb-16">
      
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-[#030408]/60 backdrop-blur-md w-full border-b border-white/[0.04] py-4.5 px-6 mb-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 text-white">
              <Layers size={16} />
            </div>
            <span className="font-extrabold tracking-tight text-white text-sm">ReadyCollaborate</span>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2 bg-[#0d0f17]/90 px-3 py-1.5 rounded-xl border border-white/[0.05] shadow-inner">
                <span className="text-xs">{getAvatarEmoji(user.avatar)}</span>
                <span className="text-[10px] font-bold text-zinc-300">{user.username}</span>
                <span 
                  className="w-2 h-2 rounded-full border border-[#030408]"
                  style={{ backgroundColor: user.color }}
                />
              </div>
            )}
            <button 
              onClick={handleLogout}
              className="p-2.5 rounded-xl hover:bg-white/[0.03] text-zinc-500 hover:text-rose-400 border border-transparent hover:border-white/[0.05] transition"
              title="Log Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6">
        
        {/* Title / Action bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Workspace Hub</h1>
            <p className="text-zinc-500 text-[11px] mt-0.5">Create workspaces, launch real-time document sync, and manage tasks.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/10 flex items-center gap-1.5 shrink-0"
          >
            <Plus size={14} /> New Workspace
          </button>
        </div>

        {/* Status Widgets Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <div className="saas-card p-5 rounded-2xl border-white/[0.04]">
            <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 block mb-1">Workspaces</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-white leading-none">{stats.totalDocs}</span>
              <FileText size={14} className="text-indigo-400" />
            </div>
          </div>
          <div className="saas-card p-5 rounded-2xl border-white/[0.04]">
            <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 block mb-1">Task Cards</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-white leading-none">{stats.totalTasks}</span>
              <Clipboard size={14} className="text-cyan-400" />
            </div>
          </div>
          <div className="saas-card p-5 rounded-2xl border-white/[0.04]">
            <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 block mb-1">In Progress</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-white leading-none">{stats.inProgressTasks}</span>
              <Activity size={14} className="text-amber-400 animate-pulse" />
            </div>
          </div>
          <div className="saas-card p-5 rounded-2xl border-white/[0.04]">
            <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 block mb-1">Total Members</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-white leading-none">{allUsers.length}</span>
              <Users size={14} className="text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Workspaces list */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
              <FileText size={15} className="text-indigo-400" />
              Active Workspaces
            </h3>

            {documents.length === 0 ? (
              <div className="saas-card p-10 text-center rounded-2xl border-white/[0.04] text-zinc-500">
                <FileText size={36} className="mx-auto text-zinc-700 mb-3" />
                <p className="text-xs font-bold text-zinc-400">No active workspaces</p>
                <p className="text-[10px] text-zinc-600 mt-1">Deploy a new shared canvas to start working with your team.</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-4 px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-bold transition"
                >
                  Create Workspace
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <Link 
                    key={doc.id} 
                    href={`/workspace/${doc.id}`}
                    className="block saas-card p-4 rounded-xl saas-card-hover border-white/[0.04]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-[#030408]/60 border border-white/5 text-indigo-400">
                          <FileText size={16} />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-zinc-200 text-xs">{doc.title}</h4>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500">
                            <span>Owner: {doc.owner?.username}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock size={10} /> {new Date(doc.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        {user && doc.ownerId === user.id && (
                          <button
                            onClick={(e) => handleDeleteDocument(doc.id, e)}
                            className="p-2 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Delete Workspace"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                        <span className="text-[10px] text-zinc-400 flex items-center gap-1 bg-[#030408]/60 px-3 py-1.5 rounded-lg border border-white/5 font-bold">
                          Enter Workspace <ArrowRight size={11} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Timeline Feed */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
              <Activity size={15} className="text-emerald-400" />
              Timeline Logs
            </h3>

            <div className="saas-card rounded-2xl p-5 max-h-[420px] overflow-y-auto border-white/[0.04] space-y-4">
              {activities.length === 0 ? (
                <p className="text-[10px] text-zinc-600 text-center py-6">No recent actions logged.</p>
              ) : (
                <div className="space-y-4 relative before:absolute before:top-1 before:bottom-1 before:left-3.5 before:w-[1px] before:bg-white/[0.04]">
                  {activities.map((act) => (
                    <div key={act.id} className="flex gap-3 text-[11px] relative">
                      <div 
                        className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center border border-white/10 z-10 bg-[#0d0f17] font-mono text-xs shadow"
                        style={{ borderColor: act.user?.color || '#333' }}
                      >
                        {getAvatarEmoji(act.user?.avatar)}
                      </div>
                      <div className="pt-0.5">
                        <p className="text-zinc-300 font-medium leading-relaxed">
                          {act.details}
                        </p>
                        <span className="text-[9px] text-zinc-500 block mt-0.5 font-semibold">
                          {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-md saas-card rounded-2xl border-white/[0.08] shadow-2xl p-6 relative">
            <h3 className="text-base font-extrabold text-white mb-1">Create Workspace</h3>
            <p className="text-zinc-500 text-[11px] mb-6">Create a document editor workspace. You and other members can edit, manage tasks, and draw on a shared canvas.</p>

            <form onSubmit={handleCreateDocument} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Workspace / Project Title</label>
                <input
                  type="text"
                  required
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="e.g. Q4 Growth Roadmap"
                  className="w-full bg-[#030408]/60 border border-white/10 rounded-xl py-3 px-4 text-xs text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500/50 transition font-medium"
                  disabled={createLoading}
                />
              </div>

              <div className="flex gap-2.5 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl hover:bg-white/[0.03] text-zinc-400 hover:text-white transition text-xs font-bold"
                  disabled={createLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/10"
                  disabled={createLoading}
                >
                  {createLoading ? (
                    <>
                      <Loader size={12} className="animate-spin" /> Creating...
                    </>
                  ) : (
                    'Create Workspace'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
