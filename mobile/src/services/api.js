import axios from 'axios';
import { API_URL } from '../config/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // Aumentado a 15 segundos
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log detallado de errores
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Error: Backend no está corriendo o no es accesible');
      console.error('   Verifica que el backend esté corriendo en:', API_URL);
    } else if (error.code === 'ETIMEDOUT') {
      console.error('❌ Error: Timeout - El backend no respondió a tiempo');
    } else if (error.code === 'ERR_NETWORK') {
      console.error('❌ Error: Problema de red');
      console.error('   Verifica tu conexión a internet');
      console.error(`   Prueba: ${API_URL}/health en el navegador del teléfono`);
    } else if (error.response?.status === 401) {
      // Token expirado - se manejará en el authStore
    }
    return Promise.reject(error);
  }
);

export default api;
