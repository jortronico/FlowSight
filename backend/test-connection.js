#!/usr/bin/env node
/**
 * Script simple para probar la conexión a MySQL
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('\n🔍 Configuración de conexión:');
console.log('─'.repeat(60));
console.log(`Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`Port: ${process.env.DB_PORT || 3306}`);
console.log(`User: ${process.env.DB_USER || 'root'}`);
console.log(`Password: ${process.env.DB_PASSWORD ? '***' + process.env.DB_PASSWORD.slice(-3) : '(vacío)'}`);
console.log(`Database: ${process.env.DB_NAME || 'flowsight_db'}`);
console.log('─'.repeat(60));

async function test() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'flowsight_db',
    });

    console.log('\n✅ ¡Conexión exitosa a MySQL!');
    await connection.end();
    console.log('✅ Conexión cerrada correctamente\n');
    
  } catch (error) {
    console.log('\n❌ Error de conexión:');
    console.log(`   ${error.message}`);
    console.log(`   Código: ${error.code}\n`);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 El usuario o password son incorrectos');
      console.log('   Verifica el archivo backend/.env\n');
    }
  }
}

test();
