# Configuración de API - App Móvil

Guía para configurar la URL del backend en la app móvil.

## 🔧 Configuración Actual

Por defecto, la app se conecta a:
- **API**: `https://puntopedido.com.ar/api`
- **Socket.IO**: `https://puntopedido.com.ar`

## 📝 Cambiar la URL del Backend

### Opción 1: Variable de Entorno (Recomendado)

1. Crea un archivo `.env` en la raíz de la carpeta `mobile/`:

```bash
# mobile/.env
EXPO_PUBLIC_API_URL=https://tu-dominio.com
```

2. Reinicia el servidor de Expo:

```bash
cd mobile
npm start
```

### Opción 2: Modificar Directamente el Código

Edita el archivo `mobile/src/config/api.js`:

```javascript
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://tu-dominio.com';
```

## 🔐 Requisitos del Backend

El backend debe estar configurado para aceptar conexiones desde tu dominio:

1. **CORS configurado** en `backend/src/index.js`:
   ```javascript
   const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://puntopedido.com.ar';
   ```

2. **Trust proxy habilitado**:
   ```javascript
   app.set('trust proxy', true);
   ```

3. **HTTPS requerido**: El dominio debe usar HTTPS para funcionar correctamente

## 🌐 Configuración para Desarrollo Local

Si necesitas conectarte a un servidor local durante el desarrollo:

1. **Usar IP local** (solo funciona en la misma red WiFi):
   ```bash
   # mobile/.env
   EXPO_PUBLIC_API_URL=http://192.168.0.14:3001
   ```

2. **Asegúrate de que el backend permita tu IP** en CORS:
   ```javascript
   // backend/src/index.js
   const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*'; // Solo para desarrollo
   ```

## ✅ Verificar Conexión

1. **Probar API REST**:
   - Abre en el navegador: `https://puntopedido.com.ar/api/health`
   - Debe devolver: `{"status":"ok",...}`

2. **Probar desde la app**:
   - Abre la app y ve a la pantalla de Login
   - Revisa los logs en la consola de Expo
   - Deberías ver: `📱 Configuración API: API URL: ...`

## 🐛 Solución de Problemas

### Error: "Network request failed"

- Verifica que el dominio esté accesible desde internet
- Verifica que uses HTTPS (no HTTP en producción)
- Verifica que el certificado SSL sea válido

### Error: "CORS policy"

- Verifica que el backend tenga configurado el dominio correcto en CORS
- Verifica que `credentials: true` esté configurado en ambos lados

### Error: "Connection refused"

- Verifica que el backend esté corriendo
- Verifica que el puerto sea correcto (si usas IP local)
- Verifica que estés en la misma red WiFi (si usas IP local)

## 📱 Configuración en la App

La URL del servidor se muestra en:
- **Pantalla de Configuración** → "Servidor API"

## 🔄 Actualizar después de Cambios

Después de cambiar la URL:

1. **Cierra completamente la app** (no solo minimizar)
2. **Reinicia Expo**:
   ```bash
   # Presiona 'r' en la terminal de Expo para recargar
   # O reinicia con: npm start
   ```
3. **Limpia caché si es necesario**:
   ```bash
   npx expo start -c
   ```

## 📚 Archivos Relacionados

- `mobile/src/config/api.js` - Configuración centralizada
- `mobile/src/services/api.js` - Cliente HTTP (Axios)
- `mobile/src/services/socket.js` - Cliente Socket.IO
- `mobile/src/screens/SettingsScreen.js` - Pantalla de configuración
