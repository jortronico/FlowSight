# Solución: Hash bcrypt Incorrecto

## Problema

El hash en `database/init.sql`:
```
$2a$10$rQnM8r6DPL9Xj.5HfT8Xh.Yd4VwWFZ5h8mQVK9gvFYd9W2gX6Kqmi
```

**NO corresponde** a la contraseña "admin123".

## Solución Rápida

### Opción 1: Usar el Script recreate-admin.js (RECOMENDADO)

Este script genera un hash correcto automáticamente y actualiza la base de datos:

```bash
cd /var/www/alarma-api
node recreate-admin.js
```

**Ventajas:**
- Genera el hash correcto automáticamente
- Actualiza la base de datos directamente
- No necesitas copiar/pegar hashes

### Opción 2: Generar Hash y Actualizar Manualmente

1. **Generar un hash correcto:**

```bash
cd /var/www/alarma-api
node generate-admin-hash.js
```

Esto mostrará un hash correcto. Copia ese hash.

2. **Actualizar create-admin-direct.sql:**

Edita `backend/create-admin-direct.sql` y reemplaza la línea 9 con el nuevo hash:

```sql
SET @admin_hash = 'NUEVO_HASH_AQUI';
```

3. **Ejecutar el SQL:**

```bash
sudo mysql < create-admin-direct.sql
```

### Opción 3: Actualizar init.sql para Futuras Instalaciones

Si quieres corregir el archivo `init.sql` para futuras instalaciones:

1. Genera el hash correcto (ver Opción 2)
2. Edita `database/init.sql` línea 245
3. Reemplaza el hash incorrecto con el correcto

## Verificar que Funciona

Después de actualizar, verifica:

```bash
# Verificar en la base de datos
node check-admin.js

# O probar login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@flowsight.com","password":"admin123"}'
```

Deberías obtener un token JWT si funciona correctamente.

## Hash Correcto (Ejemplo)

Un hash bcrypt válido para "admin123" se verá así:
```
$2a$10$[22 caracteres aleatorios].[31 caracteres aleatorios]
```

**Importante:** Cada vez que generas un hash, será diferente (por el salt aleatorio), pero todos serán válidos para "admin123".

## Comandos Útiles

```bash
# Generar hash
node generate-admin-hash.js

# Verificar hash
node verify-password-hash.js

# Actualizar admin en BD
node recreate-admin.js

# Verificar admin en BD
node check-admin.js
```
