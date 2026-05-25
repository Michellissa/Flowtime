import { useState } from 'react';
import { taskService } from '../services/api';
import TaskForm from './TaskForm';
import { useToast } from '../context/ToastContext';
import '../styles/tasks.css';

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

interface TaskCardProps {
  task: Task;
  onUpdate: () => void;
  onDelete: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'badge-gray',
  scheduled: 'badge-gray-light',
  completed: 'badge-success',
  missed: 'badge-warning',
};

export default function TaskCard({ task, onUpdate, onDelete }: TaskCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { addToast } = useToast();

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      await taskService.update(task._id, { status: newStatus });
      addToast(`Task marked as ${newStatus}!`, 'success');
      onUpdate();
    } catch (err) {
      addToast('Failed to update task', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this task?')) {
      try {
        await taskService.delete(task._id);
        addToast('Task deleted', 'success');
        onDelete();
      } catch (err) {
        addToast('Failed to delete task', 'error');
      }
    }
  };

  const handleEditSubmit = async (data: Record<string, any>) => {
    try {
      await taskService.update(task._id, data);
      addToast('Task updated!', 'success');
      onUpdate();
    } catch (err) {
      addToast('Failed to update task', 'error');
      throw err;
    }
    setShowEdit(false);
  };

  return (
    <>
      <div className="card task-card card-hover" onClick={() => setShowEdit(true)} style={{ opacity: updating ? 0.7 : 1 }}>
        <div className={`task-priority priority-${task.priority}`} />
        <div className="task-content">
          <div className="task-header">
            <h4 className="task-title" style={{ textDecoration: task.status === 'completed' ? 'line-through' : 'none', opacity: task.status === 'completed' ? 0.6 : 1 }}>
              {task.title}
            </h4>
            <div className="task-actions" onClick={(e) => e.stopPropagation()}>
              {task.status !== 'completed' && (
                <button
                  className="task-action-btn complete"
                  onClick={() => handleStatusChange('completed')}
                  title="Mark complete"
                  disabled={updating}
                >
                  ✓
                </button>
              )}
              <button
                className="task-action-btn delete"
                onClick={handleDelete}
                title="Delete task"
              >
                ×
              </button>
            </div>
          </div>

          {task.description && (
            <p className="task-description">{task.description}</p>
          )}

          <div className="task-meta">
            <span className="task-meta-item">
              {task.estimatedDuration} min
            </span>
            {task.dueDate && (
              <span className="task-meta-item">
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
            <span className="task-meta-item">
              {task.preferredTimeOfDay}
            </span>
            <span className={`badge ${STATUS_COLORS[task.status]}`}>
              {task.status}
            </span>
          </div>
        </div>
      </div>

      <TaskForm
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        onSubmit={handleEditSubmit}
        task={task}
      />
    </>
  );
}
