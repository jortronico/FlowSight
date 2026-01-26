-- Script SQL para verificar si existe el usuario admin
-- Ejecutar: sudo mysql < check-admin-sql.sql
-- O dentro de MySQL: source check-admin-sql.sql

USE flowsight_db;

-- Verificar si existe el usuario admin
SELECT 
    id,
    email,
    name,
    role,
    is_active,
    created_at,
    CASE 
        WHEN is_active = 1 THEN '✅ Activo'
        ELSE '❌ Inactivo'
    END as estado
FROM users 
WHERE email = 'admin@flowsight.com';

-- Si no hay resultados, el usuario no existe
-- Si hay resultados, el usuario existe

-- Mostrar todos los usuarios
SELECT 
    id,
    email,
    name,
    role,
    is_active,
    created_at
FROM users 
ORDER BY id;
