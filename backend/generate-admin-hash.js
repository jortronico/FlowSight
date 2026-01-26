#!/usr/bin/env node
/**
 * Script para generar un hash bcrypt correcto para admin123
 * Uso: node generate-admin-hash.js
 */

const bcrypt = require('bcryptjs');

async function generateHash() {
  console.log('\n🔧 Generando hash bcrypt para "admin123"...\n');
  
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  console.log('✅ Hash generado:');
  console.log(hashedPassword);
  console.log('\n📝 Verificando que el hash es correcto...');
  
  // Verificar que funciona
  const isValid = await bcrypt.compare(password, hashedPassword);
  
  if (isValid) {
    console.log('✅ El hash es válido y corresponde a "admin123"');
    console.log('\n📋 Usa este hash en:');
    console.log('   1. database/init.sql (línea 245)');
    console.log('   2. backend/create-admin-direct.sql (línea 9)');
    console.log('   3. O ejecuta: node recreate-admin.js (genera y actualiza automáticamente)');
    console.log('\n💡 Para actualizar la base de datos:');
    console.log('   node recreate-admin.js');
    console.log('   # O');
    console.log('   sudo mysql < create-admin-direct.sql');
  } else {
    console.log('❌ Error: El hash generado no es válido');
    process.exit(1);
  }
  
  console.log('');
}

generateHash().catch(err => {
  console.error('❌ Error:', err.message);
  console.log('\n💡 Asegúrate de que bcryptjs esté instalado:');
  console.log('   npm install bcryptjs');
  process.exit(1);
});
