#!/usr/bin/env node
/**
 * Script para verificar usuarios en la base de datos
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function verifyUsers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'flowsight_db',
  });

  try {
    console.log('🔍 Verificando usuarios en la base de datos...\n');

    // Buscar usuarios
    const [users] = await connection.execute(
      'SELECT id, email, name, role, is_active, created_at FROM users'
    );

    if (users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
      console.log('\n✅ SOLUCIÓN: Ejecuta el script init.sql para crear usuarios');
      return;
    }

    console.log(`✅ Encontrados ${users.length} usuarios:\n`);
    
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.name})`);
      console.log(`     Rol: ${user.role}`);
      console.log(`     Activo: ${user.is_active ? 'Sí' : 'No'}`);
      console.log(`     Creado: ${user.created_at}`);
      console.log('');
    });

    // Verificar admin específico
    const [admin] = await connection.execute(
      'SELECT id, email, password FROM users WHERE email = ?',
      ['admin@flowsight.com']
    );

    if (admin.length === 0) {
      console.log('⚠️  No existe el usuario admin@flowsight.com');
      console.log('\n✅ SOLUCIÓN: Ejecuta el script init.sql para crear usuarios');
    } else {
      console.log('✅ Usuario admin@flowsight.com encontrado');
      
      // Probar password
      const testPassword = 'admin123';
      const hashFromDB = admin[0].password;
      const isValid = await bcrypt.compare(testPassword, hashFromDB);
      
      if (isValid) {
        console.log('✅ La contraseña "admin123" es correcta\n');
      } else {
        console.log('❌ La contraseña "admin123" NO es válida');
        console.log('\n💡 Esto puede significar que:');
        console.log('   1. La contraseña fue cambiada manualmente');
        console.log('   2. El hash en init.sql no corresponde a "admin123"');
        console.log('\n✅ SOLUCIÓN: Recrear el usuario admin');
      }
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Verifica tu configuración en backend/.env');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 La base de datos no existe. Ejecuta database/init.sql');
    }
    await connection.end();
  }
}

verifyUsers();
