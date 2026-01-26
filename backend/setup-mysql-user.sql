-- Script SQL para crear usuario MySQL para FlowSight
-- Ejecutar como root: sudo mysql < setup-mysql-user.sql
-- O ejecutar dentro de MySQL: source setup-mysql-user.sql

-- Crear usuario para la aplicación (cambiar la contraseña)
CREATE USER IF NOT EXISTS 'flowsight_user'@'localhost' IDENTIFIED BY 'cambiar_esta_contraseña_segura';

-- Otorgar permisos sobre la base de datos
GRANT ALL PRIVILEGES ON flowsight_db.* TO 'flowsight_user'@'localhost';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Verificar que el usuario fue creado
SELECT user, host, plugin FROM mysql.user WHERE user='flowsight_user';

-- Mostrar permisos
SHOW GRANTS FOR 'flowsight_user'@'localhost';
