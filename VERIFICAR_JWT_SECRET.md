# Verificar JWT_SECRET en Producción

## ⚠️ Importante

El `JWT_SECRET` debe ser **exactamente el mismo** en desarrollo y producción. Si son diferentes:
- Los tokens generados en desarrollo no funcionarán en producción
- Los tokens generados en producción no funcionarán en desarrollo
- Los usuarios tendrán que hacer login nuevamente al cambiar de entorno

## Valor Actual en Desarrollo

```
JWT_SECRET=403c7bf41a037436b0561dba682516d31d435622832278b91486084eaf255dd916bf94175dbd19d48cbadc51ea8cd1639c2da58fd50ea7b85b31ed4cc79f7fe1
JWT_EXPIRES_IN=7d
```

## Verificar en el Servidor de Producción

### Método 1: Usando el Script

```bash
# En el servidor EC2
cd /var/www/alarma-api
node verify-jwt-secret.js
```

### Método 2: Verificar Manualmente

```bash
# En el servidor EC2
cd /var/www/alarma-api
cat .env | grep JWT_SECRET
```

Deberías ver:
```
JWT_SECRET=403c7bf41a037436b0561dba682516d31d435622832278b91486084eaf255dd916bf94175dbd19d48cbadc51ea8cd1639c2da58fd50ea7b85b31ed4cc79f7fe1
```

### Método 3: Comparar con Comando

```bash
# En el servidor EC2
cd /var/www/alarma-api
grep "JWT_SECRET" .env
```

## Si el JWT_SECRET es Diferente

### Opción 1: Actualizar Producción con el Valor de Desarrollo

```bash
# En el servidor EC2
cd /var/www/alarma-api
nano .env

# Cambiar JWT_SECRET a:
JWT_SECRET=403c7bf41a037436b0561dba682516d31d435622832278b91486084eaf255dd916bf94175dbd19d48cbadc51ea8cd1639c2da58fd50ea7b85b31ed4cc79f7fe1

# Guardar y reiniciar
pm2 restart alarma-api
# o
systemctl restart alarma-api
```

### Opción 2: Actualizar Desarrollo con el Valor de Producción

Si prefieres usar el valor de producción:

1. Copia el JWT_SECRET del servidor
2. Actualiza `backend/.env` local
3. Reinicia el backend local

## Verificar que Funciona

Después de sincronizar, prueba:

```bash
# 1. Hacer login
curl -X POST https://alarma.puntopedido.com.ar/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@flowsight.com","password":"admin123"}'

# 2. Copiar el token de la respuesta

# 3. Usar el token en otra petición
curl -X GET https://alarma.puntopedido.com.ar/api/auth/me \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

## Notas de Seguridad

- ⚠️ **Nunca compartas el JWT_SECRET públicamente**
- ⚠️ **No lo subas a Git** (ya está en .gitignore)
- ⚠️ **Usa un JWT_SECRET diferente para cada entorno** solo si quieres que los tokens no sean intercambiables
- ✅ **Usa el mismo JWT_SECRET** si quieres que los tokens funcionen en ambos entornos

## Generar un Nuevo JWT_SECRET

Si necesitas generar uno nuevo:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Luego actualiza `.env` en ambos entornos y reinicia los servicios.
