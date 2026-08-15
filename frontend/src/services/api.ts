import axios from 'axios';
import { createDemoApi, DEMO_CREDENTIALS } from './demoApi';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const DEMO_MODE = !import.meta.env.VITE_API_URL;

const api = DEMO_MODE
  ? createDemoApi()
  : axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

if (!DEMO_MODE) {
  (api as ReturnType<typeof axios.create>).interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  (api as ReturnType<typeof axios.create>).interceptors.response.use(
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
}

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

export { DEMO_CREDENTIALS };
export default api;
