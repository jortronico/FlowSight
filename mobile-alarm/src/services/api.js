import axios from 'axios';

// Cambiar esta URL según tu configuración
// Para Expo Go, usa la IP local de tu PC en la misma red WiFi
const API_URL = 'http://192.168.0.14:3001/api';

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
      console.error('   Verifica que estés en la misma WiFi que tu PC');
      console.error('   Prueba: http://192.168.0.14:3001/api/health en el navegador del teléfono');
    } else if (error.response?.status === 401) {
      // Token expirado - se manejará en el authStore
    }
    return Promise.reject(error);
  }
);

export default api;

