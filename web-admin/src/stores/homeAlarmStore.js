import { create } from 'zustand';
import api from '../services/api';

export const useHomeAlarmStore = create((set, get) => ({
  status: null,
  sensors: [],
  schedules: [],
  history: [],
  loading: false,
  error: null,

  // Obtener estado completo
  fetchStatus: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/home-alarm/status');
      const data = response.data.data;
      set({ 
        status: data,
        sensors: data.sensors || [],
        schedules: data.schedules || [],
        loading: false 
      });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Activar alarma
  arm: async () => {
    try {
      const response = await api.post('/home-alarm/arm');
      set({ status: response.data.data });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error activando alarma' 
      };
    }
  },

  // Desactivar alarma
  disarm: async () => {
    try {
      const response = await api.post('/home-alarm/disarm');
      set({ status: response.data.data });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error desactivando alarma' 
      };
    }
  },

  // Activar sirena
  activateSiren: async () => {
    try {
      const response = await api.post('/home-alarm/siren/activate');
      set({ status: response.data.data });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error activando sirena' 
      };
    }
  },

  // Desactivar sirena
  deactivateSiren: async () => {
    try {
      const response = await api.post('/home-alarm/siren/deactivate');
      set({ status: response.data.data });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error desactivando sirena' 
      };
    }
  },

  // Resetear tamper
  resetTamper: async () => {
    try {
      const response = await api.post('/home-alarm/reset-tamper');
      set({ status: response.data.data });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error reseteando tamper' 
      };
    }
  },

  // Obtener sensores
  fetchSensors: async () => {
    try {
      const response = await api.get('/home-alarm/sensors');
      set({ sensors: response.data.data });
    } catch (error) {
      console.error('Error obteniendo sensores:', error);
    }
  },

  // Activar/desactivar sensor
  toggleSensor: async (id, enabled) => {
    try {
      const response = await api.put(`/home-alarm/sensors/${id}/toggle`, { enabled });
      set(state => ({
        sensors: state.sensors.map(s => 
          s.id === id ? response.data.data : s
        )
      }));
      return { success: true, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error actualizando sensor' 
      };
    }
  },

  // Obtener horarios
  fetchSchedules: async () => {
    try {
      const response = await api.get('/home-alarm/schedules');
      set({ schedules: response.data.data });
    } catch (error) {
      console.error('Error obteniendo horarios:', error);
    }
  },

  // Crear horario
  createSchedule: async (scheduleData) => {
    try {
      const response = await api.post('/home-alarm/schedules', scheduleData);
      set(state => ({
        schedules: [...state.schedules, response.data.data]
      }));
      return { success: true, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error creando horario' 
      };
    }
  },

  // Actualizar horario
  updateSchedule: async (id, scheduleData) => {
    try {
      const response = await api.put(`/home-alarm/schedules/${id}`, scheduleData);
      set(state => ({
        schedules: state.schedules.map(s => 
          s.id === id ? response.data.data : s
        )
      }));
      return { success: true, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error actualizando horario' 
      };
    }
  },

  // Eliminar horario
  deleteSchedule: async (id) => {
    try {
      await api.delete(`/home-alarm/schedules/${id}`);
      set(state => ({
        schedules: state.schedules.filter(s => s.id !== id)
      }));
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error eliminando horario' 
      };
    }
  },

  // Activar/desactivar horario
  toggleSchedule: async (id, enabled) => {
    try {
      const response = await api.put(`/home-alarm/schedules/${id}/toggle`, { enabled });
      set(state => ({
        schedules: state.schedules.map(s => 
          s.id === id ? response.data.data : s
        )
      }));
      return { success: true, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error actualizando horario' 
      };
    }
  },

  // Configurar activación automática
  setAutoArm: async (enabled) => {
    try {
      const response = await api.put('/home-alarm/auto-arm', { enabled });
      set({ status: response.data.data });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error actualizando configuración' 
      };
    }
  },

  // Obtener historial
  fetchHistory: async (limit = 50) => {
    try {
      const response = await api.get(`/home-alarm/history?limit=${limit}`);
      set({ history: response.data.data });
    } catch (error) {
      console.error('Error obteniendo historial:', error);
    }
  },

  // Actualizar estado desde Socket.IO
  updateStatus: (newStatus) => {
    set({ status: newStatus });
  },

  // Actualizar sensor desde Socket.IO
  updateSensor: (updatedSensor) => {
    set(state => ({
      sensors: state.sensors.map(s => 
        s.id === updatedSensor.id ? updatedSensor : s
      )
    }));
  }
}));
