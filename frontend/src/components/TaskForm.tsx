import { useState } from 'react';
import Modal from './Modal';

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

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  task?: Task | null;
}

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const TIMES = ['morning', 'afternoon', 'evening', 'any'];

export default function TaskForm({ isOpen, onClose, onSubmit, task }: TaskFormProps) {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    estimatedDuration: task?.estimatedDuration || 30,
    dueDate: task?.dueDate?.split('T')[0] || '',
    preferredTimeOfDay: task?.preferredTimeOfDay || 'any',
    isFlexible: task?.isFlexible ?? true,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        estimatedDuration: parseInt(formData.estimatedDuration as unknown as string),
        dueDate: formData.dueDate || undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task ? 'Edit Task' : 'Create New Task'}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="task-form-grid">
          <div className="input-group full-width">
            <label className="input-label">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="What needs to be done?"
              required
            />
          </div>

          <div className="input-group full-width">
            <label className="input-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add details..."
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Priority</label>
            <select name="priority" value={formData.priority} onChange={handleChange}>
              {PRIORITIES.map(p => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Duration (minutes)</label>
            <input
              type="number"
              name="estimatedDuration"
              value={formData.estimatedDuration}
              onChange={handleChange}
              min={5}
              max={480}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Due Date</label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Preferred Time</label>
            <select name="preferredTimeOfDay" value={formData.preferredTimeOfDay} onChange={handleChange}>
              {TIMES.map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="input-group full-width" style={{ flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
            <input
              type="checkbox"
              name="isFlexible"
              id="isFlexible"
              checked={formData.isFlexible}
              onChange={handleChange}
              style={{ width: 'auto' }}
            />
            <label htmlFor="isFlexible" style={{ marginBottom: 0 }}>Flexible timing (can be rescheduled)</label>
          </div>
        </div>
      </form>
    </Modal>
  );
}
