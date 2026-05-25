import { useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/api';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import { useToast } from '../context/ToastContext';
import '../styles/tasks.css';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'To Do' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'completed', label: 'Completed' },
];

const PRIORITY_FILTERS = [
  { key: 'all', label: 'All Priority' },
  { key: 'urgent', label: 'Urgent' },
  { key: 'high', label: 'High' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
];

interface Task {
  _id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDuration: number;
  dueDate?: string;
  isFlexible: boolean;
  preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'any';
  status: 'pending' | 'scheduled' | 'completed' | 'missed';
  scheduledStart?: string;
  scheduledEnd?: string;
  completedAt?: string;
  tags: string[];
  createdAt: string;
}

interface Stats {
  totalTasks: number;
  completionRate: number;
  pending: number;
  scheduled: number;
  completed: number;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const { addToast } = useToast();

  const fetchTasks = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      const res = await taskService.getAll(params);
      setTasks(res.data.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load tasks', 'error');
    }
  }, [statusFilter, priorityFilter, addToast]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await taskService.getStats();
      const data = res.data.data;
      setStats({
        totalTasks: data.totalTasks || 0,
        completionRate: data.completionRate || 0,
        pending: data.byStatus?.find((s: any) => s._id === 'pending')?.count || 0,
        scheduled: data.byStatus?.find((s: any) => s._id === 'scheduled')?.count || 0,
        completed: data.completedTasks || 0,
      });
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchTasks().finally(() => setLoading(false));
    fetchStats();
  }, [statusFilter, priorityFilter, fetchTasks, fetchStats]);

  const handleCreate = async (data: Record<string, any>) => {
    try {
      await taskService.create(data);
      addToast('Task created successfully!', 'success');
      fetchTasks();
      fetchStats();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to create task', 'error');
      throw err;
    }
  };

  const pending = tasks.filter(t => t.status === 'pending').length;
  const scheduled = tasks.filter(t => t.status === 'scheduled').length;

  return (
    <div className="task-list-page">
      <div className="page-header">
        <h1 className="page-title">Tasks</h1>
      </div>

      <div className="stats-summary">
        <div className="card stat-item">
          <div className="stat-value">{stats?.totalTasks || 0}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="card stat-item">
          <div className="stat-value">{pending}</div>
          <div className="stat-label">To Do</div>
        </div>
        <div className="card stat-item">
          <div className="stat-value">{scheduled}</div>
          <div className="stat-label">Scheduled</div>
        </div>
        <div className="card stat-item">
          <div className="stat-value">{stats?.completionRate || 0}%</div>
          <div className="stat-label">Completion Rate</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div className="task-filters">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.key}
              className={`filter-btn ${statusFilter === f.key ? 'active' : ''}`}
              onClick={() => setStatusFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>|</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--blue-200)',
              background: 'white',
              fontSize: '0.875rem',
              color: priorityFilter !== 'all' ? 'var(--blue-600)' : 'var(--text-secondary)',
              fontWeight: priorityFilter !== 'all' ? 500 : 400,
            }}
          >
            {PRIORITY_FILTERS.map(f => (
              <option key={f.key} value={f.key}>{f.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <p>Loading tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3 className="empty-title">No tasks found</h3>
          <p>
            {statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first task to get started!'}
          </p>
        </div>
      ) : (
        <div className="task-grid" style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))'
        }}>
          {tasks.map(task => (
            <TaskCard
              key={task._id}
              task={task}
              onUpdate={fetchTasks}
              onDelete={fetchTasks}
            />
          ))}
        </div>
      )}

      <button className="add-task-btn" onClick={() => setShowCreate(true)}>
        +
      </button>

      <TaskForm
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
