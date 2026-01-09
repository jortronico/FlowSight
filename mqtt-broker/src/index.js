require('dotenv').config();
const aedes = require('aedes')();
const { createServer } = require('net');
const ws = require('ws');
const http = require('http');

// Configuración
const MQTT_PORT = parseInt(process.env.MQTT_PORT) || 1883;
const WS_PORT = parseInt(process.env.MQTT_WS_PORT) || 8083;
const USERNAME = process.env.MQTT_USERNAME || 'flowsight';
const PASSWORD = process.env.MQTT_PASSWORD || 'mqtt_password';

// Almacenamiento de clientes y estadísticas
const stats = {
  messagesReceived: 0,
  messagesSent: 0,
  clientsConnected: 0,
  startTime: new Date()
};

// ============================================
// Autenticación
// ============================================
aedes.authenticate = (client, username, password, callback) => {
  const passwordStr = password ? password.toString() : '';
  
  // Permitir conexiones locales sin auth para desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔓 [DEV] Cliente ${client.id} conectado sin autenticación`);
    return callback(null, true);
  }

  // Validar credenciales
  if (username === USERNAME && passwordStr === PASSWORD) {
    console.log(`✅ Cliente ${client.id} autenticado`);
    callback(null, true);
  } else {
    console.log(`❌ Autenticación fallida para ${client.id}`);
    const error = new Error('Credenciales inválidas');
    error.returnCode = 4; // Bad username or password
    callback(error, false);
  }
};

// ============================================
// Autorización de publicación
// ============================================
aedes.authorizePublish = (client, packet, callback) => {
  const topic = packet.topic;
  
  // Validar estructura de topics
  if (!topic.startsWith('flowsight/')) {
    console.log(`⚠️ Topic no autorizado: ${topic}`);
    return callback(new Error('Topic no autorizado'));
  }

  // Log de mensaje
  console.log(`📤 [${client.id}] Publica en: ${topic}`);
  stats.messagesReceived++;
  
  callback(null);
};

// ============================================
// Autorización de suscripción
// ============================================
aedes.authorizeSubscribe = (client, sub, callback) => {
  console.log(`📡 [${client.id}] Se suscribe a: ${sub.topic}`);
  callback(null, sub);
};

// ============================================
// Eventos del broker
// ============================================
aedes.on('client', (client) => {
  stats.clientsConnected++;
  console.log(`🔌 Cliente conectado: ${client.id} (Total: ${stats.clientsConnected})`);
});

aedes.on('clientDisconnect', (client) => {
  stats.clientsConnected--;
  console.log(`🔌 Cliente desconectado: ${client.id} (Total: ${stats.clientsConnected})`);
});

aedes.on('publish', (packet, client) => {
  if (client) {
    stats.messagesSent++;
  }
});

aedes.on('subscribe', (subscriptions, client) => {
  subscriptions.forEach(sub => {
    console.log(`📥 [${client.id}] Suscrito a: ${sub.topic}`);
  });
});

aedes.on('unsubscribe', (subscriptions, client) => {
  subscriptions.forEach(topic => {
    console.log(`📤 [${client.id}] Desuscrito de: ${topic}`);
  });
});

// ============================================
// Servidor TCP MQTT
// ============================================
const tcpServer = createServer(aedes.handle);

tcpServer.listen(MQTT_PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║       FlowSight MQTT Broker v1.0.0         ║
╠════════════════════════════════════════════╣
║  🚀 TCP Port: ${MQTT_PORT.toString().padEnd(28)}║
║  🌐 WebSocket Port: ${WS_PORT.toString().padEnd(22)}║
║  🔐 Auth: ${process.env.NODE_ENV === 'development' ? 'Disabled (DEV)'.padEnd(31) : 'Enabled'.padEnd(31)}║
╚════════════════════════════════════════════╝
  `);
});

// ============================================
// Servidor WebSocket para clientes web
// ============================================
const httpServer = http.createServer();
const wsServer = new ws.Server({ server: httpServer });

wsServer.on('connection', (socket, req) => {
  const stream = ws.createWebSocketStream(socket);
  aedes.handle(stream);
  console.log(`🌐 Cliente WebSocket conectado desde ${req.socket.remoteAddress}`);
});

httpServer.listen(WS_PORT, () => {
  console.log(`🌐 WebSocket MQTT escuchando en puerto ${WS_PORT}`);
});

// ============================================
// API de estadísticas (HTTP)
// ============================================
const statsServer = http.createServer((req, res) => {
  if (req.url === '/stats' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      uptime: Math.floor((Date.now() - stats.startTime.getTime()) / 1000),
      clients: stats.clientsConnected,
      messagesReceived: stats.messagesReceived,
      messagesSent: stats.messagesSent
    }));
  } else if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

statsServer.listen(8084, () => {
  console.log(`📊 API de estadísticas en http://localhost:8084/stats`);
});

// ============================================
// Manejo de errores y cierre graceful
// ============================================
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando broker MQTT...');
  aedes.close(() => {
    console.log('✅ Broker cerrado correctamente');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('❌ Error no capturado:', err);
});

module.exports = aedes;

