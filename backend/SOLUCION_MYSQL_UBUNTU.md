# Solución: Error de Acceso a MySQL en Ubuntu

## Problema

Al ejecutar `node recreate-admin.js` en Ubuntu, obtienes el error:
```
Error: Access denied for user 'root'@'localhost'
code: 'ER_ACCESS_DENIED_NO_PASSWORD_ERROR'
```

## Causa

En Ubuntu, MySQL/MariaDB está configurado para usar autenticación por **socket** (`auth_socket`) en lugar de contraseña para el usuario `root`. Esto significa que `root` solo puede conectarse desde la línea de comandos del sistema, no desde aplicaciones Node.js.

## Soluciones

### Opción 1: Crear un Usuario MySQL Dedicado (RECOMENDADO)

Esta es la mejor práctica para producción:

1. **Conecta a MySQL como root:**
   ```bash
   sudo mysql
   ```

2. **Crea un usuario específico para la aplicación:**
   ```sql
   CREATE USER 'flowsight_user'@'localhost' IDENTIFIED BY 'tu_contraseña_segura_aqui';
   GRANT ALL PRIVILEGES ON flowsight_db.* TO 'flowsight_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

3. **Actualiza tu archivo `.env`:**
   ```env
   DB_USER=flowsight_user
   DB_PASSWORD=tu_contraseña_segura_aqui
   ```

4. **Ahora ejecuta el script:**
   ```bash
   node recreate-admin.js
   ```

### Opción 2: Cambiar Autenticación de Root a Contraseña

Si prefieres usar root con contraseña:

1. **Conecta a MySQL:**
   ```bash
   sudo mysql
   ```

2. **Cambia el método de autenticación:**
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'tu_contraseña_aqui';
   FLUSH PRIVILEGES;
   EXIT;
   ```

3. **Actualiza tu `.env`:**
   ```env
   DB_USER=root
   DB_PASSWORD=tu_contraseña_aqui
   ```

4. **Ejecuta el script:**
   ```bash
   node recreate-admin.js
   ```

### Opción 3: Ejecutar SQL Directamente con Sudo

Si solo necesitas crear el usuario admin rápidamente:

1. **Genera el hash de la contraseña "admin123":**
   ```bash
   node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('admin123', 10, (e,h)=>console.log(h));"
   ```
   Copia el hash que se muestra (ejemplo: `$2a$10$...`)

2. **Conecta a MySQL:**
   ```bash
   sudo mysql
   ```

3. **Ejecuta estos comandos SQL:**
   ```sql
   USE flowsight_db;
   
   -- Verificar si existe
   SELECT * FROM users WHERE email = 'admin@flowsight.com';
   
   -- Si existe, actualizar (reemplaza HASH_AQUI con el hash generado)
   UPDATE users SET password = 'HASH_AQUI', is_active = TRUE WHERE email = 'admin@flowsight.com';
   
   -- Si no existe, crear (reemplaza HASH_AQUI con el hash generado)
   INSERT INTO users (email, password, name, role, is_active) 
   VALUES ('admin@flowsight.com', 'HASH_AQUI', 'Administrador', 'admin', TRUE);
   
   -- Verificar
   SELECT email, name, role, is_active FROM users WHERE email = 'admin@flowsight.com';
   ```

## Verificar Configuración

Después de configurar, verifica la conexión:

```bash
node test-connection.js
```

O verifica los usuarios:

```bash
node verify-users.js
```

## Credenciales del Admin en la Web

Una vez configurado, las credenciales para iniciar sesión son:
- **Email:** `admin@flowsight.com`
- **Password:** `admin123`

## Notas de Seguridad

- ⚠️ **Nunca uses `root` en producción** - Crea un usuario dedicado
- ⚠️ **Usa contraseñas seguras** - Genera contraseñas aleatorias
- ⚠️ **Limita permisos** - Solo otorga los permisos necesarios
- ⚠️ **Cambia la contraseña por defecto** - `admin123` es solo para desarrollo
