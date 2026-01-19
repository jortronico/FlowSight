/**
 * Script de prueba de conexión para la app móvil
 * Puedes ejecutarlo en Node.js para verificar la conectividad
 */

const axios = require('axios');

const API_URL = 'http://192.168.0.14:3001/api';

console.log('🔍 Probando conexión al backend...\n');
console.log(`URL: ${API_URL}\n`);

// Prueba 1: Health check
async function testHealth() {
  try {
    console.log('1️⃣ Probando /api/health...');
    const response = await axios.get(`${API_URL}/health`, { timeout: 5000 });
    console.log('✅ Health check exitoso:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Error en health check:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('   → El backend no está corriendo o no está accesible');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('   → Timeout: Verifica la IP y que el backend esté corriendo');
    }
    return false;
  }
}

// Prueba 2: Login
async function testLogin() {
  try {
    console.log('\n2️⃣ Probando login con admin@flowsight.com...');
    const response = await axios.post(
      `${API_URL}/auth/login`,
      {
        email: 'admin@flowsight.com',
        password: 'admin123'
      },
      { timeout: 5000 }
    );
    console.log('✅ Login exitoso!');
    console.log('   Token recibido:', response.data.data.token ? 'Sí' : 'No');
    console.log('   Usuario:', response.data.data.user.name);
    return true;
  } catch (error) {
    console.log('❌ Error en login:', error.response?.data?.message || error.message);
    if (error.response?.status === 401) {
      console.log('   → Credenciales incorrectas o usuario no existe');
    }
    return false;
  }
}

// Ejecutar pruebas
(async () => {
  const healthOk = await testHealth();
  
  if (healthOk) {
    await testLogin();
  } else {
    console.log('\n⚠️  No se puede continuar sin conexión al backend');
    console.log('\n💡 Soluciones:');
    console.log('   1. Verifica que el backend esté corriendo: cd backend && npm run dev');
    console.log('   2. Verifica que la IP 192.168.0.14 sea correcta (ipconfig)');
    console.log('   3. Verifica que el teléfono/emulador esté en la misma red WiFi');
    console.log('   4. Desactiva temporalmente el firewall de Windows');
  }
})();
