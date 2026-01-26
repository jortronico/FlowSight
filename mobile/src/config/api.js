/**
 * Configuración de URLs del backend
 * 
 * Para cambiar la URL del backend, puedes:
 * 1. Crear un archivo .env en la raíz de mobile/ con:
 *    EXPO_PUBLIC_API_URL=https://tu-dominio.com
 * 
 * 2. O modificar directamente las constantes aquí
 */

// URL base del backend
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://alarma.puntopedido.com.ar';

// URL completa de la API
export const API_URL = `${API_BASE_URL}/api`;

// URL para Socket.IO (mismo dominio)
export const SOCKET_URL = API_BASE_URL;

// Configuración de desarrollo
export const IS_DEVELOPMENT = process.env.NODE_ENV !== 'production';

// Log de configuración (solo en desarrollo)
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  console.log('📱 Configuración API:');
  console.log(`   API URL: ${API_URL}`);
  console.log(`   Socket URL: ${SOCKET_URL}`);
}
