#!/usr/bin/env node
/**
 * Script para verificar si existe el usuario admin en la base de datos
 * Uso: node check-admin.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function checkAdmin() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'flowsight_db',
  });

  try {
    console.log('\n🔍 Verificando usuario admin en la base de datos...\n');
    console.log('─'.repeat(70));

    // Buscar usuario admin
    const [users] = await connection.execute(
      'SELECT id, email, name, role, is_active, created_at FROM users WHERE email = ?',
      ['admin@flowsight.com']
    );

    if (users.length === 0) {
      console.log('❌ El usuario admin NO existe en la base de datos');
      console.log('\n💡 Para crear el usuario admin:');
      console.log('   1. Ejecuta: node recreate-admin.js');
      console.log('   2. O ejecuta el SQL manualmente (ver SOLUCION_MYSQL_UBUNTU.md)');
    } else {
      const admin = users[0];
      console.log('✅ Usuario admin encontrado:');
      console.log('─'.repeat(70));
      console.log(`   ID: ${admin.id}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Nombre: ${admin.name}`);
      console.log(`   Rol: ${admin.role}`);
      console.log(`   Activo: ${admin.is_active ? '✅ Sí' : '❌ No'}`);
      console.log(`   Creado: ${admin.created_at}`);
      console.log('─'.repeat(70));

      // Verificar si la contraseña es "admin123"
      const [passwordCheck] = await connection.execute(
        'SELECT password FROM users WHERE email = ?',
        ['admin@flowsight.com']
      );

      if (passwordCheck.length > 0) {
        const hashFromDB = passwordCheck[0].password;
        const testPassword = 'admin123';
        
        // Verificar contraseña
        const isValid = await bcrypt.compare(testPassword, hashFromDB);
        
        if (isValid) {
          console.log('\n✅ La contraseña "admin123" es válida');
          console.log('\n📝 Credenciales para iniciar sesión:');
          console.log('   Email: admin@flowsight.com');
          console.log('   Password: admin123');
        } else {
          console.log('\n⚠️  La contraseña "admin123" NO es válida');
          console.log('   La contraseña puede haber sido cambiada');
          console.log('\n💡 Para resetear la contraseña a "admin123":');
          console.log('   Ejecuta: node recreate-admin.js');
        }
      }
    }

    // Mostrar todos los usuarios (opcional)
    console.log('\n📊 Todos los usuarios en la base de datos:');
    console.log('─'.repeat(70));
    const [allUsers] = await connection.execute(
      'SELECT id, email, name, role, is_active FROM users ORDER BY id'
    );
    
    if (allUsers.length === 0) {
      console.log('   No hay usuarios en la base de datos');
    } else {
      allUsers.forEach(user => {
        const status = user.is_active ? '✅' : '❌';
        console.log(`   ${status} [${user.role}] ${user.email} - ${user.name}`);
      });
    }

    await connection.end();
    console.log('\n✅ Verificación completada\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('   Código:', error.code);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR' || error.code === 'ER_ACCESS_DENIED_NO_PASSWORD_ERROR') {
      console.log('\n💡 Problema de autenticación MySQL');
      console.log('   Verifica tu configuración en backend/.env');
      console.log('   O consulta: backend/SOLUCION_MYSQL_UBUNTU.md');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 La base de datos no existe');
      console.log('   Ejecuta: mysql < database/init.sql');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 No se puede conectar a MySQL');
      console.log('   Verifica que MySQL esté corriendo');
      console.log('   Verifica DB_HOST y DB_PORT en .env');
    }
    
    await connection.end();
    process.exit(1);
  }
}

checkAdmin();
