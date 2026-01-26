# Verificar Hash bcrypt para admin123

## Hash a Verificar

```
$2a$10$rQnM8r6DPL9Xj.5HfT8Xh.Yd4VwWFZ5h8mQVK9gvFYd9W2gX6Kqmi
```

## Contraseña Esperada

```
admin123
```

## Verificación

### Método 1: Usando el Script (Recomendado)

En el servidor donde esté instalado bcryptjs:

```bash
cd /var/www/alarma-api
node verify-password-hash.js
```

### Método 2: Verificar desde Node.js

```bash
node -e "const bcrypt=require('bcryptjs'); bcrypt.compare('admin123', '\$2a\$10\$rQnM8r6DPL9Xj.5HfT8Xh.Yd4VwWFZ5h8mQVK9gvFYd9W2gX6Kqmi', (e,r)=>console.log(r ? '✅ CORRECTO' : '❌ INCORRECTO'))"
```

### Método 3: Verificar en la Base de Datos

Si el usuario admin ya existe en la base de datos:

```bash
cd /var/www/alarma-api
node verify-users.js
```

O usar el script check-admin.js:

```bash
node check-admin.js
```

## Resultado Esperado

Si el hash es correcto, deberías ver:
```
✅ La contraseña "admin123" es correcta
```

Si el hash NO es correcto, verás:
```
❌ La contraseña "admin123" NO es válida
```

## Si el Hash NO es Correcto

Ejecuta el script para recrear el usuario admin:

```bash
# Opción 1: Si tienes acceso MySQL normal
node recreate-admin.js

# Opción 2: Si necesitas usar sudo mysql
sudo mysql < create-admin-direct.sql
```

## Información del Hash

Este hash está en `database/init.sql` línea 245 con el comentario:
```sql
-- Usuario administrador por defecto (password: admin123)
INSERT INTO users (email, password, name, role, is_active) VALUES 
('admin@flowsight.com', '$2a$10$rQnM8r6DPL9Xj.5HfT8Xh.Yd4VwWFZ5h8mQVK9gvFYd9W2gX6Kqmi', 'Administrador', 'admin', TRUE),
```

Según el comentario, **debería** corresponder a "admin123", pero es importante verificarlo.

## Generar un Nuevo Hash

Si necesitas generar un nuevo hash de "admin123":

```bash
node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('admin123', 10, (e,h)=>console.log(h));"
```

Esto generará un nuevo hash que puedes usar para actualizar la base de datos.
