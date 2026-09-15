// ══════════════════════════════════════════════════════════════
// API & WebSocket Config (Frontend 🤝 Backend)
// ══════════════════════════════════════════════════════════════

import axios from 'axios';
import { io } from 'socket.io-client';

const HOST = window.location.hostname;
const RENDER_BACKEND = 'https://aupairconnect-backend.onrender.com';
const configuredApiUrl = import.meta.env.VITE_API_URL;
export const BASE_URL = import.meta.env.VITE_WS_URL || (HOST.includes('localhost') ? `http://${HOST}:3001` : RENDER_BACKEND);
const API_URL = configuredApiUrl || `${BASE_URL}/api`;
const WS_URL = BASE_URL;
export const ASSET_BASE_URL = configuredApiUrl
  ? configuredApiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '')
  : BASE_URL.replace(/\/$/, '');

export function resolveAssetUrl(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${ASSET_BASE_URL}${url}`;
}

// ─── AXIOS INSTANCE ──────────────────────────────────────────

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Injeta Access Token nas requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: Tenta refresh token silencioso se der 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const newTokens = res.data.data.tokens;
          
          localStorage.setItem('access_token', newTokens.accessToken);
          localStorage.setItem('refresh_token', newTokens.refreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return api(originalRequest); // Refaz a requisição que falhou
        } catch (err) {
          // Refresh token falhou/expirou: Logout forçado
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/'; 
        }
      }
    }
    return Promise.reject(error);
  }
);

// ─── SOCKET.IO (SINGLETON) ──────────────────────────────────
// Evita múltiplas conexões abertas por re-render do React.
// Em escala, conexões "leaked" matam o servidor de WebSocket.

let socketInstance = null;

export const getSocket = () => {
  const token = localStorage.getItem('access_token');
  if (!token) return null;

  if (socketInstance) {
    return socketInstance;
  }

  socketInstance = io(WS_URL, {
    auth: { token },
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    timeout: 10000,
  });

  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};

// ─── SERVIÇOS ───────────────────────────────────────────────

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
};

export const postsAPI = {
  getFeed: (filters = {}) => api.get('/posts', { params: filters }),
  create: (data) => api.post('/posts', data),
  delete: (id) => api.delete(`/posts/${id}`),
  like: (id) => api.post(`/posts/${id}/like`),
  getComments: (id) => api.get(`/posts/${id}/comments`),
  addComment: (id, content) => api.post(`/posts/${id}/comments`, { content }),
  toggleBookmark: (id) => api.post(`/posts/${id}/bookmark`),
  getMyBookmarks: () => api.get('/posts/bookmarks/mine'),
};

export const chatAPI = {
  getConversations: () => api.get('/chat/conversations'),
  getMessages: (id, cursor) => api.get(`/chat/conversations/${id}/messages`, { params: { cursor } }),
  getOrCreateDirect: (userId) => api.post(`/chat/direct/${userId}`),
};

export const usersAPI = {
  getProfile: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.patch('/users/profile', data),
  follow: (id) => api.post(`/users/${id}/follow`),
  getFollowers: (id) => api.get(`/users/${id}/followers`),
  getFollowing: (id) => api.get(`/users/${id}/following`),
  getNearby: (lat, lng, radius = 50) => api.get('/users/nearby', { params: { lat, lng, radius } }),
  updateLocation: (latitude, longitude) => api.post('/users/location', { latitude, longitude }),
  search: (params = {}) => api.get('/search', { params }),
};

export const roomsAPI = {
  list: () => api.get('/rooms'),
  create: (data) => api.post('/rooms', data),
  join: (id) => api.post(`/rooms/${id}/join`),
  leave: (id) => api.post(`/rooms/${id}/leave`),
  start: (id) => api.post(`/rooms/${id}/start`),
  end: (id) => api.post(`/rooms/${id}/end`),
};

export const vaultAPI = {
  list: () => api.get('/vault'),
  add: (data) => api.post('/vault', data),
  delete: (id) => api.delete(`/vault/${id}`),
};

export const uploadAPI = {
  upload: (formData) => api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  postImage: (formData) => api.post('/upload/post-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  avatar: (formData) => api.post('/upload/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};


export const searchAPI = {
  query: (q) => api.get('/search', { params: { q } }),
};

export const notificationsAPI = {
  list: () => api.get('/notifications'),
  readAll: () => api.post('/notifications/read-all'),
  readOne: (id) => api.patch(`/notifications/${id}/read`),
};

export const journeyAPI = {
  list: () => api.get('/journey'),
  toggle: (taskId) => api.post(`/journey/${taskId}/toggle`),
};

export const emergencyAPI = {
  getResources: () => api.get('/emergency/resources'),
  getContacts: () => api.get('/emergency/contacts'),
  addContact: (data) => api.post('/emergency/contacts', data),
  removeContact: (id) => api.delete(`/emergency/contacts/${id}`),
};

export const moderationAPI = {
  report: (data) => api.post('/moderation/report', data),
  block: (userId) => api.post(`/moderation/block/${userId}`),
  unblock: (userId) => api.delete(`/moderation/block/${userId}`),
};
