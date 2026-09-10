import { create } from 'zustand';
import { authAPI, disconnectSocket } from '../api';

export const useAuthStore = create((set, get) => ({
  isAuthenticated: false,
  user: null,
  userRole: null,
  isLoading: true,

  checkAuth: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ isAuthenticated: false, user: null, userRole: null, isLoading: false });
      return false;
    }

    try {
      const res = await authAPI.me();
      const user = res.data.data.user;
      set({ 
        isAuthenticated: true, 
        user, 
        userRole: user.role.toLowerCase(), 
        isLoading: false 
      });
      return true;
    } catch (error) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({ isAuthenticated: false, user: null, userRole: null, isLoading: false });
      return false;
    }
  },

  login: async (credentials) => {
    const res = await authAPI.login(credentials);
    const { user, tokens } = res.data.data;
    
    localStorage.setItem('access_token', tokens.accessToken);
    localStorage.setItem('refresh_token', tokens.refreshToken);
    
    set({
      isAuthenticated: true,
      user,
      userRole: user.role.toLowerCase()
    });
    return user;
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      disconnectSocket();
      set({ isAuthenticated: false, user: null, userRole: null });
    }
  },

  setUserRole: (role) => set({ userRole: role })
}));
