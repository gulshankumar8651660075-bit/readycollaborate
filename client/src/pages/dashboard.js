import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { apiFetch } from '../utils/api';
import { 
  Plus, LogOut, FileText, Clipboard, Activity, 
  Users, Layers, ArrowRight, Loader, Clock, UserCheck, Trash2
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  
  // App states
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
      // Redirect to the newly created workspace
      router.push(`/workspace/${doc.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create document');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteDocument = async (docId, e) => {
    e.stopPropagation(); // Avoid triggering route link
    e.preventDefault();
    
    if (!confirm('Are you sure you want to delete this document? This cannot be undone.')) {
      return;
    }

    try {
      await apiFetch(`/documents/${docId}`, {
        method: 'DELETE'
      });
      // Refresh
      fetchDashboardData();
    } catch (err) {
      alert(err.message || 'Failed to delete document');
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
      <div className="min-h-screen flex items-center justify-center bg-workspace-900">
        <Loader className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-workspace-900 grid-bg pb-12">
      {/* Header */}
      <header className="sticky top-0 z-40 glass w-full border-b border-white/5 py-4 px-6 mb-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 text-white">
              <Layers size={18} />
            </div>
            <span className="font-extrabold tracking-tight text-white">ReadyCollaborate</span>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2.5 bg-workspace-800/80 px-3 py-1.5 rounded-xl border border-white/5">
                <span className="text-sm">{getAvatarEmoji(user.avatar)}</span>
                <span className="text-xs font-semibold text-slate-200">{user.username}</span>
                <span 
                  className="w-2.5 h-2.5 rounded-full border border-workspace-900"
                  style={{ backgroundColor: user.color }}
                />
              </div>
            )}
            <button 
              onClick={handleLogout}
              className="p-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-rose-400 transition"
              title="Log Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6">
        {/* Title bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Collaborative Dashboard</h1>
            <p className="text-slate-400 text-xs mt-1">Manage documents, view activity logs, and launch workspaces.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/10 flex items-center gap-2 shrink-0"
          >
            <Plus size={16} /> Create Workspace
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-5 rounded-2xl">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Documents</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{stats.totalDocs}</span>
              <FileText size={16} className="text-indigo-400" />
            </div>
          </div>
          <div className="glass-card p-5 rounded-2xl">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Total Tasks</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{stats.totalTasks}</span>
              <Clipboard size={16} className="text-cyan-400" />
            </div>
          </div>
          <div className="glass-card p-5 rounded-2xl">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">In Progress</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{stats.inProgressTasks}</span>
              <Activity size={16} className="text-amber-400 animate-pulse-slow" />
            </div>
          </div>
          <div className="glass-card p-5 rounded-2xl">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Total Members</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{allUsers.length}</span>
              <Users size={16} className="text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Workspaces list */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <FileText size={18} className="text-indigo-400" />
              Active Workspaces
            </h3>

            {documents.length === 0 ? (
              <div className="glass-card p-8 text-center rounded-2xl text-slate-400">
                <FileText size={48} className="mx-auto text-slate-600 mb-3" />
                <p className="text-sm font-semibold">No workspaces found</p>
                <p className="text-xs text-slate-500 mt-1">Create your first collaborative document workspace to get started.</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-4 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/20 rounded-xl text-xs font-semibold transition"
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
                    className="block glass-card p-4 rounded-xl glass-card-hover border border-white/5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-workspace-900 border border-white/10 text-indigo-400">
                          <FileText size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-200 text-sm group-hover:text-white transition">{doc.title}</h4>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                            <span>Owner: {doc.owner?.username}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock size={10} /> {new Date(doc.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {user && doc.ownerId === user.id && (
                          <button
                            onClick={(e) => handleDeleteDocument(doc.id, e)}
                            className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Delete Workspace"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                        <span className="text-xs text-slate-400 flex items-center gap-1 group-hover:text-white bg-workspace-900/60 px-3 py-1.5 rounded-lg border border-white/5 font-semibold">
                          Enter <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Activity Logs */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Activity size={18} className="text-emerald-400 animate-pulse-slow" />
              Live Workspace Activity
            </h3>

            <div className="glass-card rounded-2xl p-5 max-h-[450px] overflow-y-auto border border-white/5 space-y-4">
              {activities.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No recent workspace actions logged.</p>
              ) : (
                <div className="space-y-4 relative before:absolute before:top-1 before:bottom-1 before:left-3.5 before:w-[1px] before:bg-white/5">
                  {activities.map((act) => (
                    <div key={act.id} className="flex gap-3 text-xs relative">
                      <div 
                        className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center border border-white/10 z-10 bg-workspace-800 font-mono text-[10px]"
                        style={{ borderColor: act.user?.color || '#333' }}
                      >
                        {getAvatarEmoji(act.user?.avatar)}
                      </div>
                      <div className="pt-0.5">
                        <p className="text-slate-300 font-medium leading-relaxed">
                          {act.details}
                        </p>
                        <span className="text-[9px] text-slate-500 block mt-0.5">
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

      {/* Workspace Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md glass-card rounded-2xl border-white/10 shadow-2xl p-6 relative">
            <h3 className="text-xl font-bold text-white mb-2">Create New Collaborative Workspace</h3>
            <p className="text-slate-400 text-xs mb-6">Create a document editor workspace. You and other members can edit, manage tasks, and draw on a shared canvas.</p>

            <form onSubmit={handleCreateDocument} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Document / Project Title</label>
                <input
                  type="text"
                  required
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="e.g., Q3 Project Proposal"
                  className="w-full bg-workspace-900 border border-white/10 rounded-xl py-3 px-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 transition"
                  disabled={createLoading}
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl hover:bg-white/5 border border-transparent text-slate-400 hover:text-white transition text-xs font-semibold"
                  disabled={createLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/10"
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
