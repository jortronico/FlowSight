import axios from 'axios';

// Cambiar esta URL según tu configuración
const API_URL = 'http://192.168.1.100:3001/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado - se manejará en el authStore
    }
    return Promise.reject(error);
  }
);

export default api;

