import { create } from 'zustand';
import api from '../services/api';

export const useAlarmStore = create((set, get) => ({
  alarms: [],
  activeAlarms: [],
  statistics: null,
  loading: false,
  error: null,

  fetchAlarms: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/alarms?${params}`);
      set({ alarms: response.data.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchActiveAlarms: async () => {
    try {
      const response = await api.get('/alarms/active');
      set({ activeAlarms: response.data.data });
    } catch (error) {
      console.error('Error fetching active alarms:', error);
    }
  },

  fetchStatistics: async () => {
    try {
      const response = await api.get('/alarms/statistics');
      set({ statistics: response.data.data });
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  },

  acknowledgeAlarm: async (id) => {
    try {
      await api.post(`/alarms/${id}/acknowledge`);
      await get().fetchActiveAlarms();
      await get().fetchStatistics();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  },

  resolveAlarm: async (id, notes) => {
    try {
      await api.post(`/alarms/${id}/resolve`, { notes });
      await get().fetchActiveAlarms();
      await get().fetchStatistics();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  },

  addAlarm: (alarm) => {
    set(state => ({
      alarms: [alarm, ...state.alarms],
      activeAlarms: alarm.status === 'active' ? [alarm, ...state.activeAlarms] : state.activeAlarms
    }));
  },

  updateAlarm: (updatedAlarm) => {
    set(state => ({
      alarms: state.alarms.map(a => a.id === updatedAlarm.id ? updatedAlarm : a),
      activeAlarms: state.activeAlarms.map(a => a.id === updatedAlarm.id ? updatedAlarm : a)
        .filter(a => a.status !== 'resolved')
    }));
  }
}));

