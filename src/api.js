// ══════════════════════════════════════════════════════════════
// API & WebSocket Config (Frontend 🤝 Backend)
// ══════════════════════════════════════════════════════════════

import axios from 'axios';
import { io } from 'socket.io-client';

const HOST = window.location.hostname;
const RENDER_BACKEND = 'https://aupairconnect-backend.onrender.com';
export const BASE_URL = import.meta.env.VITE_WS_URL || (HOST.includes('localhost') ? `http://${HOST}:3001` : RENDER_BACKEND);
const API_URL = import.meta.env.VITE_API_URL || `${BASE_URL}/api`;
const WS_URL = BASE_URL;

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

  if (socketInstance && socketInstance.connected) {
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
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
};

export const postsAPI = {
  getFeed: (cursor) => api.get('/posts', { params: { cursor } }),
  create: (data) => api.post('/posts', data),
  like: (id) => api.post(`/posts/${id}/like`),
};

export const chatAPI = {
  getConversations: () => api.get('/chat/conversations'),
  getMessages: (id, cursor) => api.get(`/chat/conversations/${id}/messages`, { params: { cursor } }),
};

export const usersAPI = {
  getProfile: (id) => api.get(`/users/${id}`),
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
  list: () => api.get('/vault/documents'),
  upload: (data) => api.post('/vault/documents', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/vault/documents/${id}`),
};
