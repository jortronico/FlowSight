# FlowSight Alarma - App Móvil

Aplicación móvil dedicada exclusivamente al control de la alarma del hogar.

## 📱 Características

- **Control de Alarma**: Activar/desactivar la alarma del hogar
- **Gestión de Sensores**: Ver y controlar el estado de todos los sensores
- **Control de Sirena**: Activar/desactivar la sirena manualmente
- **Horarios Automáticos**: Configurar horarios para activación/desactivación automática
- **Notificaciones en Tiempo Real**: Actualizaciones instantáneas vía Socket.IO

## 🚀 Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar la URL del backend en `src/services/api.js` y `src/services/socket.js`:
```javascript
const API_URL = 'http://TU_IP_LOCAL:3001/api';
const SOCKET_URL = 'http://TU_IP_LOCAL:3001';
```

3. Iniciar la aplicación:
```bash
npm start
```

## 📂 Estructura

```
mobile-alarm/
├── App.js                 # Componente principal
├── package.json
├── app.json
├── babel.config.js
└── src/
    ├── screens/
    │   ├── LoginScreen.js
    │   ├── HomeAlarmScreen.js
    │   └── SettingsScreen.js
    ├── stores/
    │   ├── authStore.js
    │   └── homeAlarmStore.js
    └── services/
        ├── api.js
        └── socket.js
```

## 🔧 Configuración

### Cambiar la IP del servidor

Edita los archivos:
- `src/services/api.js` - Línea 5
- `src/services/socket.js` - Línea 8

Reemplaza `192.168.0.14` con la IP de tu servidor.

## 📱 Uso

1. **Iniciar sesión**: Usa tus credenciales de FlowSight
2. **Control de Alarma**: 
   - Toca "Activar" para activar la alarma
   - Toca "Desactivar" para desactivar la alarma
3. **Sensores**: 
   - Activa/desactiva sensores individuales con el switch
4. **Horarios**: 
   - Crea horarios automáticos para activar/desactivar la alarma
   - Configura días de la semana y hora

## 🔐 Seguridad

- Autenticación mediante JWT
- Tokens almacenados de forma segura con Expo SecureStore
- Comunicación encriptada con el backend

## 📝 Notas

- Esta app está separada de la app principal de FlowSight (control de válvulas)
- Ambas apps pueden ejecutarse simultáneamente en diferentes dispositivos
- Comparten el mismo backend pero tienen funcionalidades diferentes

