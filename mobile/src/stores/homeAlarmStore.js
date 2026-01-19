import { create } from 'zustand';
import api from '../services/api';

export const useHomeAlarmStore = create((set, get) => ({
  status: null,
  sensors: [],
  schedules: [],
  history: [],
  loading: false,
  error: null,

  // Cargar estado completo
  fetchStatus: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/home-alarm/status');
      set({ 
        status: response.data.data,
        sensors: response.data.data.sensors || [],
        schedules: response.data.data.schedules || [],
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
      // Actualizar sensores también
      if (response.data.data.sensors) {
        set({ sensors: response.data.data.sensors });
      }
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
      set(state => ({
        status: { ...state.status, siren_status: response.data.data.siren_status }
      }));
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
      set(state => ({
        status: { ...state.status, siren_status: response.data.data.siren_status }
      }));
      return { success: true, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error desactivando sirena' 
      };
    }
  },

  // Obtener sensores
  fetchSensors: async () => {
    try {
      const response = await api.get('/home-alarm/sensors');
      set({ sensors: response.data.data });
    } catch (error) {
      console.error('Error fetching sensors:', error);
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
      console.error('Error fetching schedules:', error);
    }
  },

  // Crear horario
  createSchedule: async (scheduleData) => {
    try {
      const response = await api.post('/home-alarm/schedules', scheduleData);
      set(state => ({
        schedules: [...state.schedules, response.data.data]
      }));
      return { success: true, data: response.data.data, message: response.data.message };
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
      return { success: true, data: response.data.data, message: response.data.message };
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
      return { success: true, message: 'Horario eliminado' };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error eliminando horario' 
      };
    }
  },

  // Habilitar/deshabilitar horario
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

  // Habilitar/deshabilitar activación automática
  setAutoArm: async (enabled) => {
    try {
      const response = await api.put('/home-alarm/auto-arm', { enabled });
      set(state => ({
        status: { ...state.status, auto_arm_enabled: enabled }
      }));
      return { success: true, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error actualizando activación automática' 
      };
    }
  },

  // Obtener historial
  fetchHistory: async (limit = 50) => {
    try {
      const response = await api.get(`/home-alarm/history?limit=${limit}`);
      set({ history: response.data.data });
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  },

  // Actualizar estado desde Socket.IO
  updateStatus: (status) => {
    set({ status });
  },

  // Actualizar sensor desde Socket.IO
  updateSensor: (sensor) => {
    set(state => ({
      sensors: state.sensors.map(s => 
        s.id === sensor.id ? sensor : s
      )
    }));
  },

  // Actualizar horario desde Socket.IO
  updateScheduleFromSocket: (schedule) => {
    set(state => {
      const exists = state.schedules.find(s => s.id === schedule.id);
      if (exists) {
        return {
          schedules: state.schedules.map(s => 
            s.id === schedule.id ? schedule : s
          )
        };
      } else {
        return {
          schedules: [...state.schedules, schedule]
        };
      }
    });
  }
}));
