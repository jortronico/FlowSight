# 📱 Cómo Ejecutar la App React Native con Expo

## 📋 Prerrequisitos

1. ✅ Node.js instalado
2. ✅ Dependencias instaladas (`npm install` en la carpeta mobile)
3. ✅ Backend corriendo (puerto 3001)
4. ✅ Expo Go instalado en tu teléfono (opcional, para ver en dispositivo físico)

## 🚀 Pasos para Ejecutar

### 1. Instalar Dependencias (si no lo has hecho)

```bash
cd mobile
npm install
```

### 2. Configurar la IP del Servidor

**IMPORTANTE:** Antes de ejecutar, debes configurar la IP de tu computadora en estos archivos:

#### Editar `mobile/src/services/api.js`:

```javascript
// Cambia esta línea:
const API_URL = 'http://TU_IP_LOCAL:3001/api';

// Ejemplo:
const API_URL = 'http://192.168.1.100:3001/api';
```

#### Editar `mobile/src/services/socket.js`:

```javascript
// Cambia esta línea:
const SOCKET_URL = 'http://TU_IP_LOCAL:3001';

// Ejemplo:
const SOCKET_URL = 'http://192.168.1.100:3001';
```

**¿Cómo obtener tu IP local en Windows?**
```powershell
ipconfig
# Busca "Dirección IPv4" en "Adaptador de Ethernet" o "Adaptador de LAN inalámbrica"
```

### 3. Iniciar Expo

```bash
cd mobile
npx expo start
```

O si tienes Expo CLI instalado globalmente:
```bash
cd mobile
expo start
```

### 4. Ver la App - Opciones

Cuando ejecutes `expo start`, verás un código QR y opciones:

#### Opción A: Dispositivo Físico (Recomendado)
1. Instala **Expo Go** desde Play Store (Android) o App Store (iOS)
2. Escanea el código QR que aparece en la terminal
3. La app se abrirá automáticamente en tu teléfono

#### Opción B: Emulador Android
1. Asegúrate de tener Android Studio instalado y un emulador configurado
2. Presiona `a` en la terminal donde corre Expo
3. La app se abrirá en el emulador

#### Opción C: Simulador iOS (Solo Mac)
1. Asegúrate de tener Xcode instalado
2. Presiona `i` en la terminal donde corre Expo
3. La app se abrirá en el simulador

#### Opción D: Navegador Web
1. Presiona `w` en la terminal
2. Se abrirá en tu navegador (limitado)

## 🔧 Solución de Problemas

### Error: "Unable to resolve module"
```bash
# Limpia la caché y reinstala
cd mobile
rm -rf node_modules
npm install
npx expo start --clear
```

### Error de conexión al backend
- Verifica que el backend esté corriendo: `http://localhost:3001/api/health`
- Asegúrate de que la IP en `api.js` y `socket.js` sea correcta
- Verifica que el teléfono/emulador y la PC estén en la misma red WiFi

### No aparece el QR
```bash
npx expo start --tunnel
```

## 📝 Comandos Útiles

```bash
# Iniciar con caché limpio
npx expo start --clear

# Iniciar en modo desarrollo (muestra errores)
npx expo start --dev-client

# Iniciar con túnel (si estás en redes diferentes)
npx expo start --tunnel

# Verificar configuración
npx expo-doctor
```

## ⚠️ Importante

- **Asegúrate de que el backend esté corriendo** antes de iniciar la app móvil
- **Usa la misma red WiFi** para el teléfono y la computadora
- **Configura la IP correcta** en los archivos de servicios
