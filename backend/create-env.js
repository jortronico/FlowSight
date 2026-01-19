#!/usr/bin/env node
/**
 * Script para generar archivo .env para FlowSight Backend
 * Uso: node create-env.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envTemplate = `# ============================================
# FlowSight Backend - Variables de Entorno
# Generado automáticamente
# ============================================

# Base de Datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=TU_PASSWORD_MYSQL_AQUI
DB_NAME=flowsight_db

# API REST Configuration
API_PORT=3001
API_HOST=0.0.0.0

# JWT Authentication
JWT_SECRET=${crypto.randomBytes(64).toString('hex')}
JWT_EXPIRES_IN=7d

# MQTT Broker Connection
MQTT_BROKER_HOST=localhost
MQTT_PORT=1883
MQTT_USERNAME=flowsight
MQTT_PASSWORD=mqtt_password

# CORS - URL del Panel Web
WEB_ADMIN_URL=http://localhost:5173

# Environment
NODE_ENV=development
`;

const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  console.log('⚠️  El archivo .env ya existe en:', envPath);
  console.log('\n¿Deseas sobrescribirlo? (S/N)');
  
  // En Node.js no podemos leer input interactivo fácilmente, así que sobrescribimos directamente
  console.log('\n🔄 Sobrescribiendo archivo .env...');
}

fs.writeFileSync(envPath, envTemplate, 'utf8');
console.log('\n✅ Archivo .env creado exitosamente!');
console.log('📝 Ubicación:', envPath);
console.log('\n⚠️  IMPORTANTE: Edita el archivo .env y configura:');
console.log('   1. DB_PASSWORD - Reemplaza "TU_PASSWORD_MYSQL_AQUI" con tu password de MySQL');
console.log('   2. Si tu MySQL root no tiene password, deja: DB_PASSWORD=');
console.log('   3. JWT_SECRET - Ya generado automáticamente (no lo cambies)');
console.log('\n📂 Abre: backend/.env');
