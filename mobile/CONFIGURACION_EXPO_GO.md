# 📱 Configuración para Expo Go

## ⚠️ Importante para Expo Go

Cuando usas **Expo Go**, el teléfono debe estar en la **misma red WiFi** que tu computadora.

## 🔧 Pasos para Configurar

### 1. Obtener tu IP Local

En Windows PowerShell:
```powershell
ipconfig | findstr /i "IPv4"
```

Ejemplo: `192.168.0.14`

### 2. Configurar la IP en la App

Edita estos dos archivos:

**`mobile/src/services/api.js`:**
```javascript
const API_URL = 'http://TU_IP_LOCAL:3001/api';
// Ejemplo:
const API_URL = 'http://192.168.0.14:3001/api';
```

**`mobile/src/services/socket.js`:**
```javascript
const SOCKET_URL = 'http://TU_IP_LOCAL:3001';
// Ejemplo:
const SOCKET_URL = 'http://192.168.0.14:3001';
```

### 3. Asegurar que el Backend esté Accesible

El backend debe estar corriendo y accesible desde la red:

```bash
cd backend
npm run dev
```

Verifica que veas:
```
🚀 FlowSight API corriendo en puerto 3001
```

### 4. Verificar desde el Teléfono

Abre el navegador de tu teléfono y ve a:
```
http://TU_IP:3001/api/health
```

Deberías ver:
```json
{"status":"ok","timestamp":"...","service":"FlowSight API"}
```

Si ves esto, el backend es accesible desde tu teléfono ✅

### 5. Iniciar Expo

```bash
cd mobile
npx expo start
```

Escanea el QR con Expo Go y prueba el login.

## 🐛 Solución de Problemas

### Error: "Network request failed"

**Causa:** Teléfono y PC no están en la misma red WiFi

**Solución:**
1. Verifica que ambos estén en la misma red
2. Conéctalos a la misma WiFi

### Error: "Connection refused"

**Causa:** Firewall bloqueando conexiones

**Solución:**
```powershell
# Permitir puerto 3001 en el firewall
netsh advfirewall firewall add rule name="FlowSight API" dir=in action=allow protocol=TCP localport=3001
```

### Error: "Timeout"

**Causa:** IP incorrecta o backend no corriendo

**Solución:**
1. Verifica que la IP sea correcta: `ipconfig`
2. Verifica que el backend esté corriendo: `http://localhost:3001/api/health`
3. Verifica que el backend escuche en todas las interfaces (0.0.0.0)

## 💡 Tip: Usar Túnel (Si WiFi no funciona)

Si no puedes usar la misma red WiFi, usa túnel:

```bash
cd mobile
npx expo start --tunnel
```

Esto creará un túnel público (más lento, pero funciona desde cualquier red).
