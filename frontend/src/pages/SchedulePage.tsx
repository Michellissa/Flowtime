import { useState, useEffect, useCallback } from 'react';
import { scheduleService } from '../services/api';
import { useToast } from '../context/ToastContext';

interface ScheduleBlock {
  startTime?: string;
  endTime?: string;
  title?: string;
  isBreak: boolean;
  breakType?: string | null;
}

interface DaySchedule {
  _id: string;
  date: string;
  blocks: ScheduleBlock[];
  totalAvailableMinutes: number;
  totalScheduledMinutes: number;
  totalBreakMinutes: number;
  productivityScore: number;
}

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<DaySchedule | null>(null);
  const [weekSchedules, setWeekSchedules] = useState<DaySchedule[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const { addToast } = useToast();

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const res = await scheduleService.getByDate(selectedDate);
      setSchedule(res.data.data);
    } catch (err) {
      setSchedule(null);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const fetchWeekSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const res = await scheduleService.getWeek(selectedDate);
      setWeekSchedules(res.data.data || []);
    } catch (err) {
      setWeekSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (viewMode === 'day') {
      fetchSchedule();
    } else {
      fetchWeekSchedule();
    }
  }, [selectedDate, viewMode, fetchSchedule, fetchWeekSchedule]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await scheduleService.generate({ date: selectedDate });
      addToast('Schedule generated successfully!', 'success');
      fetchSchedule();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to generate schedule', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleDateChange = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 8);

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  return (
    <div className="task-list-page">
      <div className="page-header">
        <h1 className="page-title">Schedule</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{
            display: 'flex',
            gap: '8px',
            background: 'white',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--blue-200)'
          }}>
            <button
              onClick={() => setViewMode('day')}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: viewMode === 'day' ? 'var(--blue-100)' : 'transparent',
                color: viewMode === 'day' ? 'var(--blue-700)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: viewMode === 'week' ? 'var(--blue-100)' : 'transparent',
                color: viewMode === 'week' ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Week
            </button>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? 'Generating...' : 'Generate Schedule'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => handleDateChange(-1)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--blue-200)',
            background: 'white',
            cursor: 'pointer',
            fontSize: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          &lt;
        </button>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ maxWidth: '200px' }}
        />
        <button
          onClick={() => handleDateChange(1)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--blue-200)',
            background: 'white',
            cursor: 'pointer',
            fontSize: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          &gt;
        </button>
        <button
          onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
          className="btn btn-secondary btn-sm"
        >
          Today
        </button>
      </div>

      {viewMode === 'day' ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--blue-100)' }}>
            <h3>{new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</h3>
            {schedule && (
              <div style={{ display: 'flex', gap: '24px', marginTop: '12px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <span>Productivity Score: {schedule.productivityScore || 0}%</span>
                <span>Scheduled: {schedule.totalScheduledMinutes || 0} min</span>
              </div>
            )}
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>Loading schedule...</div>
          ) : !schedule || schedule.blocks.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📅</div>
              <p>No schedule for this day</p>
              <p style={{ fontSize: '0.875rem', marginBottom: '16px' }}>Click "Generate Schedule" to automatically schedule your tasks</p>
            </div>
          ) : (
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {hours.map(hour => {
                const block = schedule.blocks.find(b => {
                  if (!b.startTime) return false;
                  const blockHour = new Date(b.startTime).getHours();
                  return blockHour === hour;
                });

                return (
                  <div
                    key={hour}
                    style={{
                      display: 'flex',
                      borderBottom: '1px solid var(--blue-100)',
                      minHeight: '60px',
                    }}
                  >
                    <div style={{
                      width: '80px',
                      padding: '12px 16px',
                      color: 'var(--text-muted)',
                      fontSize: '0.875rem',
                      borderRight: '1px solid var(--blue-100)',
                      flexShrink: 0,
                    }}>
                      {hour}:00
                    </div>
                    <div style={{
                      flex: 1,
                      padding: '12px 16px',
                      background: block ? (block.isBreak ? 'rgba(34, 197, 94, 0.06)' : 'var(--blue-50)') : 'var(--card-bg)',
                    }}>
                      {block && (
                        <div style={{
                          fontWeight: 500,
                          color: block.isBreak ? 'var(--success)' : 'var(--text-primary)',
                        }}>
                          {block.isBreak ? `☕ ${block.breakType || 'Break'}` : block.title}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px' }}>
          {Array.from({ length: 7 }, (_, i) => {
            const date = new Date(selectedDate);
            date.setDate(date.getDate() - date.getDay() + i);
            const dateStr = date.toISOString().split('T')[0];
            const daySchedule = weekSchedules.find(s => {
              const scheduleDate = new Date(s.date).toISOString().split('T')[0];
              return scheduleDate === dateStr;
            });

            return (
              <div
                key={dateStr}
                className={`card ${isToday(dateStr) ? 'card-hover' : ''}`}
                style={{
                  padding: '16px',
                  border: isToday(dateStr) ? '2px solid var(--blue-300)' : undefined,
                  background: isToday(dateStr) ? 'var(--blue-50)' : undefined,
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                    {date.getDate()}
                  </div>
                </div>
                {daySchedule ? (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    <div>{daySchedule.blocks?.filter(b => !b.isBreak).length || 0} tasks</div>
                    <div style={{ color: 'var(--blue-600)', fontWeight: 500 }}>
                      Score: {daySchedule.productivityScore || 0}%
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    No schedule
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
