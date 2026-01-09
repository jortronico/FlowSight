require('dotenv').config();
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

// Importar servicios
const mqttService = require('./services/mqtt.service');
const socketService = require('./services/socket.service');

const app = express();
const server = http.createServer(app);

// Configurar Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.WEB_ADMIN_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Middlewares
app.use(helmet());
app.use(cors());
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

server.listen(PORT, () => {
  console.log(`🚀 FlowSight API corriendo en puerto ${PORT}`);
  
  // Inicializar Socket.IO
  socketService.initialize(io);
  
  // Conectar al broker MQTT
  mqttService.connect();
});

module.exports = { app, io };

