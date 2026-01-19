#!/usr/bin/env node
/**
 * Script para verificar que el archivo .env se carga correctamente
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

console.log('\n🔍 Verificando archivo .env...\n');
console.log('─'.repeat(70));

// Leer el archivo directamente
const fs = require('fs');
const envPath = require('path').join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  console.log('❌ El archivo .env NO existe!');
  console.log('   Ejecuta: node create-env.js');
  process.exit(1);
}

console.log('✅ Archivo .env encontrado en:', envPath);
console.log('\n📝 Contenido del archivo .env (solo variables DB_):');
console.log('─'.repeat(70));

const fileContent = fs.readFileSync(envPath, 'utf8');
const dbLines = fileContent.split('\n').filter(line => 
  line.trim().startsWith('DB_') && !line.trim().startsWith('#')
);

dbLines.forEach(line => {
  const trimmed = line.trim();
  if (trimmed) {
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=');
    if (key === 'DB_PASSWORD') {
      console.log(`${key}=${value ? (value === 'TU_PASSWORD_MYSQL_AQUI' ? '⚠️ NO CONFIGURADO' : '***' + value.slice(-3)) : '(vacío)'}`);
    } else {
      console.log(`${key}=${value}`);
    }
  }
});

console.log('\n📊 Variables cargadas en process.env:');
console.log('─'.repeat(70));
console.log(`DB_HOST: ${process.env.DB_HOST || '❌ NO DEFINIDO'}`);
console.log(`DB_PORT: ${process.env.DB_PORT || '❌ NO DEFINIDO'}`);
console.log(`DB_USER: ${process.env.DB_USER || '❌ NO DEFINIDO'}`);
console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD ? (process.env.DB_PASSWORD === 'TU_PASSWORD_MYSQL_AQUI' ? '⚠️ NO CONFIGURADO' : '***' + process.env.DB_PASSWORD.slice(-3)) : '❌ VACÍO O NO DEFINIDO'}`);
console.log(`DB_NAME: ${process.env.DB_NAME || '❌ NO DEFINIDO'}`);

console.log('\n─'.repeat(70));

// Verificar si el password está configurado
if (!process.env.DB_PASSWORD || process.env.DB_PASSWORD === 'TU_PASSWORD_MYSQL_AQUI') {
  console.log('\n⚠️  PROBLEMA DETECTADO:');
  console.log('   DB_PASSWORD no está configurado o tiene el valor por defecto');
  console.log('\n✅ SOLUCIÓN:');
  console.log('   1. Abre el archivo: backend/.env');
  console.log('   2. Busca la línea: DB_PASSWORD=TU_PASSWORD_MYSQL_AQUI');
  console.log('   3. Reemplázala con tu password de MySQL:');
  console.log('      DB_PASSWORD=tu_password_mysql');
  console.log('   4. Si tu MySQL root no tiene password, deja:');
  console.log('      DB_PASSWORD=');
} else if (process.env.DB_PASSWORD === '') {
  console.log('\n✅ Password configurado como vacío (MySQL sin password)');
  console.log('   Esto debería funcionar si tu MySQL root no tiene password');
} else {
  console.log('\n✅ Password configurado correctamente');
}

console.log('\n💡 Después de editar .env, reinicia el servidor Node.js');
