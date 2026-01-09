import { create } from 'zustand';
import api from '../services/api';

export const useValveStore = create((set, get) => ({
  valves: [],
  statistics: null,
  loading: false,
  error: null,

  fetchValves: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/valves?${params}`);
      set({ valves: response.data.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchStatistics: async () => {
    try {
      const response = await api.get('/valves/statistics');
      set({ statistics: response.data.data });
    } catch (error) {
      console.error('Error fetching valve statistics:', error);
    }
  },

  setPosition: async (id, position) => {
    try {
      const response = await api.post(`/valves/${id}/position`, { position });
      get().updateValve(response.data.data);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  },

  openValve: async (id) => {
    try {
      const response = await api.post(`/valves/${id}/open`);
      get().updateValve(response.data.data);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  },

  closeValve: async (id) => {
    try {
      const response = await api.post(`/valves/${id}/close`);
      get().updateValve(response.data.data);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  },

  updateValve: (updatedValve) => {
    set(state => ({
      valves: state.valves.map(v => v.id === updatedValve.id ? updatedValve : v)
    }));
  }
}));

