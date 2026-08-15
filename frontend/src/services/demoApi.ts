interface Preferences {
  workStartHour: number;
  workEndHour: number;
  breakDuration: number;
  lunchBreak: { start: number; duration: number };
  maxTasksPerDay: number;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  preferences: Preferences;
}

interface TaskRecord {
  _id: string;
  user: string;
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

interface ScheduleBlock {
  task?: string;
  startTime?: string;
  endTime?: string;
  title?: string;
  isBreak: boolean;
  breakType?: 'short' | 'lunch' | null;
}

interface ScheduleRecord {
  _id: string;
  user: string;
  date: string;
  blocks: ScheduleBlock[];
  totalAvailableMinutes?: number;
  totalScheduledMinutes?: number;
  totalBreakMinutes?: number;
  productivityScore?: number;
  createdAt: string;
}

interface DB {
  users: UserRecord[];
  tasks: TaskRecord[];
  schedules: ScheduleRecord[];
}

export const DEMO_CREDENTIALS = { email: 'demo@flowtime.se', password: 'demo1234' };

const DB_KEY = 'flowtime_demo_db_v1';
const TOKEN_KEY = 'flowtime_demo_token';

const nowIso = () => new Date().toISOString();
const dayKey = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
};
const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const defaultPreferences = (): Preferences => ({
  workStartHour: 9,
  workEndHour: 17,
  breakDuration: 15,
  lunchBreak: { start: 12, duration: 60 },
  maxTasksPerDay: 10,
});

function seed(): DB {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inDays = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d.toISOString();
  };
  const user: UserRecord = {
    id: 'demo-user-1',
    name: 'Demo User',
    email: DEMO_CREDENTIALS.email,
    password: DEMO_CREDENTIALS.password,
    preferences: defaultPreferences(),
  };
  const mk = (
    title: string,
    priority: TaskRecord['priority'],
    estimatedDuration: number,
    extra: Partial<TaskRecord> = {}
  ): TaskRecord => ({
    _id: uid(),
    user: user.id,
    title,
    priority,
    estimatedDuration,
    isFlexible: true,
    preferredTimeOfDay: 'any',
    status: 'pending',
    tags: [],
    createdAt: nowIso(),
    ...extra,
  });
  const tasks: TaskRecord[] = [
    mk('Review deployment checklist', 'urgent', 30, { isFlexible: false, preferredTimeOfDay: 'morning', dueDate: inDays(1), tags: ['Flowtime'] }),
    mk('Practice TypeScript interview questions', 'high', 45, { preferredTimeOfDay: 'morning', tags: ['Study'] }),
    mk('Update portfolio project descriptions', 'medium', 60, { preferredTimeOfDay: 'afternoon', tags: ['Portfolio'] }),
    mk('Plan next week', 'medium', 30, { isFlexible: false, preferredTimeOfDay: 'evening', dueDate: inDays(3) }),
    mk('Morning run', 'low', 45, { status: 'completed', completedAt: inDays(-1), preferredTimeOfDay: 'morning', tags: ['Health'] }),
  ];
  return { users: [user], tasks, schedules: [] };
}

function loadDB(): DB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const db = JSON.parse(raw) as DB;
      if (db && Array.isArray(db.users)) return db;
    }
  } catch {
    /* fall through to reseed */
  }
  const db = seed();
  saveDB(db);
  return db;
}

function saveDB(db: DB) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

function apiError(status: number, message: string): never {
  throw { response: { status, data: { message } } };
}

function currentUser(db: DB): UserRecord {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) apiError(401, 'Not authorized');
  const id = token.split('.').slice(1, 2)[0];
  const user = db.users.find((u) => u.id === id);
  if (!user) apiError(401, 'Not authorized');
  return user;
}

const publicUser = (u: UserRecord) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  preferences: u.preferences,
});

const taskView = (t: TaskRecord) => ({
  _id: t._id,
  title: t.title,
  description: t.description,
  priority: t.priority,
  estimatedDuration: t.estimatedDuration,
  dueDate: t.dueDate,
  isFlexible: t.isFlexible,
  preferredTimeOfDay: t.preferredTimeOfDay,
  status: t.status,
  scheduledStart: t.scheduledStart,
  scheduledEnd: t.scheduledEnd,
  completedAt: t.completedAt,
  tags: t.tags,
  createdAt: t.createdAt,
});

const PRIORITY_WEIGHT: Record<TaskRecord['priority'], number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function sortTasks(a: TaskRecord, b: TaskRecord) {
  const dueA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
  const dueB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
  if (dueA !== dueB) return dueA - dueB;
  if (PRIORITY_WEIGHT[a.priority] !== PRIORITY_WEIGHT[b.priority]) {
    return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
  }
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function generateForDay(db: DB, user: UserRecord, dateStr: string) {
  const scheduleDate = new Date(dateStr);
  scheduleDate.setHours(0, 0, 0, 0);
  const key = dayKey(scheduleDate);

  db.tasks.forEach((t) => {
    if (t.user === user.id && t.status === 'scheduled') {
      t.status = 'pending';
      delete t.scheduledStart;
      delete t.scheduledEnd;
    }
  });

  const pending = db.tasks
    .filter((t) => t.user === user.id && (t.status === 'pending' || t.status === 'scheduled'))
    .sort(sortTasks);

  const prefs = user.preferences;
  const workStart = prefs.workStartHour * 60;
  const workEnd = prefs.workEndHour * 60;
  const lunchStart = prefs.lunchBreak.start * 60;
  const lunchEnd = lunchStart + prefs.lunchBreak.duration;
  const shortBreak = prefs.breakDuration;

  const blocks: ScheduleBlock[] = [];
  const scheduledTasks: TaskRecord[] = [];
  const unscheduledTasks: TaskRecord[] = [];
  let cursor = workStart;
  let lunchInserted = false;

  const insertLunchIfNeeded = () => {
    if (!lunchInserted && lunchStart >= workStart && lunchStart < workEnd && cursor <= lunchStart) {
      blocks.push({
        isBreak: true,
        breakType: 'lunch',
        title: 'Lunch',
        startTime: new Date(scheduleDate.getTime() + lunchStart * 60000).toISOString(),
        endTime: new Date(scheduleDate.getTime() + lunchEnd * 60000).toISOString(),
      });
      cursor = lunchEnd;
      lunchInserted = true;
    }
  };

  for (const task of pending) {
    if (scheduledTasks.length >= prefs.maxTasksPerDay) {
      unscheduledTasks.push(task);
      continue;
    }
    if (cursor < lunchStart && cursor + task.estimatedDuration > lunchStart && cursor < lunchEnd) {
      insertLunchIfNeeded();
    }
    if (cursor + task.estimatedDuration > workEnd) {
      unscheduledTasks.push(task);
      continue;
    }
    if (cursor > workStart && !lunchInserted) insertLunchIfNeeded();
    if (cursor + task.estimatedDuration > workEnd) {
      unscheduledTasks.push(task);
      continue;
    }
    const start = new Date(scheduleDate.getTime() + cursor * 60000);
    const end = new Date(scheduleDate.getTime() + (cursor + task.estimatedDuration) * 60000);
    blocks.push({ task: task._id, startTime: start.toISOString(), endTime: end.toISOString(), title: task.title, isBreak: false });
    task.status = 'scheduled';
    task.scheduledStart = start.toISOString();
    task.scheduledEnd = end.toISOString();
    scheduledTasks.push(task);
    cursor += task.estimatedDuration;
    if (cursor < workEnd && scheduledTasks.length > 0) {
      blocks.push({
        isBreak: true,
        breakType: 'short',
        title: 'Break',
        startTime: end.toISOString(),
        endTime: new Date(scheduleDate.getTime() + (cursor + shortBreak) * 60000).toISOString(),
      });
      cursor += shortBreak;
    }
  }

  const totalScheduledMinutes = scheduledTasks.reduce((s, t) => s + t.estimatedDuration, 0);
  const totalAvailableMinutes = workEnd - workStart - prefs.lunchBreak.duration;
  const totalBreakMinutes = blocks.filter((b) => b.isBreak).reduce((s, b) => {
    if (!b.startTime || !b.endTime) return s;
    return s + (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 60000;
  }, 0);

  const schedule: ScheduleRecord = {
    _id: uid(),
    user: user.id,
    date: key,
    blocks,
    totalAvailableMinutes,
    totalScheduledMinutes,
    totalBreakMinutes,
    productivityScore: totalAvailableMinutes ? Math.round((totalScheduledMinutes / totalAvailableMinutes) * 100) : 0,
    createdAt: nowIso(),
  };
  db.schedules = db.schedules.filter((s) => !(s.user === user.id && s.date === key));
  db.schedules.push(schedule);

  return {
    date: key,
    scheduledTasks: scheduledTasks.map(taskView),
    unscheduledTasks: unscheduledTasks.map(taskView),
    blocks,
    stats: {
      totalAvailableMinutes,
      totalScheduledMinutes,
      totalBreakMinutes,
      productivityScore: schedule.productivityScore,
    },
  };
}

function handle(url: string, method: 'get' | 'post' | 'put' | 'delete', body?: any): any {
  const db = loadDB();

  if (url === '/auth/register' && method === 'post') {
    const { name, email, password } = body || {};
    if (!name || !email || !password) apiError(400, 'Please provide name, email and password');
    if (db.users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) {
      apiError(400, 'Email already registered');
    }
    const user: UserRecord = {
      id: uid(),
      name,
      email: String(email).toLowerCase(),
      password,
      preferences: defaultPreferences(),
    };
    db.users.push(user);
    saveDB(db);
    const token = `demo.${user.id}.${Date.now()}`;
    localStorage.setItem(TOKEN_KEY, token);
    return { success: true, token, user: publicUser(user) };
  }

  if (url === '/auth/login' && method === 'post') {
    const { email, password } = body || {};
    const user = db.users.find((u) => u.email.toLowerCase() === String(email || '').toLowerCase());
    if (!user || user.password !== password) apiError(401, 'Invalid credentials');
    const token = `demo.${user.id}.${Date.now()}`;
    localStorage.setItem(TOKEN_KEY, token);
    return { success: true, token, user: publicUser(user) };
  }

  if (url === '/auth/me' && method === 'get') {
    const user = currentUser(db);
    return { success: true, user: publicUser(user), data: publicUser(user) };
  }

  const user = currentUser(db);

  if (url === '/tasks/stats/overview' && method === 'get') {
    const mine = db.tasks.filter((t) => t.user === user.id);
    const byStatus = (['pending', 'scheduled', 'completed', 'missed'] as const).map((status) => ({
      _id: status,
      count: mine.filter((t) => t.status === status).length,
      totalDuration: mine.filter((t) => t.status === status).reduce((s, t) => s + t.estimatedDuration, 0),
    }));
    const totalTasks = mine.length;
    const completedTasks = mine.filter((t) => t.status === 'completed').length;
    return {
      success: true,
      data: {
        byStatus,
        totalTasks,
        completedTasks,
        completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
    };
  }

  if (url === '/tasks' && method === 'get') {
    const params: Record<string, string> = body?.params || {};
    let mine = db.tasks.filter((t) => t.user === user.id);
    if (params.status) mine = mine.filter((t) => t.status === params.status);
    if (params.priority) mine = mine.filter((t) => t.priority === params.priority);
    if (params.dueDate) {
      const start = new Date(params.dueDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      mine = mine.filter((t) => t.dueDate && new Date(t.dueDate) >= start && new Date(t.dueDate) < end);
    }
    mine = [...mine].sort(sortTasks);
    return { success: true, count: mine.length, data: mine.map(taskView) };
  }

  if (url === '/tasks' && method === 'post') {
    const data = body || {};
    if (!data.title) apiError(400, 'Please provide a task title');
    const task: TaskRecord = {
      _id: uid(),
      user: user.id,
      title: data.title,
      description: data.description,
      priority: data.priority || 'medium',
      estimatedDuration: data.estimatedDuration || 30,
      dueDate: data.dueDate,
      isFlexible: data.isFlexible !== false,
      preferredTimeOfDay: data.preferredTimeOfDay || 'any',
      status: data.status || 'pending',
      tags: data.tags || [],
      createdAt: nowIso(),
    };
    db.tasks.push(task);
    saveDB(db);
    return { success: true, data: taskView(task) };
  }

  const taskMatch = url.match(/^\/tasks\/([^/]+)$/);
  if (taskMatch && method === 'put') {
    const task = db.tasks.find((t) => t._id === taskMatch[1] && t.user === user.id);
    if (!task) apiError(404, 'Task not found');
    Object.assign(task, body);
    if (body?.status === 'completed' && task.status !== 'completed') task.completedAt = nowIso();
    saveDB(db);
    return { success: true, data: taskView(task) };
  }

  if (taskMatch && method === 'delete') {
    const idx = db.tasks.findIndex((t) => t._id === taskMatch[1] && t.user === user.id);
    if (idx === -1) apiError(404, 'Task not found');
    db.tasks.splice(idx, 1);
    db.schedules.forEach((s) => {
      if (s.user === user.id) s.blocks = s.blocks.filter((b) => b.task !== taskMatch[1]);
    });
    saveDB(db);
    return { success: true, message: 'Task deleted successfully' };
  }

  if (taskMatch && method === 'get') {
    const task = db.tasks.find((t) => t._id === taskMatch[1] && t.user === user.id);
    if (!task) apiError(404, 'Task not found');
    return { success: true, data: taskView(task) };
  }

  const scheduleMatch = url.match(/^\/schedule\/(\d{4}-\d{2}-\d{2})$/);
  if (scheduleMatch && method === 'get') {
    const key = dayKey(new Date(scheduleMatch[1]));
    const schedule = db.schedules.find((s) => s.user === user.id && s.date === key);
    return { success: true, data: schedule || null };
  }

  const weekMatch = url.match(/^\/schedule\/week\/(\d{4}-\d{2}-\d{2})$/);
  if (weekMatch && method === 'get') {
    const date = new Date(weekMatch[1]);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const data = db.schedules.filter(
      (s) => s.user === user.id && new Date(s.date) >= weekStart && new Date(s.date) < weekEnd
    );
    return { success: true, data };
  }

  if (url === '/schedule/generate' && method === 'post') {
    const { date } = body || {};
    if (!date) apiError(400, 'Please provide a date');
    const pendingTasks = db.tasks.filter(
      (t) => t.user === user.id && (t.status === 'pending' || t.status === 'scheduled')
    );
    if (pendingTasks.length === 0) apiError(400, 'No tasks to schedule');
    const result = generateForDay(db, user, date);
    saveDB(db);
    return { success: true, data: result };
  }

  apiError(404, `Can't find ${url} on this server!`);
}

export interface DemoApi {
  get: (url: string, config?: { params?: Record<string, string> }) => Promise<{ data: any }>;
  post: (url: string, data?: any) => Promise<{ data: any }>;
  put: (url: string, data?: any) => Promise<{ data: any }>;
  delete: (url: string) => Promise<{ data: any }>;
}

export function createDemoApi(): DemoApi {
  return {
    get: async (url, config) => {
      await delay();
      return { data: handle(url, 'get', config) };
    },
    post: async (url, data) => {
      await delay();
      return { data: handle(url, 'post', data) };
    },
    put: async (url, data) => {
      await delay();
      return { data: handle(url, 'put', data) };
    },
    delete: async (url) => {
      await delay();
      return { data: handle(url, 'delete') };
    },
  };
}
