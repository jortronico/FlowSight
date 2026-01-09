import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,

  initAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const userStr = await SecureStore.getItemAsync('user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        set({ user, token, isAuthenticated: true, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data.data;
      
      await SecureStore.setItemAsync('token', token);
      await SecureStore.setItemAsync('user', JSON.stringify(user));
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      set({ user, token, isAuthenticated: true });
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error de conexión' 
      };
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    delete api.defaults.headers.common['Authorization'];
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (userData) => {
    set({ user: { ...get().user, ...userData } });
  }
}));

