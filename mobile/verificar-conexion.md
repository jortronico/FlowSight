# ✅ Verificación de Conexión para Expo Go

## Estado del Backend

Tu backend está corriendo correctamente:
- ✅ API: `http://192.168.0.14:3001`
- ✅ Socket.IO: Inicializado
- ✅ MySQL: Conectado
- ✅ MQTT: Conectado

## 📱 Pasos para Verificar en Expo Go

### 1. Verificar desde el Navegador del Teléfono

Abre el navegador de tu teléfono (Chrome/Safari) y ve a:

```
http://192.168.0.14:3001/api/health
```

**Deberías ver:**
```json
{"status":"ok","timestamp":"...","service":"FlowSight API"}
```

- ✅ Si lo ves → El backend es accesible desde tu teléfono
- ❌ Si NO lo ves → Problema de red/firewall

### 2. Verificar Configuración en la App

Los archivos ya están configurados con:
- `mobile/src/services/api.js` → `http://192.168.0.14:3001/api`
- `mobile/src/services/socket.js` → `http://192.168.0.14:3001`

### 3. Si el Backend NO es Accesible desde el Navegador

**A. Permitir puerto en firewall:**
```powershell
netsh advfirewall firewall add rule name="FlowSight API" dir=in action=allow protocol=TCP localport=3001
```

**B. Verificar que estén en la misma WiFi:**
- PC: Conectada a WiFi
- Teléfono: Misma red WiFi
- NO usar datos móviles

### 4. Si el Backend SÍ es Accesible desde el Navegador

Pero la app móvil sigue fallando:

**A. Reinicia Expo con caché limpio:**
```bash
cd mobile
npx expo start --clear
```

**B. Cierra y vuelve a abrir Expo Go** en el teléfono

**C. Prueba login de nuevo**

### 5. Alternativa: Usar Modo Túnel

Si nada funciona, usa túnel (funciona desde cualquier red):

```bash
cd mobile
npx expo start --tunnel
```

Esto crea un túnel público, más lento pero funciona.

## 🔍 Debugging

Si quieres ver qué error exacto está ocurriendo:

1. Abre la consola de Expo en tu PC
2. Abre las DevTools en Expo Go (agita el teléfono → "Debug Remote JS")
3. Revisa los errores en la consola
