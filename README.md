# 🌊 FlowSight - Sistema IoT de Monitoreo y Control Industrial

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js" />
  <img src="https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Expo-50-black?style=for-the-badge&logo=expo" />
  <img src="https://img.shields.io/badge/MySQL-8+-orange?style=for-the-badge&logo=mysql" />
  <img src="https://img.shields.io/badge/MQTT-Aedes-purple?style=for-the-badge" />
</p>

FlowSight es un sistema completo de monitoreo y control IoT industrial que incluye:

- 📱 **App Móvil** - React Native Expo para iOS y Android
- 🖥️ **Panel Web** - React + Vite con diseño moderno
- ⚙️ **Backend API** - Node.js + Express REST API
- 🗄️ **Base de Datos** - MySQL con esquema completo
- 📡 **Broker MQTT** - Servidor MQTT propio con Aedes

## 📁 Estructura del Proyecto

```
FlowSight/
├── backend/           # API REST Node.js Express
├── web-admin/         # Panel de administración React
├── mobile/            # App React Native Expo
├── mqtt-broker/       # Broker MQTT personalizado
├── database/          # Scripts SQL para MySQL
└── README.md
```

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- MySQL 8+
- npm o yarn
- Expo CLI (`npm install -g expo-cli`)

### 1. Clonar e Instalar Dependencias

```bash
# Instalar dependencias del proyecto raíz
npm install

# Instalar dependencias de la app móvil
cd mobile && npm install && cd ..
```

### 2. Configurar Base de Datos

```bash
# Crear la base de datos y tablas
mysql -u root -p < database/init.sql
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la carpeta `backend/`:

```env
# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=flowsight_user
DB_PASSWORD=tu_password
DB_NAME=flowsight_db

# API
API_PORT=3001
JWT_SECRET=tu_jwt_secret_seguro
JWT_EXPIRES_IN=7d

# MQTT
MQTT_BROKER_HOST=localhost
MQTT_PORT=1883
MQTT_USERNAME=flowsight
MQTT_PASSWORD=mqtt_password

# Frontend
WEB_ADMIN_URL=http://localhost:5173
```

Crea un archivo `.env` en `mqtt-broker/`:

```env
MQTT_PORT=1883
MQTT_WS_PORT=8083
MQTT_USERNAME=flowsight
MQTT_PASSWORD=mqtt_password
NODE_ENV=development
```

### 4. Iniciar los Servicios

```bash
# Opción 1: Iniciar todos juntos
npm run dev

# Opción 2: Iniciar por separado
npm run backend    # API en puerto 3001
npm run mqtt       # MQTT en puerto 1883
npm run web        # Panel web en puerto 5173
npm run mobile     # App Expo
```

## 🔐 Credenciales por Defecto

### Panel Web / App Móvil
- **Email:** admin@flowsight.com
- **Password:** admin123

### MQTT Broker
- **Username:** flowsight
- **Password:** mqtt_password

## 📱 Módulos del Sistema

### 🚨 Panel de Alarmas
- Visualización de alarmas en tiempo real
- Prioridades: Crítica, Alta, Media, Baja
- Estados: Activa, Reconocida, Resuelta
- Historial y estadísticas
- Notificaciones push

### 🔧 Control de Válvulas
- Control de apertura/cierre
- Posicionamiento proporcional (0-100%)
- Tipos: On/Off, Proporcional, Modulante
- Historial de comandos
- Estados en tiempo real

### 📡 Gestión de Dispositivos
- Registro de controladores, sensores, actuadores
- Monitoreo de estado online/offline
- Heartbeat automático
- Telemetría en tiempo real

### 👥 Gestión de Usuarios
- Roles: Admin, Operador, Visualizador
- Permisos granulares
- Gestión de contraseñas

## 🛠️ API Endpoints

### Autenticación
```
POST /api/auth/login          # Iniciar sesión
POST /api/auth/register       # Registrar usuario
GET  /api/auth/me             # Perfil actual
POST /api/auth/change-password # Cambiar contraseña
```

### Alarmas
```
GET  /api/alarms              # Listar alarmas
GET  /api/alarms/active       # Alarmas activas
GET  /api/alarms/statistics   # Estadísticas
POST /api/alarms/:id/acknowledge  # Reconocer
POST /api/alarms/:id/resolve      # Resolver
```

### Válvulas
```
GET  /api/valves              # Listar válvulas
GET  /api/valves/:id          # Detalle válvula
POST /api/valves/:id/position # Establecer posición
POST /api/valves/:id/open     # Abrir válvula
POST /api/valves/:id/close    # Cerrar válvula
```

### Dispositivos
```
GET  /api/devices             # Listar dispositivos
POST /api/devices             # Crear dispositivo
PUT  /api/devices/:id         # Actualizar
DELETE /api/devices/:id       # Eliminar
```

## 📡 Topics MQTT

```
flowsight/alarms/{deviceId}/trigger     # Nueva alarma
flowsight/alarms/{alarmId}/acknowledge  # Reconocimiento

flowsight/valves/{valveId}/status       # Estado válvula
flowsight/valves/{valveId}/command      # Comando válvula
flowsight/valves/{valveId}/position     # Posición actual

flowsight/devices/{deviceId}/heartbeat  # Latido dispositivo
flowsight/devices/{deviceId}/telemetry  # Telemetría
```

## 🎨 Tecnologías

### Backend
- **Express.js** - Framework web
- **MySQL2** - Driver de base de datos
- **JWT** - Autenticación
- **Socket.IO** - Comunicación en tiempo real
- **MQTT.js** - Cliente MQTT

### Panel Web
- **React 18** - Framework UI
- **Vite** - Build tool
- **TailwindCSS** - Estilos
- **Recharts** - Gráficos
- **Zustand** - Estado global
- **Socket.IO Client** - WebSockets

### App Móvil
- **React Native** - Framework móvil
- **Expo 50** - Plataforma de desarrollo
- **React Navigation** - Navegación
- **Zustand** - Estado global
- **Expo Haptics** - Retroalimentación táctil

### MQTT Broker
- **Aedes** - Broker MQTT embebido
- **WebSocket** - Soporte para clientes web

## 📦 Scripts Disponibles

```bash
npm run dev          # Inicia backend, MQTT y web
npm run backend      # Solo backend API
npm run web          # Solo panel web
npm run mqtt         # Solo broker MQTT
npm run mobile       # Solo app Expo
npm run install:all  # Instala todas las dependencias
npm run db:setup     # Inicializa base de datos
```

## 🔧 Configuración de la App Móvil

Edita `mobile/src/services/api.js` para configurar la IP del servidor:

```javascript
const API_URL = 'http://TU_IP_LOCAL:3001/api';
```

Edita `mobile/src/services/socket.js`:

```javascript
const SOCKET_URL = 'http://TU_IP_LOCAL:3001';
```

## 🐳 Docker (Opcional)

```yaml
# docker-compose.yml
version: '3.8'
services:
  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: flowsight_db
    ports:
      - "3306:3306"
    volumes:
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
```

## 📄 Licencia

MIT © FlowSight Team

---

<p align="center">
  Desarrollado con ❤️ para la industria IoT
</p>

