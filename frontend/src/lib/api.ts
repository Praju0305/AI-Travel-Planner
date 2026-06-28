import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateMe: (data: { name?: string; preferences?: object }) => api.put('/auth/me', data),
};

// Trips
export const tripsAPI = {
  getAll: () => api.get('/trips'),
  getOne: (id: string) => api.get(`/trips/${id}`),
  create: (data: object) => api.post('/trips', data),
  update: (id: string, data: object) => api.put(`/trips/${id}`, data),
  delete: (id: string) => api.delete(`/trips/${id}`),
  generate: (id: string) => api.post(`/trips/${id}/generate`),
  regenerateDay: (id: string, dayNumber: number, preferences: string) =>
    api.put(`/trips/${id}/days/${dayNumber}/regenerate`, { preferences }),
  addActivity: (id: string, dayNumber: number, activity: object) =>
    api.post(`/trips/${id}/days/${dayNumber}/activities`, activity),
  removeActivity: (id: string, dayNumber: number, activityId: string) =>
    api.delete(`/trips/${id}/days/${dayNumber}/activities/${activityId}`),
  chat: (id: string, message: string) => api.post(`/trips/${id}/chat`, { message }),
  getWeatherAdvice: (id: string) => api.post(`/trips/${id}/weather`),
};

export default api;
