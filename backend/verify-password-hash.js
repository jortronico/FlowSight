#!/usr/bin/env node
/**
 * Script para verificar si un hash bcrypt corresponde a una contraseña
 * Uso: node verify-password-hash.js
 * 
 * Nota: Requiere que bcryptjs esté instalado (npm install)
 */

const bcrypt = require('bcryptjs');

// Hash del usuario admin (del archivo init.sql)
const hashFromDB = '$2a$10$rQnM8r6DPL9Xj.5HfT8Xh.Yd4VwWFZ5h8mQVK9gvFYd9W2gX6Kqmi';
const password = 'admin123';

async function verifyHash() {
  console.log('\n🔍 Verificando hash bcrypt...\n');
  console.log('─'.repeat(70));
  console.log('Hash a verificar:');
  console.log(hashFromDB);
  console.log('\nContraseña a comparar: admin123');
  console.log('─'.repeat(70));

  try {
    // Verificar si el hash corresponde a la contraseña
    const isValid = await bcrypt.compare(password, hashFromDB);
    
    if (isValid) {
      console.log('\n✅ ¡CORRECTO!');
      console.log('   El hash SÍ corresponde a la contraseña "admin123"');
      console.log('\n📝 Esto significa que:');
      console.log('   - El usuario admin puede iniciar sesión con:');
      console.log('     Email: admin@flowsight.com');
      console.log('     Password: admin123');
      console.log('\n✅ El hash en init.sql es correcto');
    } else {
      console.log('\n❌ INCORRECTO');
      console.log('   El hash NO corresponde a la contraseña "admin123"');
      console.log('\n💡 Esto significa que:');
      console.log('   - La contraseña del admin es diferente');
      console.log('   - O el hash fue generado con otra contraseña');
      console.log('\n✅ SOLUCIÓN:');
      console.log('   Ejecuta: node recreate-admin.js');
      console.log('   Esto actualizará el hash a "admin123"');
    }
    
    console.log('\n─'.repeat(70));
    console.log('\n💡 Para generar un nuevo hash de "admin123":');
    console.log('   node -e "const bcrypt=require(\'bcryptjs\'); bcrypt.hash(\'admin123\', 10, (e,h)=>console.log(h));"');
    console.log('');
  } catch (error) {
    console.error('\n❌ Error al verificar:', error.message);
    console.log('\n💡 Asegúrate de que bcryptjs esté instalado:');
    console.log('   npm install bcryptjs');
    process.exit(1);
  }
}

verifyHash();
