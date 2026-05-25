import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: (data: { name: string; email: string; password: string }) => api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const taskService = {
  getAll: (params?: Record<string, string>) => api.get('/tasks', { params }),
  getOne: (id: string) => api.get(`/tasks/${id}`),
  create: (data: Record<string, any>) => api.post('/tasks', data),
  update: (id: string, data: Record<string, any>) => api.put(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  getStats: () => api.get('/tasks/stats/overview'),
};

export const scheduleService = {
  getByDate: (date: string) => api.get(`/schedule/${date}`),
  getWeek: (date: string) => api.get(`/schedule/week/${date}`),
  generate: (data: { date: string }) => api.post('/schedule/generate', data),
};

export default api;
