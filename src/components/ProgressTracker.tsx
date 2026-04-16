import { useState, useEffect } from 'react';
import { ListTodo, Plus, CheckCircle2, Clock, AlertCircle, X } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { saveTask, getTasks, deleteTask } from '@/lib/indexeddb';
import { motion, AnimatePresence } from 'framer-motion';
import { usePeerSync, type SyncMessage } from '@/lib/peer-sync';

const ASSIGNEES = [
  { name: 'Aryan', color: 'var(--teammate-aryan)' },
  { name: 'Krishitha', color: 'var(--teammate-krishitha)' },
  { name: 'Devika', color: 'var(--teammate-devika)' },
];

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'done';
  assignee: string;
  lastEdited: string;
  createdAt: number;
  updatedAt: number;
}

const STATUS_CONFIG = {
  pending: { icon: AlertCircle, label: 'Pending', class: 'text-chart-5' },
  'in-progress': { icon: Clock, label: 'In Progress', class: 'text-chart-1' },
  done: { icon: CheckCircle2, label: 'Done', class: 'text-chart-2' },
};

export default function ProgressTracker() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAssignee, setNewAssignee] = useState(ASSIGNEES[0].name);
  const { broadcast, subscribe } = usePeerSync();

  useEffect(() => {
    getTasks().then(t => setTasks(t));
  }, []);

  // Listen for remote task updates
  useEffect(() => {
    return subscribe((msg: SyncMessage) => {
      if (msg.type === 'task-update') {
        const task = msg.payload as Task;
        setTasks(prev => {
          const idx = prev.findIndex(t => t.id === task.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = task;
            return next;
          }
          return [...prev, task];
        });
        saveTask(task);
      } else if (msg.type === 'task-delete') {
        const { id } = msg.payload;
        setTasks(prev => prev.filter(t => t.id !== id));
        deleteTask(id);
      }
    });
  }, [subscribe]);

  const doneCount = tasks.filter(t => t.status === 'done').length;
  const percent = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  const addTask = async () => {
    if (!newTitle.trim()) return;
    const task: Task = {
      id: uuid(),
      title: newTitle.trim(),
      description: newDesc.trim(),
      status: 'pending',
      assignee: newAssignee,
      lastEdited: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setTasks(prev => [...prev, task]);
    await saveTask(task);
    broadcast({ type: 'task-update', payload: task });
    setNewTitle('');
    setNewDesc('');
    setShowAdd(false);
  };

  const cycleStatus = async (task: Task) => {
    const next: Record<string, Task['status']> = {
      pending: 'in-progress',
      'in-progress': 'done',
      done: 'pending',
    };
    const updated = { ...task, status: next[task.status], updatedAt: Date.now() };
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    await saveTask(updated);
    broadcast({ type: 'task-update', payload: updated });
  };

  const updateTaskNotes = async (task: Task, notes: string) => {
    const updated = { ...task, lastEdited: notes, updatedAt: Date.now() };
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setSelectedTask(updated);
    await saveTask(updated);
    broadcast({ type: 'task-update', payload: updated });
  };

  const removeTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await deleteTask(id);
    broadcast({ type: 'task-delete', payload: { id } });
  };

  return (
    <div className="panel-card h-full">
      <div className="panel-header">
        <ListTodo className="panel-header-icon" />
        <span>Progress</span>
        <span className="ml-1 text-neon text-xs font-mono">{percent}%</span>
        <span className="section-label ml-2 hidden sm:inline">Sprint Board</span>
        <button onClick={() => setShowAdd(!showAdd)} className="tool-btn ml-auto">
          <Plus size={14} />
        </button>
      </div>

      <div className="panel-body overflow-y-auto">
        {/* Progress bar */}
        <div className="px-3 pt-3 pb-2">
          <div className="h-2 rounded-full overflow-hidden bg-white/6">
            <motion.div
              className="h-full rounded-full bg-[linear-gradient(90deg,rgba(31,211,198,0.65),rgba(255,154,92,0.9))]"
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {doneCount} of {tasks.length} tasks complete
          </p>
        </div>

        {/* Add task form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-3 pb-2 overflow-hidden"
            >
              <div className="glass-input rounded-2xl p-3 space-y-2">
                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Task title..."
                  className="w-full rounded-xl border border-white/8 bg-white/6 px-2.5 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none"
                />
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full rounded-xl border border-white/8 bg-white/6 px-2.5 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none resize-none"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={newAssignee}
                    onChange={e => setNewAssignee(e.target.value)}
                    className="rounded-xl border border-white/8 bg-white/6 px-2.5 py-2 text-xs text-foreground outline-none"
                  >
                    {ASSIGNEES.map(a => (
                      <option key={a.name} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={addTask}
                    className="ml-auto rounded-full bg-neon px-3.5 py-2 text-xs font-semibold text-neon-foreground transition-opacity hover:opacity-90"
                  >
                    Add
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task list */}
        <div className="px-3 pb-3 space-y-1.5">
          <AnimatePresence>
            {tasks.map(task => {
              const Cfg = STATUS_CONFIG[task.status];
              const assigneeData = ASSIGNEES.find(a => a.name === task.assignee);
              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setSelectedTask(task)}
                  className="glass-input flex items-center gap-2 rounded-2xl px-3 py-2.5 cursor-pointer group transition-all hover:-translate-y-0.5"
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); cycleStatus(task); }}
                    className={`${Cfg.class} shrink-0 hover:scale-110 transition-transform`}
                  >
                    <Cfg.icon size={16} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-medium truncate ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </p>
                    {task.assignee && (
                      <span className="text-[10px]" style={{ color: assigneeData?.color }}>
                        {task.assignee}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeTask(task.id); }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <X size={12} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {tasks.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">No tasks yet. Click + to add one.</p>
          )}
        </div>
      </div>

      {/* Task modal */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => setSelectedTask(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md rounded-[1.6rem] border border-white/10 bg-[rgba(14,22,37,0.92)] p-5 shadow-2xl backdrop-blur-xl mx-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold">{selectedTask.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedTask.description || 'No description'}</p>
                </div>
                <button onClick={() => setSelectedTask(null)} className="text-muted-foreground hover:text-foreground">
                  <X size={16} />
                </button>
              </div>
              <div className="flex items-center gap-3 mb-3 text-xs">
                <span className={STATUS_CONFIG[selectedTask.status].class}>
                  {STATUS_CONFIG[selectedTask.status].label}
                </span>
                <span style={{ color: ASSIGNEES.find(a => a.name === selectedTask.assignee)?.color }}>
                  {selectedTask.assignee}
                </span>
              </div>
              <label className="text-xs text-muted-foreground block mb-1">Notes / Continue working:</label>
              <textarea
                value={selectedTask.lastEdited}
                onChange={e => updateTaskNotes(selectedTask, e.target.value)}
                rows={5}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none transition-colors focus:border-neon"
                placeholder="Continue where you left off..."
              />
              <div className="flex gap-2 mt-3">
                {(['pending', 'in-progress', 'done'] as const).map(status => (
                  <button
                    key={status}
                    onClick={async () => {
                      const updated = { ...selectedTask, status, updatedAt: Date.now() };
                      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
                      setSelectedTask(updated);
                      await saveTask(updated);
                      broadcast({ type: 'task-update', payload: updated });
                    }}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                      selectedTask.status === status
                        ? 'bg-neon text-neon-foreground'
                        : 'bg-accent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {STATUS_CONFIG[status].label}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
