#!/usr/bin/env node
/**
 * Script de prueba de conexión a MySQL
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

console.log('\n🔍 Verificando configuración...\n');
console.log('─'.repeat(60));
console.log('Variables de entorno cargadas:');
console.log(`DB_HOST: ${process.env.DB_HOST || 'NO DEFINIDO'}`);
console.log(`DB_PORT: ${process.env.DB_PORT || 'NO DEFINIDO'}`);
console.log(`DB_USER: ${process.env.DB_USER || 'NO DEFINIDO'}`);
console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD ? '***' : 'VACÍO'}`);
console.log(`DB_NAME: ${process.env.DB_NAME || 'NO DEFINIDO'}`);
console.log('─'.repeat(60));

const mysql = require('mysql2/promise');

async function testConnection() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'flowsight_db',
  };

  console.log('\n🔄 Intentando conectar a MySQL...\n');
  console.log(`Configuración usada:`);
  console.log(`  Host: ${config.host}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  User: ${config.user}`);
  console.log(`  Password: ${config.password ? '***' : '(vacío)'}`);
  console.log(`  Database: ${config.database}\n`);

  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ ¡Conexión exitosa a MySQL!');
    
    // Probar una consulta simple
    const [rows] = await connection.execute('SELECT DATABASE() as current_db, USER() as current_user');
    console.log(`\n📊 Información de conexión:`);
    console.log(`   Base de datos actual: ${rows[0].current_db || '(ninguna)'}`);
    console.log(`   Usuario actual: ${rows[0].current_user || '(ninguno)'}`);
    
    // Verificar si existe la base de datos flowsight_db
    const [dbs] = await connection.execute("SHOW DATABASES LIKE 'flowsight_db'");
    if (dbs.length > 0) {
      console.log(`\n✅ La base de datos 'flowsight_db' existe`);
      
      // Verificar tablas
      await connection.execute('USE flowsight_db');
      const [tables] = await connection.execute('SHOW TABLES');
      console.log(`   Tablas encontradas: ${tables.length}`);
      if (tables.length > 0) {
        console.log(`   Tablas: ${tables.map(t => Object.values(t)[0]).join(', ')}`);
      }
    } else {
      console.log(`\n⚠️  La base de datos 'flowsight_db' NO existe`);
      console.log(`   Ejecuta: mysql -u root -p < database/init.sql`);
    }
    
    await connection.end();
    console.log('\n✅ Prueba completada exitosamente!');
    
  } catch (error) {
    console.log('\n❌ Error de conexión:');
    console.log(`   Mensaje: ${error.message}`);
    console.log(`   Código: ${error.code}`);
    console.log('\n💡 Posibles soluciones:');
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('   1. Verifica que el usuario y password sean correctos');
      console.log('   2. Verifica que el archivo backend/.env tenga:');
      console.log('      DB_USER=root');
      console.log('      DB_PASSWORD=tu_password_mysql');
      console.log('   3. Prueba conectarte manualmente a MySQL con esas credenciales');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('   1. Verifica que MySQL esté corriendo');
      console.log('   2. Abre "Servicios" en Windows y busca "MySQL"');
      console.log('   3. Asegúrate de que el servicio esté "En ejecución"');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('   1. La base de datos no existe');
      console.log('   2. Ejecuta: mysql -u root -p < database/init.sql');
    }
  }
}

testConnection();
