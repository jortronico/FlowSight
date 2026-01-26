#!/usr/bin/env node
/**
 * Script alternativo para recrear el usuario admin usando sudo mysql
 * Este script ejecuta comandos SQL directamente sin autenticación por contraseña
 * 
 * Uso: sudo node recreate-admin-sudo.js
 * O ejecutar los comandos SQL manualmente en MySQL
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '.env') });

const DB_NAME = process.env.DB_NAME || 'flowsight_db';

async function generatePasswordHash() {
  const password = 'admin123';
  // Usar bcrypt de forma síncrona para el script
  const salt = '$2a$10$' + require('crypto').randomBytes(16).toString('base64').slice(0, 22);
  // Nota: Esto es una aproximación. En producción, usa bcrypt.hash() asíncrono
  // Para este script, vamos a generar el hash de otra manera
  return new Promise((resolve) => {
    const bcrypt = require('bcryptjs');
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        console.error('Error generando hash:', err);
        process.exit(1);
      }
      resolve(hash);
    });
  });
}

async function recreateAdminWithSudo() {
  try {
    console.log('🔧 Recreando usuario administrador usando sudo mysql...\n');
    
    // Generar hash de password
    console.log('📝 Generando hash de contraseña...');
    const hashedPassword = await generatePasswordHash();
    
    // Crear script SQL temporal
    const sqlScript = `
USE ${DB_NAME};

-- Verificar si existe el usuario admin
SET @admin_exists = (SELECT COUNT(*) FROM users WHERE email = 'admin@flowsight.com');

-- Si existe, actualizar password
SET @sql_update = IF(@admin_exists > 0,
  CONCAT('UPDATE users SET password = ''', '${hashedPassword.replace(/'/g, "''")}', ''', is_active = TRUE WHERE email = ''admin@flowsight.com'''),
  'SELECT ''Usuario no existe, se creará'' as message'
);

PREPARE stmt FROM @sql_update;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Si no existe, crear nuevo usuario
INSERT INTO users (email, password, name, role, is_active)
SELECT 'admin@flowsight.com', '${hashedPassword.replace(/'/g, "''")}', 'Administrador', 'admin', TRUE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@flowsight.com');

SELECT 'Usuario admin configurado correctamente' as resultado;
SELECT email, name, role, is_active FROM users WHERE email = 'admin@flowsight.com';
`;

    // Guardar script temporal
    const tempFile = path.join(__dirname, 'temp_admin_script.sql');
    fs.writeFileSync(tempFile, sqlScript);
    
    console.log('📋 Ejecutando comandos SQL...\n');
    console.log('⚠️  NOTA: Este método requiere acceso sudo a MySQL');
    console.log('   Alternativamente, ejecuta estos comandos manualmente:\n');
    console.log('   sudo mysql');
    console.log(`   USE ${DB_NAME};`);
    console.log('   -- Luego ejecuta el script SQL que se generó en:', tempFile);
    console.log('');
    
    // Intentar ejecutar con sudo mysql
    try {
      const output = execSync(`sudo mysql < "${tempFile}"`, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      console.log(output);
      console.log('\n✅ Usuario admin configurado exitosamente!');
      console.log('   Email: admin@flowsight.com');
      console.log('   Password: admin123');
      console.log('   Rol: admin\n');
    } catch (error) {
      console.log('⚠️  No se pudo ejecutar automáticamente con sudo');
      console.log('\n📝 INSTRUCCIONES MANUALES:');
      console.log('   1. Ejecuta: sudo mysql');
      console.log(`   2. Ejecuta: USE ${DB_NAME};`);
      console.log('   3. Copia y pega el siguiente SQL:\n');
      console.log('--- INICIO SQL ---');
      console.log(sqlScript);
      console.log('--- FIN SQL ---\n');
    }
    
    // Limpiar archivo temporal
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Método alternativo: mostrar instrucciones SQL directas
function showManualInstructions() {
  console.log('\n📋 MÉTODO ALTERNATIVO - Ejecutar manualmente:\n');
  console.log('1. Conecta a MySQL como root:');
  console.log('   sudo mysql\n');
  console.log(`2. Selecciona la base de datos:`);
  console.log(`   USE ${DB_NAME};\n`);
  console.log('3. Ejecuta estos comandos SQL:\n');
  console.log('   -- Verificar si existe');
  console.log("   SELECT * FROM users WHERE email = 'admin@flowsight.com';");
  console.log('');
  console.log('   -- Si existe, actualizar (reemplaza HASH_AQUI con el hash bcrypt):');
  console.log("   UPDATE users SET password = 'HASH_AQUI', is_active = TRUE WHERE email = 'admin@flowsight.com';");
  console.log('');
  console.log('   -- Si no existe, crear:');
  console.log("   INSERT INTO users (email, password, name, role, is_active) VALUES ('admin@flowsight.com', 'HASH_AQUI', 'Administrador', 'admin', TRUE);");
  console.log('');
  console.log('💡 Para generar el hash de "admin123", ejecuta en Node.js:');
  console.log('   node -e "const bcrypt=require(\'bcryptjs\'); bcrypt.hash(\'admin123\', 10, (e,h)=>console.log(h));"');
  console.log('');
}

// Ejecutar
if (require.main === module) {
  const useSudo = process.argv.includes('--sudo');
  if (useSudo) {
    recreateAdminWithSudo();
  } else {
    showManualInstructions();
    console.log('\n💡 Para intentar ejecución automática con sudo:');
    console.log('   sudo node recreate-admin-sudo.js --sudo\n');
  }
}

module.exports = { recreateAdminWithSudo, showManualInstructions };
