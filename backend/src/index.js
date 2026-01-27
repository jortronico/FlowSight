// Cargar variables de entorno desde backend/.env
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const alarmRoutes = require('./routes/alarm.routes');
const valveRoutes = require('./routes/valve.routes');
const deviceRoutes = require('./routes/device.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const homeAlarmRoutes = require('./routes/homeAlarm.routes');
const homeAlarmDeviceRoutes = require('./routes/homeAlarmDevice.routes');

// Importar servicios
const mqttService = require('./services/mqtt.service');
const socketService = require('./services/socket.service');

const app = express();
const server = http.createServer(app);

// Configurar trust proxy para trabajar detrás de un reverse proxy
app.set('trust proxy', true);

// Configurar origen permitido (usar variable de entorno o dominio por defecto)
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://puntopedido.com.ar';

// Configurar Socket.IO
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Middlewares
app.use(helmet());
// Configurar CORS para permitir conexiones desde el dominio específico
app.use(cors({
  origin: ALLOWED_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/alarms', alarmRoutes);
app.use('/api/valves', valveRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/dashboard', dashboardRoutes);
// IMPORTANTE: Montar rutas de dispositivos ANTES de las rutas generales de home-alarm
// para que no se aplique el middleware JWT de homeAlarmRoutes
app.use('/api/home-alarm/device', homeAlarmDeviceRoutes);
app.use('/api/home-alarm', homeAlarmRoutes);

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'FlowSight API'
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Ruta no encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Inicializar servicios
const PORT = process.env.API_PORT || 3001;
const HOST = process.env.API_HOST || '0.0.0.0'; // Escuchar en todas las interfaces

server.listen(PORT, HOST, () => {
  console.log(`🚀 FlowSight API corriendo en ${HOST}:${PORT}`);
  console.log(`   Accesible desde: http://localhost:${PORT}`);
  console.log(`   Accesible desde la red: http://192.168.0.14:${PORT}`);
  console.log(`   Origen permitido (CORS): ${ALLOWED_ORIGIN}`);
  console.log(`   Trust proxy: habilitado`);
  
  // Inicializar Socket.IO
  socketService.initialize(io);
  
  // Conectar al broker MQTT
  mqttService.connect();
});

module.exports = { app, io };

