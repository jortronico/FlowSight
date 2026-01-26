-- Script para crear/actualizar usuario admin directamente en MySQL
-- Ejecutar: sudo mysql < create-admin-direct.sql
-- O dentro de MySQL: source create-admin-direct.sql

USE flowsight_db;

-- Hash bcrypt de "admin123"
-- ⚠️ IMPORTANTE: El hash anterior era incorrecto
-- Para generar un hash correcto, ejecuta: node generate-admin-hash.js
-- O usa: node recreate-admin.js (recomendado - genera y actualiza automáticamente)
-- 
-- Hash temporal (debes generar uno nuevo):
-- SET @admin_hash = 'GENERAR_NUEVO_HASH_CON_generate-admin-hash.js';
--
-- O mejor aún, usa el script recreate-admin.js que genera el hash correcto automáticamente

-- Verificar si existe
SET @exists = (SELECT COUNT(*) FROM users WHERE email = 'admin@flowsight.com');

-- Si existe, actualizar
UPDATE users 
SET password = @admin_hash, is_active = TRUE 
WHERE email = 'admin@flowsight.com' AND @exists > 0;

-- Si no existe, crear
INSERT INTO users (email, password, name, role, is_active)
SELECT 'admin@flowsight.com', @admin_hash, 'Administrador', 'admin', TRUE
WHERE @exists = 0;

-- Verificar resultado
SELECT 
    email, 
    name, 
    role, 
    is_active,
    CASE 
        WHEN password = @admin_hash THEN '✅ Password correcto'
        ELSE '⚠️ Password diferente'
    END as password_status
FROM users 
WHERE email = 'admin@flowsight.com';
