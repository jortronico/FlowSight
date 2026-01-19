#!/usr/bin/env node
/**
 * Script para recrear el usuario admin con password admin123
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function recreateAdmin() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'flowsight_db',
  });

  try {
    console.log('🔧 Recreando usuario administrador...\n');

    // Generar hash de password admin123
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Verificar si existe
    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      ['admin@flowsight.com']
    );

    if (existing.length > 0) {
      // Actualizar password
      await connection.execute(
        'UPDATE users SET password = ?, is_active = TRUE WHERE email = ?',
        [hashedPassword, 'admin@flowsight.com']
      );
      console.log('✅ Password del admin actualizado');
    } else {
      // Crear nuevo usuario
      await connection.execute(
        'INSERT INTO users (email, password, name, role, is_active) VALUES (?, ?, ?, ?, ?)',
        [hashedPassword, 'admin@flowsight.com', 'Administrador', 'admin', true]
      );
      console.log('✅ Usuario admin creado');
    }

    console.log('\n✅ Usuario admin configurado:');
    console.log('   Email: admin@flowsight.com');
    console.log('   Password: admin123');
    console.log('   Rol: admin\n');

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await connection.end();
    process.exit(1);
  }
}

recreateAdmin();
