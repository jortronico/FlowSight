# 🔧 Solución: Error de Conexión en Expo Go

## ✅ Estado Actual

- ✅ IP configurada: `192.168.0.14`
- ✅ Puerto accesible: `3001`
- ✅ Backend corriendo
- ✅ CORS configurado para permitir conexiones móviles

## 📋 Checklist para Expo Go

### 1. Misma Red WiFi ⚠️ IMPORTANTE

**El teléfono y la PC deben estar en la misma red WiFi**

- ✅ Conecta tu PC a WiFi
- ✅ Conecta tu teléfono a la misma WiFi
- ❌ No uses datos móviles en el teléfono
- ❌ No uses WiFi diferentes

### 2. Verificar desde el Teléfono

Abre el navegador de tu teléfono y ve a:
```
http://192.168.0.14:3001/api/health
```

**Si ves esto, funciona ✅:**
```json
{"status":"ok","timestamp":"...","service":"FlowSight API"}
```

**Si no funciona:**
- Verifica que estén en la misma WiFi
- Desactiva temporalmente el firewall

### 3. Firewall de Windows

Permitir el puerto 3001:

```powershell
# En PowerShell como Administrador
netsh advfirewall firewall add rule name="FlowSight API" dir=in action=allow protocol=TCP localport=3001
```

O desactívalo temporalmente para probar:
- Panel de Control → Sistema y Seguridad → Firewall de Windows
- Desactivar temporalmente (solo para probar)

### 4. Reiniciar Backend

Después de los cambios, reinicia el backend:

```bash
cd backend
# Detén con Ctrl+C si está corriendo
npm run dev
```

Deberías ver:
```
🚀 FlowSight API corriendo en 0.0.0.0:3001
   Accesible desde: http://localhost:3001
   Accesible desde la red: http://192.168.0.14:3001
```

### 5. Reiniciar Expo

Reinicia Expo para que cargue los cambios:

```bash
cd mobile
# Detén con Ctrl+C
npx expo start --clear
```

### 6. Probar Login

En Expo Go, intenta hacer login con:
- Email: `admin@flowsight.com`
- Password: `admin123`

## 🐛 Si Sigue sin Funcionar

### Opción A: Usar Túnel (Funciona desde cualquier red)

```bash
cd mobile
npx expo start --tunnel
```

Esto es más lento pero funciona aunque estés en redes diferentes.

### Opción B: Usar IP Pública (Requiere configuración del router)

Si tu router permite conexiones externas, puedes usar tu IP pública, pero esto requiere configurar NAT/port forwarding.

### Opción C: Usar ngrok (Túnel rápido)

```bash
# Instalar ngrok
npm install -g ngrok

# En otra terminal, crear túnel
ngrok http 3001

# Usar la URL que te da ngrok en los archivos api.js y socket.js
```

## ✅ Verificación Final

Si todo está bien, deberías poder:
1. ✅ Abrir `http://192.168.0.14:3001/api/health` desde el navegador del teléfono
2. ✅ Ver el backend corriendo en la terminal
3. ✅ Hacer login en Expo Go sin errores
