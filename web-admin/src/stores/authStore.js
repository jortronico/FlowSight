import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        try {
          const response = await api.post('/auth/login', { email, password });
          const { token, user } = response.data.data;
          
          set({ user, token, isAuthenticated: true });
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          return { success: true };
        } catch (error) {
          return { 
            success: false, 
            message: error.response?.data?.message || 'Error de conexión' 
          };
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        delete api.defaults.headers.common['Authorization'];
      },

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
      },

      initAuth: () => {
        const { token } = get();
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      }
    }),
    {
      name: 'flowsight-auth',
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated })
    }
  )
);

// Inicializar auth al cargar
useAuthStore.getState().initAuth();

