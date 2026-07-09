import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSocket } from '../../hooks/useSocket';
import { apiFetch, getApiUrl } from '../../utils/api';
import { 
  ArrowLeft, FileText, Clipboard, Users, MessageSquare, 
  Send, Edit2, Play, CheckCircle2, ChevronRight, Plus, 
  Download, Palette, Trash2, ShieldAlert, Sparkles, RefreshCw, X
} from 'lucide-react';

export default function Workspace() {
  const router = useRouter();
  const { id: roomId } = router.query;

  // App state
  const [user, setUser] = useState(null);
  const [document, setDocument] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState('editor'); // editor, kanban, whiteboard
  
  // Doc Editor states
  const [docContent, setDocContent] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [remoteCursors, setRemoteCursors] = useState({}); // socketId -> cursorInfo
  
  // Kanban board states
  const [tasks, setTasks] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState('TODO');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');

  // Whiteboard drawing states
  const [brushColor, setBrushColor] = useState('#EF4444');
  const [brushSize, setBrushSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);

  // References
  const textEditorRef = useRef(null);
  const canvasRef = useRef(null);
  const drawingContextRef = useRef(null);
  const chatEndRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Load user profile
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (!token || !savedUser) {
      router.push('/auth');
      return;
    }

    setUser(JSON.parse(savedUser));
  }, []);

  // Fetch document details on load
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
      console.error('Failed to load document details:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      const data = await apiFetch('/tasks');
      setTasks(data || []);
    } catch (err) {
      console.error('Failed to load Kanban tasks:', err);
    }
  };

  // Configure Socket.io Events
  const socket = useSocket(roomId, user, {
    // Presence Sync
    'workspace-users': (users) => {
      setActiveUsers(users);
    },

    // Document Text Sync
    'document-update': ({ text, version }) => {
      setDocContent(text);
      if (document) {
        setDocument(prev => ({ ...prev, version }));
      }
    },

    // Document Title Sync
    'document-title-update': ({ title }) => {
      setDocTitle(title);
    },

    // Cursor presence
    'cursor-update': ({ socketId, user: cursorUser, cursor }) => {
      setRemoteCursors(prev => {
        if (!cursor) {
          const updated = { ...prev };
          delete updated[socketId];
          return updated;
        }
        return {
          ...prev,
          [socketId]: { user: cursorUser, cursor }
        };
      });
    },

    // Task board sync
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

    // Whiteboard Sync
    'draw-line-update': (line) => {
      drawOnCanvas(line.x1, line.y1, line.x2, line.y2, line.color, line.size);
    },

    'clear-whiteboard-update': () => {
      clearLocalCanvas();
    },

    // Chat Sync
    'receive-message': (msg) => {
      setChatMessages(prev => [...prev, msg]);
    }
  });

  // Autoscroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Track Local Cursor updates
  const handleEditorCursorChange = () => {
    if (!socket || !textEditorRef.current) return;

    const textarea = textEditorRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Send cursor offset
    socket.emit('cursor-move', {
      roomId,
      cursor: {
        selectionStart: start,
        selectionEnd: end
      }
    });
  };

  // Local document typing changes
  const handleDocContentChange = (e) => {
    const text = e.target.value;
    setDocContent(text);

    // Sync via socket immediately
    if (socket) {
      socket.emit('document-change', {
        roomId,
        text,
        version: document ? document.version + 1 : 1,
        username: user?.username
      });
    }
  };

  // Local title update
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

  // Send workspace chat message
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket) return;

    socket.emit('send-message', {
      roomId,
      text: chatInput
    });
    setChatInput('');
  };

  // ==================== KANBAN BOARD ACTIONS ====================
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const task = await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDesc,
          status: newTaskStatus,
          assigneeId: newTaskAssignee || null
        })
      });

      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskAssignee('');
      setShowTaskModal(false);

      // Sync via socket
      if (socket) {
        socket.emit('task-created', { roomId, task });
      }

      setTasks(prev => [...prev, task]);
    } catch (err) {
      console.error(err);
      alert('Failed to create task');
    }
  };

  const moveTaskColumn = async (taskId, newStatus) => {
    const affectedTasks = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
    
    // Sort and calculate order indices
    const columns = ['TODO', 'IN_PROGRESS', 'DONE'];
    let updatedTasks = [];

    columns.forEach(col => {
      const colTasks = affectedTasks.filter(t => t.status === col);
      colTasks.forEach((t, index) => {
        updatedTasks.push({ ...t, order: index });
      });
    });

    setTasks(updatedTasks);

    // Sync via socket
    if (socket) {
      socket.emit('task-moved', {
        roomId,
        taskId,
        status: newStatus,
        order: 0,
        taskList: updatedTasks
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
    if (!confirm('Delete this task?')) return;

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

  // ==================== WHITEBOARD CANVAS ACTIONS ====================
  // Canvas initialization
  useEffect(() => {
    if (activeTab !== 'whiteboard' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    
    // Scale canvas context to fit physical layout width
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
    
    // Save coordinate state
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

    // Draw locally
    drawOnCanvas(x1, y1, x, y, brushColor, brushSize);

    // Emit to socket
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

  // ==================== UTILS ====================
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

  return (
    <div className="min-h-screen bg-workspace-900 flex flex-col h-screen overflow-hidden">
      {/* Workspace Header */}
      <header className="glass w-full border-b border-white/5 py-3.5 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4 max-w-lg">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition">
            <ArrowLeft size={16} />
          </Link>
          
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <FileText size={16} />
            </div>

            {/* Editable Title */}
            {isEditingTitle ? (
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                autoFocus
                className="bg-workspace-800 border border-indigo-500/40 rounded px-2 py-0.5 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            ) : (
              <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => setIsEditingTitle(true)}>
                <span className="font-extrabold text-sm text-slate-100 group-hover:text-white">{docTitle || 'Loading...'}</span>
                <Edit2 size={12} className="text-slate-500 opacity-0 group-hover:opacity-100 transition" />
              </div>
            )}
          </div>
        </div>

        {/* Presence User Avatars */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hidden md:inline">Working Now:</span>
          <div className="flex -space-x-1.5">
            {activeUsers.map((u, i) => (
              <div 
                key={i} 
                className="w-7 h-7 rounded-full bg-workspace-800 border-2 flex items-center justify-center text-xs relative cursor-help"
                style={{ borderColor: u.color }}
                title={`${u.username} (Online)`}
              >
                <span>{getAvatarEmoji(u.avatar)}</span>
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-workspace-900" />
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Toolbar / Sidebar */}
        <aside className="w-16 glass border-r border-white/5 flex flex-col items-center py-6 gap-6 shrink-0">
          <button 
            onClick={() => setActiveTab('editor')}
            className={`p-3 rounded-xl transition ${
              activeTab === 'editor' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
            title="Collaborative Editor"
          >
            <FileText size={20} />
          </button>
          
          <button 
            onClick={() => setActiveTab('kanban')}
            className={`p-3 rounded-xl transition ${
              activeTab === 'kanban' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
            title="Kanban Tasks"
          >
            <Clipboard size={20} />
          </button>
          
          <button 
            onClick={() => setActiveTab('whiteboard')}
            className={`p-3 rounded-xl transition ${
              activeTab === 'whiteboard' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
            title="Shared Whiteboard"
          >
            <Palette size={20} />
          </button>
        </aside>

        {/* Workspace Canvas / Center Area */}
        <main className="flex-1 p-6 overflow-y-auto bg-workspace-900 flex flex-col">
          
          {/* TAB 1: COLLABORATIVE EDITOR */}
          {activeTab === 'editor' && (
            <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs text-slate-500 font-medium">Document edits save and synchronize in real-time.</span>
                <button
                  onClick={handleExportDoc}
                  className="px-3.5 py-1.5 bg-workspace-800 hover:bg-workspace-800/80 text-slate-300 hover:text-white rounded-lg border border-white/5 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Download size={13} /> Export MD
                </button>
              </div>

              {/* Sheet container */}
              <div className="flex-1 glass rounded-2xl border-white/10 shadow-2xl p-6 relative flex flex-col min-h-[450px]">
                <textarea
                  ref={textEditorRef}
                  value={docContent}
                  onChange={handleDocContentChange}
                  onKeyUp={handleEditorCursorChange}
                  onSelect={handleEditorCursorChange}
                  onClick={handleEditorCursorChange}
                  placeholder="# Start typing here..."
                  className="flex-1 w-full bg-transparent resize-none text-slate-200 placeholder:text-slate-700 focus:outline-none text-sm font-mono leading-relaxed"
                />

                {/* Show active cursors summary banner */}
                <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-2 text-[10px] text-slate-500">
                  <span className="font-bold">Collab cursors:</span>
                  {Object.keys(remoteCursors).length === 0 ? (
                    <span>No other active cursors</span>
                  ) : (
                    Object.values(remoteCursors).map((rc, idx) => (
                      <span key={idx} className="flex items-center gap-1 px-2 py-0.5 rounded bg-workspace-800 border border-white/5" style={{ color: rc.user?.color }}>
                        ● {rc.user?.username}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KANBAN BOARD */}
          {activeTab === 'kanban' && (
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Project Work Board</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Sync tasks and coordinate statuses with collaborators.</p>
                </div>
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/10"
                >
                  <Plus size={14} /> Add Task
                </button>
              </div>

              {/* 3 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 items-start">
                
                {/* Column 1: TODO */}
                <div className="glass-card rounded-2xl p-4 flex flex-col gap-4 border border-white/5">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">To Do</span>
                    <span className="px-2 py-0.5 rounded bg-workspace-900 text-slate-400 text-[10px] font-bold">
                      {tasks.filter(t => t.status === 'TODO').length}
                    </span>
                  </div>
                  <div className="space-y-3 min-h-[300px]">
                    {tasks.filter(t => t.status === 'TODO').map(task => (
                      <div key={task.id} className="glass p-4 rounded-xl border-white/5 flex flex-col gap-3 group relative hover:border-white/10 transition">
                        <div>
                          <h4 className="font-bold text-slate-200 text-xs">{task.title}</h4>
                          <p className="text-[10px] text-slate-500 mt-1">{task.description || 'No description.'}</p>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                          <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded">Unassigned</span>
                          <div className="flex gap-1.5">
                            <button onClick={() => moveTaskColumn(task.id, 'IN_PROGRESS')} className="p-1 rounded bg-workspace-900 text-slate-400 hover:text-white" title="Move to In Progress">
                              <ChevronRight size={12} />
                            </button>
                            <button onClick={() => handleDeleteTask(task.id)} className="p-1 rounded bg-workspace-900 text-slate-500 hover:text-rose-400" title="Delete">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 2: IN PROGRESS */}
                <div className="glass-card rounded-2xl p-4 flex flex-col gap-4 border border-white/5">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-xs font-bold uppercase text-amber-400 tracking-wider">In Progress</span>
                    <span className="px-2 py-0.5 rounded bg-workspace-900 text-amber-400 text-[10px] font-bold">
                      {tasks.filter(t => t.status === 'IN_PROGRESS').length}
                    </span>
                  </div>
                  <div className="space-y-3 min-h-[300px]">
                    {tasks.filter(t => t.status === 'IN_PROGRESS').map(task => (
                      <div key={task.id} className="glass p-4 rounded-xl border-white/5 flex flex-col gap-3 group relative hover:border-white/10 transition">
                        <div>
                          <h4 className="font-bold text-slate-200 text-xs">{task.title}</h4>
                          <p className="text-[10px] text-slate-500 mt-1">{task.description || 'No description.'}</p>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                          <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">Active</span>
                          <div className="flex gap-1.5">
                            <button onClick={() => moveTaskColumn(task.id, 'DONE')} className="p-1 rounded bg-workspace-900 text-slate-400 hover:text-white" title="Mark Done">
                              <ChevronRight size={12} />
                            </button>
                            <button onClick={() => handleDeleteTask(task.id)} className="p-1 rounded bg-workspace-900 text-slate-500 hover:text-rose-400" title="Delete">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 3: DONE */}
                <div className="glass-card rounded-2xl p-4 flex flex-col gap-4 border border-white/5">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-xs font-bold uppercase text-emerald-400 tracking-wider">Completed</span>
                    <span className="px-2 py-0.5 rounded bg-workspace-900 text-emerald-400 text-[10px] font-bold">
                      {tasks.filter(t => t.status === 'DONE').length}
                    </span>
                  </div>
                  <div className="space-y-3 min-h-[300px]">
                    {tasks.filter(t => t.status === 'DONE').map(task => (
                      <div key={task.id} className="glass p-4 rounded-xl border-white/5 flex flex-col gap-3 group relative hover:border-white/10 transition opacity-80">
                        <div>
                          <h4 className="font-bold text-slate-400 text-xs line-through">{task.title}</h4>
                          <p className="text-[10px] text-slate-600 mt-1">{task.description || 'No description.'}</p>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">Finished</span>
                          <div className="flex gap-1.5">
                            <button onClick={() => moveTaskColumn(task.id, 'TODO')} className="p-1 rounded bg-workspace-900 text-slate-400 hover:text-white" title="Send back to Todo">
                              <ArrowLeft size={12} />
                            </button>
                            <button onClick={() => handleDeleteTask(task.id)} className="p-1 rounded bg-workspace-900 text-slate-500 hover:text-rose-400" title="Delete">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: WHITEBOARD */}
          {activeTab === 'whiteboard' && (
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Live Whiteboard</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Click and drag to sketch. Everyone sees your drawing instantly.</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Color palette */}
                  <div className="flex gap-1">
                    {['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#FFFFFF'].map(c => (
                      <button
                        key={c}
                        onClick={() => setBrushColor(c)}
                        className={`w-6 h-6 rounded-full border ${brushColor === c ? 'scale-110 border-white' : 'border-transparent'}`}
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
                    className="w-20 accent-indigo-500"
                    title="Brush Size"
                  />
                  <button
                    onClick={handleClearWhiteboard}
                    className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-semibold transition"
                  >
                    Clear Board
                  </button>
                </div>
              </div>

              {/* Canvas container */}
              <div className="flex-1 bg-workspace-800 rounded-2xl border border-white/5 relative overflow-hidden min-h-[450px]">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full h-full cursor-crosshair block bg-slate-950/20"
                />
              </div>
            </div>
          )}

        </main>

        {/* Right Sidebar: Chat Widget */}
        <aside className="w-80 glass border-l border-white/5 flex flex-col h-full shrink-0">
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
            <MessageSquare size={16} className="text-indigo-400 animate-pulse-slow" />
            <h3 className="font-extrabold text-sm text-slate-200">Workspace Chat</h3>
          </div>

          {/* Message List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 flex flex-col">
            {chatMessages.length === 0 ? (
              <p className="text-[10px] text-slate-600 text-center my-auto">Start the discussion! Type a message below.</p>
            ) : (
              chatMessages.map((msg, index) => {
                const isMe = user && msg.userId === user.id;
                return (
                  <div key={index} className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start'}`}>
                    <div className="flex items-center gap-1.5 mb-1 text-[9px] text-slate-500">
                      {!isMe && <span>{getAvatarEmoji(msg.user?.avatar)}</span>}
                      <span>{msg.user?.username || 'Member'}</span>
                    </div>
                    <div 
                      className={`px-3 py-2 rounded-xl text-xs leading-normal break-words ${
                        isMe 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-workspace-800 text-slate-200 border border-white/5 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendChat} className="p-4 border-t border-white/5 flex gap-2 shrink-0 bg-workspace-900/60">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-workspace-800 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/10"
            >
              <Send size={14} />
            </button>
          </form>
        </aside>

      </div>

      {/* Task Creation Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md glass-card rounded-2xl border-white/10 shadow-2xl p-6 relative">
            <h3 className="text-xl font-bold text-white mb-2">Create New Kanban Task</h3>
            <p className="text-slate-400 text-xs mb-6">Create a card and sync it with your board columns.</p>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Set up WebSocket connection"
                  className="w-full bg-workspace-900 border border-white/10 rounded-xl py-3 px-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Description</label>
                <textarea
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="e.g., Code the room join events in collab.js server socket file."
                  className="w-full bg-workspace-900 border border-white/10 rounded-xl py-2 px-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 transition h-24 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Initial Status</label>
                <select
                  value={newTaskStatus}
                  onChange={(e) => setNewTaskStatus(e.target.value)}
                  className="w-full bg-workspace-900 border border-white/10 rounded-xl py-3 px-4 text-sm text-slate-100 focus:outline-none focus:border-indigo-500/60 transition"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Completed</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2.5 rounded-xl hover:bg-white/5 border border-transparent text-slate-400 hover:text-white transition text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition text-xs font-semibold shadow-lg shadow-indigo-600/10"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
