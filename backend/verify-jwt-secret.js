#!/usr/bin/env node
/**
 * Script para verificar el JWT_SECRET configurado
 * Uso: node verify-jwt-secret.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

console.log('\n🔍 Verificando configuración JWT...\n');
console.log('─'.repeat(70));

if (!JWT_SECRET) {
  console.log('❌ JWT_SECRET NO está configurado en .env');
  console.log('\n💡 Agrega JWT_SECRET a tu archivo backend/.env');
  process.exit(1);
}

console.log('✅ JWT_SECRET está configurado');
console.log(`   Longitud: ${JWT_SECRET.length} caracteres`);
console.log(`   JWT_EXPIRES_IN: ${JWT_EXPIRES_IN}`);
console.log('\n📝 JWT_SECRET (primeros 20 caracteres):');
console.log(`   ${JWT_SECRET.substring(0, 20)}...`);
console.log('\n📝 JWT_SECRET (últimos 20 caracteres):');
console.log(`   ...${JWT_SECRET.substring(JWT_SECRET.length - 20)}`);

// Verificar si es el valor esperado
const EXPECTED_SECRET = '403c7bf41a037436b0561dba682516d31d435622832278b91486084eaf255dd916bf94175dbd19d48cbadc51ea8cd1639c2da58fd50ea7b85b31ed4cc79f7fe1';

if (JWT_SECRET === EXPECTED_SECRET) {
  console.log('\n✅ JWT_SECRET coincide con el valor esperado');
} else {
  console.log('\n⚠️  JWT_SECRET NO coincide con el valor esperado');
  console.log('\n💡 IMPORTANTE:');
  console.log('   Si el JWT_SECRET es diferente en producción, los tokens');
  console.log('   generados en un servidor NO funcionarán en el otro.');
  console.log('\n📋 Para sincronizar:');
  console.log('   1. Copia el JWT_SECRET del servidor de producción');
  console.log('   2. O copia este JWT_SECRET al servidor de producción');
  console.log('   3. Reinicia el backend después de cambiar');
}

console.log('\n─'.repeat(70));
console.log('\n💡 Para verificar en el servidor de producción:');
console.log('   ssh usuario@servidor');
console.log('   cd /var/www/alarma-api');
console.log('   cat .env | grep JWT_SECRET');
console.log('   # O ejecuta este mismo script en el servidor');
console.log('   node verify-jwt-secret.js\n');
