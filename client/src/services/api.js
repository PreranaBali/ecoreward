/**
 * EcoReward – Frontend API Service Layer
 * All API calls via Axios with JWT interceptors.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30_000,
});

/* ─── Attach JWT on every request ───────────────────────────────── */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eco_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ─── Handle 401 globally ───────────────────────────────────────── */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('eco_token');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

/* ─── Auth ──────────────────────────────────────────────────────── */
export const authService = {
  register: (data)   => api.post('/auth/register', data),
  login:    (data)   => api.post('/auth/login', data),
  profile:  ()       => api.get('/auth/profile'),
  update:   (data)   => api.patch('/auth/profile', data),
};

/* ─── Reports ───────────────────────────────────────────────────── */
export const reportService = {
  upload: (formData) =>
    api.post('/report/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => console.log('Upload:', Math.round((e.loaded / e.total) * 100) + '%'),
    }),
  history: (params) => api.get('/report/history', { params }),
  getById: (id)     => api.get(`/report/${id}`),
  nearby:  (params) => api.get('/report/nearby', { params }),
};

/* ─── Rewards ───────────────────────────────────────────────────── */
export const rewardService = {
  leaderboard:    (limit = 50) => api.get('/reward/leaderboard', { params: { limit } }),
  myRank:         ()           => api.get('/reward/my-rank'),
  achievements:   ()           => api.get('/reward/achievements'),
  weeklyActivity: ()           => api.get('/reward/weekly-activity'),
};

/* ─── Admin ─────────────────────────────────────────────────────── */
export const adminService = {
  reports:      (params) => api.get('/admin/reports', { params }),
  verify:       (id, data) => api.patch(`/admin/verify/${id}`, data),
  deleteReport: (id)       => api.delete(`/admin/report/${id}`),
  stats:        ()         => api.get('/admin/stats'),
  users:        (params)   => api.get('/admin/users', { params }),
};

export default api;
