import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSocket } from '../../hooks/useSocket';
import { apiFetch, getApiUrl } from '../../utils/api';
import { 
  ArrowLeft, FileText, Clipboard, MessageSquare, 
  Send, Edit2, ChevronRight, Plus, Eye, EyeOff,
  Download, Palette, Trash2, ShieldAlert, Sparkles, RefreshCw, X, Play, LayoutGrid
} from 'lucide-react';

export default function Workspace() {
  const router = useRouter();
  const { id: roomId } = router.query;

  // States
  const [user, setUser] = useState(null);
  const [document, setDocument] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState('editor'); // editor, kanban, whiteboard
  
  // Editor States
  const [docContent, setDocContent] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [remoteCursors, setRemoteCursors] = useState({});
  const [showPreview, setShowPreview] = useState(true); // Markdown side-by-side toggle
  
  // Kanban States
  const [tasks, setTasks] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState('TODO');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM'); // LOW, MEDIUM, HIGH

  // Whiteboard States
  const [brushColor, setBrushColor] = useState('#EF4444');
  const [brushSize, setBrushSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);

  // References
  const textEditorRef = useRef(null);
  const canvasRef = useRef(null);
  const drawingContextRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (!token || !savedUser) {
      router.push('/auth');
      return;
    }

    setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (!roomId) return;
    fetchDocumentDetails();
    fetchTasks();
  }, [roomId]);

  const fetchDocumentDetails = async () => {
    try {
      const doc = await apiFetch(`/documents/${roomId}`);
      setDocument(doc);
      setDocContent(doc.content);
      setDocTitle(doc.title);
      setChatMessages(doc.chats || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasks = async () => {
    try {
      const data = await apiFetch('/tasks');
      setTasks(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Sockets Config
  const socket = useSocket(roomId, user, {
    'workspace-users': (users) => {
      setActiveUsers(users);
    },
    'document-update': ({ text, version }) => {
      setDocContent(text);
      if (document) {
        setDocument(prev => ({ ...prev, version }));
      }
    },
    'document-title-update': ({ title }) => {
      setDocTitle(title);
    },
    'cursor-update': ({ socketId, user: cursorUser, cursor }) => {
      setRemoteCursors(prev => {
        if (!cursor) {
          const updated = { ...prev };
          delete updated[socketId];
          return updated;
        }
        return { ...prev, [socketId]: { user: cursorUser, cursor } };
      });
    },
    'task-created-update': (task) => {
      setTasks(prev => [...prev, task]);
    },
    'task-moved-update': ({ taskId, status, order, taskList }) => {
      if (taskList) {
        setTasks(taskList);
      } else {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status, order } : t));
      }
    },
    'task-updated-update': (updatedTask) => {
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    },
    'task-deleted-update': (taskId) => {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    },
    'draw-line-update': (line) => {
      drawOnCanvas(line.x1, line.y1, line.x2, line.y2, line.color, line.size);
    },
    'clear-whiteboard-update': () => {
      clearLocalCanvas();
    },
    'receive-message': (msg) => {
      setChatMessages(prev => [...prev, msg]);
    }
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleEditorCursorChange = () => {
    if (!socket || !textEditorRef.current) return;
    const textarea = textEditorRef.current;
    socket.emit('cursor-move', {
      roomId,
      cursor: {
        selectionStart: textarea.selectionStart,
        selectionEnd: textarea.selectionEnd
      }
    });
  };

  const handleDocContentChange = (e) => {
    const text = e.target.value;
    setDocContent(text);

    if (socket) {
      socket.emit('document-change', {
        roomId,
        text,
        version: document ? document.version + 1 : 1,
        username: user?.username
      });
    }
  };

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (!docTitle.trim() || docTitle === document?.title) return;

    if (socket) {
      socket.emit('document-title-change', {
        roomId,
        title: docTitle,
        username: user?.username
      });
    }
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket) return;

    socket.emit('send-message', {
      roomId,
      text: chatInput
    });
    setChatInput('');
  };

  // ==================== KANBAN ACTIONS ====================
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const task = await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: newTaskTitle,
          description: `${newTaskPriority} priority - ${newTaskDesc}`, // Save priority tag in description
          status: newTaskStatus
        })
      });

      setNewTaskTitle('');
      setNewTaskDesc('');
      setShowTaskModal(false);

      if (socket) {
        socket.emit('task-created', { roomId, task });
      }
      setTasks(prev => [...prev, task]);
    } catch (err) {
      console.error(err);
    }
  };

  const moveTaskColumn = async (taskId, newStatus) => {
    const affectedTasks = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
    setTasks(affectedTasks);

    if (socket) {
      socket.emit('task-moved', {
        roomId,
        taskId,
        status: newStatus,
        order: 0,
        taskList: affectedTasks
      });
    }

    try {
      await apiFetch(`/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this card?')) return;

    try {
      await apiFetch(`/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (socket) {
        socket.emit('task-deleted', { roomId, taskId });
      }
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      console.error(err);
    }
  };

  // ==================== CANVAS ACTIONS ====================
  useEffect(() => {
    if (activeTab !== 'whiteboard' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 550;

    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.lineJoin = 'round';
    drawingContextRef.current = context;
  }, [activeTab]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    drawingContextRef.current.beginPath();
    drawingContextRef.current.moveTo(x, y);
    canvas.lastX = x;
    canvas.lastY = y;
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const x1 = canvas.lastX;
    const y1 = canvas.lastY;

    drawOnCanvas(x1, y1, x, y, brushColor, brushSize);

    if (socket) {
      socket.emit('draw-line', {
        roomId,
        line: { x1, y1, x2: x, y2: y, color: brushColor, size: brushSize }
      });
    }
    canvas.lastX = x;
    canvas.lastY = y;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const drawOnCanvas = (x1, y1, x2, y2, color, size) => {
    const ctx = drawingContextRef.current;
    if (!ctx) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  const clearLocalCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleClearWhiteboard = () => {
    clearLocalCanvas();
    if (socket) {
      socket.emit('clear-whiteboard', { roomId });
    }
  };

  const handleExportDoc = () => {
    const blob = new Blob([docContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `${docTitle.toLowerCase().replace(/\s+/g, '_')}.md`;
    link.click();
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

  // Simple Markdown Parsing logic for live preview
  const parseMarkdown = (markdown) => {
    if (!markdown) return <p className="text-zinc-600 text-xs italic">Empty preview</p>;
    return markdown.split('\n').map((line, idx) => {
      if (line.startsWith('# ')) {
        return <h1 key={idx} className="text-lg font-black text-white border-b border-white/5 pb-2 mb-3 mt-4">{line.replace('# ', '')}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-sm font-extrabold text-indigo-400 mt-3 mb-2">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={idx} className="text-zinc-300 ml-4 list-disc text-xs leading-loose">{line.substring(2)}</li>;
      }
      if (line.startsWith('> ')) {
        return <blockquote key={idx} className="border-l-2 border-indigo-500 pl-3 py-1 my-2 bg-indigo-500/5 text-xs text-zinc-400 rounded">{line.substring(2)}</blockquote>;
      }
      return <p key={idx} className="text-zinc-400 text-xs leading-relaxed my-1">{line}</p>;
    });
  };

  // Helper to extract priority/description from tasks
  const renderTaskInfo = (task) => {
    let priority = 'MEDIUM';
    let cleanDesc = task.description || '';

    if (cleanDesc.startsWith('HIGH priority - ')) {
      priority = 'HIGH';
      cleanDesc = cleanDesc.replace('HIGH priority - ', '');
    } else if (cleanDesc.startsWith('LOW priority - ')) {
      priority = 'LOW';
      cleanDesc = cleanDesc.replace('LOW priority - ', '');
    } else if (cleanDesc.startsWith('MEDIUM priority - ')) {
      priority = 'MEDIUM';
      cleanDesc = cleanDesc.replace('MEDIUM priority - ', '');
    }

    return { priority, cleanDesc };
  };

  return (
    <div className="min-h-screen bg-[#030408] flex flex-col h-screen overflow-hidden">
      
      {/* Header toolbar */}
      <header className="bg-[#0c0d14]/70 backdrop-blur-md w-full border-b border-white/[0.04] py-3.5 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4 max-w-lg">
          <Link href="/dashboard" className="p-2.5 rounded-xl hover:bg-white/[0.03] text-zinc-400 hover:text-white border border-transparent hover:border-white/5 transition">
            <ArrowLeft size={14} />
          </Link>
          
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileText size={14} />
            </div>

            {isEditingTitle ? (
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                autoFocus
                className="bg-[#030408] border border-indigo-500/40 rounded-xl px-3 py-1 text-xs font-bold text-white focus:outline-none"
              />
            ) : (
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingTitle(true)}>
                <span className="font-extrabold text-xs text-zinc-200 group-hover:text-white tracking-tight">{docTitle || 'Loading...'}</span>
                <Edit2 size={10} className="text-zinc-600 opacity-0 group-hover:opacity-100 transition" />
              </div>
            )}
          </div>
        </div>

        {/* Presence bar */}
        <div className="flex items-center gap-3">
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider hidden sm:inline">Active Collaborators:</span>
          <div className="flex -space-x-1.5">
            {activeUsers.map((u, i) => (
              <div 
                key={i} 
                className="w-7 h-7 rounded-full bg-[#0d0f17] border-2 flex items-center justify-center text-xs relative cursor-help shadow-lg"
                style={{ borderColor: u.color }}
                title={`${u.username} (Online)`}
              >
                <span>{getAvatarEmoji(u.avatar)}</span>
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-[#030408]" />
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Nav Dock */}
        <aside className="w-16 bg-[#0c0d14]/70 border-r border-white/[0.04] flex flex-col items-center py-6 gap-6 shrink-0">
          <button 
            onClick={() => setActiveTab('editor')}
            className={`p-3 rounded-xl transition ${
              activeTab === 'editor' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
            }`}
            title="Markdown Editor"
          >
            <FileText size={18} />
          </button>
          
          <button 
            onClick={() => setActiveTab('kanban')}
            className={`p-3 rounded-xl transition ${
              activeTab === 'kanban' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
            }`}
            title="Linear Work Board"
          >
            <Clipboard size={18} />
          </button>
          
          <button 
            onClick={() => setActiveTab('whiteboard')}
            className={`p-3 rounded-xl transition ${
              activeTab === 'whiteboard' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
            }`}
            title="Shared Whiteboard"
          >
            <Palette size={18} />
          </button>
        </aside>

        {/* Workspace Canvas / Center Area */}
        <main className="flex-1 p-6 overflow-y-auto bg-[#030408] flex flex-col relative">
          
          {/* TAB 1: MARKDOWN EDITOR + LIVE PREVIEW */}
          {activeTab === 'editor' && (
            <div className="flex-1 flex flex-col w-full h-full max-w-6xl mx-auto">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Markdown Split Workspace</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="px-3.5 py-1.5 bg-[#0d0f17]/90 hover:bg-[#11131e] text-zinc-400 hover:text-white rounded-xl border border-white/5 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    {showPreview ? <EyeOff size={12} /> : <Eye size={12} />}
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </button>
                  <button
                    onClick={handleExportDoc}
                    className="px-3.5 py-1.5 bg-[#0d0f17]/90 hover:bg-[#11131e] text-zinc-400 hover:text-white rounded-xl border border-white/5 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Download size={12} /> Export MD
                  </button>
                </div>
              </div>

              {/* Redesigned Paper Sheet Editor */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[400px] overflow-hidden">
                {/* Text area Pane */}
                <div className="saas-card rounded-2xl border-white/[0.08] shadow-2xl p-5 relative flex flex-col h-full bg-[#0d0f17]/60">
                  <div className="flex items-center justify-between border-b border-white/[0.04] pb-2.5 mb-3 text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider">
                    <span>editor.md</span>
                    <span className="text-indigo-400">writing mode</span>
                  </div>
                  <textarea
                    ref={textEditorRef}
                    value={docContent}
                    onChange={handleDocContentChange}
                    onKeyUp={handleEditorCursorChange}
                    onSelect={handleEditorCursorChange}
                    onClick={handleEditorCursorChange}
                    placeholder="# Write your project structure..."
                    className="flex-1 w-full bg-transparent resize-none text-zinc-200 placeholder:text-zinc-800 focus:outline-none text-[11px] font-mono leading-relaxed overflow-y-auto"
                  />
                </div>

                {/* Live Preview Pane */}
                {showPreview && (
                  <div className="saas-card rounded-2xl border-white/[0.08] shadow-2xl p-5 relative flex flex-col h-full bg-[#0d0f17]/40">
                    <div className="flex items-center justify-between border-b border-white/[0.04] pb-2.5 mb-3 text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider">
                      <span>live_preview.html</span>
                      <span className="text-emerald-400 animate-pulse">compiled render</span>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2">
                      {parseMarkdown(docContent)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: KANBAN BOARD */}
          {activeTab === 'kanban' && (
            <div className="flex-1 flex flex-col h-full">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                  <h3 className="text-base font-extrabold text-white">Linear Kanban Board</h3>
                  <p className="text-zinc-500 text-[11px] mt-0.5">Drag-and-drop statuses and coordinate task tickets with the team.</p>
                </div>
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/10"
                >
                  <Plus size={14} /> Add Task
                </button>
              </div>

              {/* Columns Container */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 items-start overflow-y-auto">
                
                {/* Column 1: TODO */}
                <div className="saas-card rounded-2xl p-4 flex flex-col gap-4 border-white/[0.04]">
                  <div className="flex justify-between items-center border-b border-white/[0.05] pb-2">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">To Do</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#030408] text-zinc-500 text-[10px] font-bold">
                      {tasks.filter(t => t.status === 'TODO').length}
                    </span>
                  </div>
                  <div className="space-y-3 min-h-[300px]">
                    {tasks.filter(t => t.status === 'TODO').map(task => {
                      const { priority, cleanDesc } = renderTaskInfo(task);
                      return (
                        <div key={task.id} className="saas-card p-4 rounded-xl border-white/[0.04] bg-[#0d0f17]/40 flex flex-col gap-3 group relative hover:border-indigo-500/30 transition shadow-lg">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full ${
                                priority === 'HIGH' ? 'bg-rose-500/10 text-rose-400' :
                                priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400' :
                                'bg-sky-500/10 text-sky-400'
                              }`}>
                                {priority}
                              </span>
                            </div>
                            <h4 className="font-extrabold text-zinc-200 text-[11px]">{task.title}</h4>
                            <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">{cleanDesc || 'No details.'}</p>
                          </div>
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/[0.05]">
                            <span className="text-[9px] text-zinc-600 font-bold font-mono uppercase">Ticket</span>
                            <div className="flex gap-1.5">
                              <button onClick={() => moveTaskColumn(task.id, 'IN_PROGRESS')} className="p-1.5 rounded-lg bg-[#030408] text-zinc-500 hover:text-white border border-white/[0.05] transition" title="Start Task">
                                <ChevronRight size={10} />
                              </button>
                              <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 rounded-lg bg-[#030408] text-zinc-500 hover:text-rose-400 border border-white/[0.05] transition" title="Delete">
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Column 2: IN PROGRESS */}
                <div className="saas-card rounded-2xl p-4 flex flex-col gap-4 border-white/[0.04]">
                  <div className="flex justify-between items-center border-b border-white/[0.05] pb-2">
                    <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">In Progress</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#030408] text-amber-400 text-[10px] font-bold">
                      {tasks.filter(t => t.status === 'IN_PROGRESS').length}
                    </span>
                  </div>
                  <div className="space-y-3 min-h-[300px]">
                    {tasks.filter(t => t.status === 'IN_PROGRESS').map(task => {
                      const { priority, cleanDesc } = renderTaskInfo(task);
                      return (
                        <div key={task.id} className="saas-card p-4 rounded-xl border-white/[0.04] bg-[#0d0f17]/40 flex flex-col gap-3 group relative hover:border-indigo-500/30 transition shadow-lg">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full ${
                                priority === 'HIGH' ? 'bg-rose-500/10 text-rose-400' :
                                priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400' :
                                'bg-sky-500/10 text-sky-400'
                              }`}>
                                {priority}
                              </span>
                            </div>
                            <h4 className="font-extrabold text-zinc-200 text-[11px]">{task.title}</h4>
                            <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">{cleanDesc || 'No details.'}</p>
                          </div>
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/[0.05]">
                            <span className="text-[9px] text-amber-400/70 font-bold font-mono uppercase animate-pulse">Running</span>
                            <div className="flex gap-1.5">
                              <button onClick={() => moveTaskColumn(task.id, 'DONE')} className="p-1.5 rounded-lg bg-[#030408] text-zinc-500 hover:text-white border border-white/[0.05] transition" title="Complete Task">
                                <ChevronRight size={10} />
                              </button>
                              <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 rounded-lg bg-[#030408] text-zinc-500 hover:text-rose-400 border border-white/[0.05] transition" title="Delete">
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Column 3: DONE */}
                <div className="saas-card rounded-2xl p-4 flex flex-col gap-4 border-white/[0.04]">
                  <div className="flex justify-between items-center border-b border-white/[0.05] pb-2">
                    <span className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider">Completed</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#030408] text-emerald-400 text-[10px] font-bold">
                      {tasks.filter(t => t.status === 'DONE').length}
                    </span>
                  </div>
                  <div className="space-y-3 min-h-[300px]">
                    {tasks.filter(t => t.status === 'DONE').map(task => {
                      const { priority, cleanDesc } = renderTaskInfo(task);
                      return (
                        <div key={task.id} className="saas-card p-4 rounded-xl border-white/[0.04] bg-[#0d0f17]/20 flex flex-col gap-3 group relative hover:border-indigo-500/30 transition opacity-60">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                                DONE
                              </span>
                            </div>
                            <h4 className="font-extrabold text-zinc-400 text-[11px] line-through">{task.title}</h4>
                            <p className="text-[10px] text-zinc-600 mt-1 leading-relaxed">{cleanDesc}</p>
                          </div>
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/[0.05]">
                            <span className="text-[9px] text-emerald-400 font-bold font-mono uppercase">Completed</span>
                            <div className="flex gap-1.5">
                              <button onClick={() => moveTaskColumn(task.id, 'TODO')} className="p-1.5 rounded-lg bg-[#030408] text-zinc-500 hover:text-white border border-white/[0.05] transition" title="Reopen Task">
                                <ArrowLeft size={10} />
                              </button>
                              <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 rounded-lg bg-[#030408] text-zinc-500 hover:text-rose-400 border border-white/[0.05] transition" title="Delete">
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: WHITEBOARD */}
          {activeTab === 'whiteboard' && (
            <div className="flex-1 flex flex-col h-full">
              
              {/* Circular Floating Toolbar */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-[#0d0f17]/95 border border-white/[0.05] rounded-2xl px-5 py-3.5 mb-6 shadow-xl shrink-0">
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">Canvas Board</h3>
                  <p className="text-zinc-500 text-[10px]">Real-time shared vector canvas.</p>
                </div>
                <div className="flex items-center gap-4">
                  {/* Colors selector */}
                  <div className="flex gap-1.5">
                    {['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#FFFFFF'].map(c => (
                      <button
                        key={c}
                        onClick={() => setBrushColor(c)}
                        className={`w-5 h-5 rounded-full border-2 transition ${brushColor === c ? 'scale-110 border-white' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  {/* Size slider */}
                  <input
                    type="range"
                    min="2"
                    max="15"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-16 accent-indigo-500"
                    title="Brush Width"
                  />
                  <button
                    onClick={handleClearWhiteboard}
                    className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-[10px] font-bold transition"
                  >
                    Clear Canvas
                  </button>
                </div>
              </div>

              {/* Canvas viewport */}
              <div className="flex-1 bg-[#090a0f] rounded-2xl border border-white/[0.04] relative overflow-hidden min-h-[400px]">
                {/* SVG aligned background grid lines */}
                <div className="absolute inset-0 saas-grid pointer-events-none opacity-20" />
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full h-full cursor-crosshair block relative z-10"
                />
              </div>
            </div>
          )}

        </main>

        {/* Right Sidebar: Chat Widget */}
        <aside className="w-80 bg-[#0c0d14]/70 border-l border-white/[0.04] flex flex-col h-full shrink-0">
          <div className="p-4 border-b border-white/[0.04] flex items-center gap-2">
            <MessageSquare size={14} className="text-indigo-400" />
            <h3 className="font-extrabold text-xs text-zinc-300 uppercase tracking-widest">Workspace Chat</h3>
          </div>

          {/* Message timeline list */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col">
            {chatMessages.length === 0 ? (
              <p className="text-[9px] text-zinc-600 text-center my-auto">Start the conversation! Type below.</p>
            ) : (
              chatMessages.map((msg, index) => {
                const isMe = user && msg.userId === user.id;
                return (
                  <div key={index} className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start'}`}>
                    <div className="flex items-center gap-1.5 mb-1 text-[9px] text-zinc-500 font-semibold">
                      {!isMe && <span>{getAvatarEmoji(msg.user?.avatar)}</span>}
                      <span>{msg.user?.username || 'Member'}</span>
                    </div>
                    <div 
                      className={`px-3 py-2 rounded-2xl text-[11px] leading-relaxed break-words shadow-md ${
                        isMe 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-[#0d0f17]/95 text-zinc-200 border border-white/[0.05] rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Chat Form */}
          <form onSubmit={handleSendChat} className="p-4 border-t border-white/[0.04] flex gap-2 shrink-0 bg-[#0c0d14]/40">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Message your collaborators..."
              className="flex-1 bg-[#030408]/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500/50"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/10"
            >
              <Send size={12} />
            </button>
          </form>
        </aside>

      </div>

      {/* Task Creation Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-md saas-card rounded-2xl border-white/[0.08] shadow-2xl p-6 relative">
            <h3 className="text-base font-extrabold text-white mb-1">Create Kanban Ticket</h3>
            <p className="text-zinc-500 text-[11px] mb-6">Create a card to track task development.</p>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Code authController JWT token"
                  className="w-full bg-[#030408]/60 border border-white/10 rounded-xl py-3 px-4 text-xs text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500/50 transition font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Description</label>
                <textarea
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="e.g., Implement secure registrations."
                  className="w-full bg-[#030408]/60 border border-white/10 rounded-xl py-2 px-4 text-xs text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500/50 transition h-20 resize-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full bg-[#030408]/60 border border-white/10 rounded-xl py-3 px-3 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition font-bold"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Status</label>
                  <select
                    value={newTaskStatus}
                    onChange={(e) => setNewTaskStatus(e.target.value)}
                    className="w-full bg-[#030408]/60 border border-white/10 rounded-xl py-3 px-3 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition font-bold"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2.5 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 rounded-xl hover:bg-white/[0.03] border border-transparent text-zinc-400 hover:text-white transition text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition text-xs font-bold shadow-lg shadow-indigo-600/10"
                >
                  Add Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
