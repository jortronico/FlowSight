import axios from 'axios';

// Usar variable de entorno o URL relativa para desarrollo
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? '/api' : 'https://alarma.puntopedido.com.ar/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('flowsight-auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

