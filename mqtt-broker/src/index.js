require('dotenv').config();
const aedes = require('aedes')();
const { createServer } = require('net');
const tls = require('tls');
const fs = require('fs');
const path = require('path');
const ws = require('ws');
const http = require('http');

// Configuración
const MQTT_PORT = parseInt(process.env.MQTT_PORT) || 1883;
const MQTT_TLS_PORT = parseInt(process.env.MQTT_TLS_PORT) || 8883;
const WS_PORT = parseInt(process.env.MQTT_WS_PORT) || 8083;
const USERNAME = process.env.MQTT_USERNAME || 'flowsight';
const PASSWORD = process.env.MQTT_PASSWORD || 'mqtt_password';
const USE_TLS = process.env.MQTT_USE_TLS !== 'false';  // Habilitado por defecto

// Rutas de certificados (opcional)
const TLS_KEY_PATH = process.env.TLS_KEY_PATH || path.join(__dirname, '../certs/server-key.pem');
const TLS_CERT_PATH = process.env.TLS_CERT_PATH || path.join(__dirname, '../certs/server-cert.pem');
const TLS_CA_PATH = process.env.TLS_CA_PATH || path.join(__dirname, '../certs/ca-cert.pem');

// Almacenamiento de clientes y estadísticas
const stats = {
  messagesReceived: 0,
  messagesSent: 0,
  clientsConnected: 0,
  startTime: new Date()
};

// ============================================
// Autenticación por Dispositivo
// ============================================
// Base de datos de usuarios (puedes mover esto a una BD real)
const users = {
  // Usuario por defecto
  [USERNAME]: PASSWORD,
  // Dispositivos específicos
  'home_alarm_central_001': process.env.DEVICE_001_PASSWORD || 'mqtt_password',
  'sensor_escalera_001': process.env.SENSOR_ESCALERA_PASSWORD || 'mqtt_password',
  'sensor_sala_001': process.env.SENSOR_SALA_PASSWORD || 'mqtt_password',
  // Agregar más dispositivos según necesites
};

aedes.authenticate = (client, username, password, callback) => {
  const passwordStr = password ? password.toString() : '';
  
  // Permitir conexiones locales sin auth para desarrollo
  if (process.env.NODE_ENV === 'development' && !username) {
    console.log(`🔓 [DEV] Cliente ${client.id} conectado sin autenticación`);
    return callback(null, true);
  }

  // Validar credenciales por dispositivo
  if (username && users[username] === passwordStr) {
    console.log(`✅ Cliente ${client.id} autenticado como: ${username}`);
    callback(null, true);
  } else {
    console.log(`❌ Autenticación fallida para ${client.id} (usuario: ${username || 'sin usuario'})`);
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
// Servidor TCP MQTT (Puerto 1883 - Sin TLS)
// ============================================
const tcpServer = createServer(aedes.handle);

tcpServer.listen(MQTT_PORT, () => {
  console.log(`🚀 MQTT TCP (sin TLS) escuchando en puerto ${MQTT_PORT}`);
});

// ============================================
// Servidor TLS MQTT (Puerto 8883 - Con TLS)
// ============================================
let tlsServer = null;

if (USE_TLS) {
  try {
    // Verificar si existen los certificados
    const hasKey = fs.existsSync(TLS_KEY_PATH);
    const hasCert = fs.existsSync(TLS_CERT_PATH);
    
    if (hasKey && hasCert) {
      // Configurar servidor TLS con certificados
      const tlsOptions = {
        key: fs.readFileSync(TLS_KEY_PATH),
        cert: fs.readFileSync(TLS_CERT_PATH),
        rejectUnauthorized: false  // Permitir certificados autofirmados
      };
      
      // Agregar CA si existe
      if (fs.existsSync(TLS_CA_PATH)) {
        tlsOptions.ca = fs.readFileSync(TLS_CA_PATH);
      }
      
      tlsServer = tls.createServer(tlsOptions, (socket) => {
        aedes.handle(socket);
      });
      
      tlsServer.listen(MQTT_TLS_PORT, () => {
        console.log(`🔒 MQTT TLS escuchando en puerto ${MQTT_TLS_PORT}`);
        console.log(`   Certificado: ${TLS_CERT_PATH}`);
        console.log(`   Clave: ${TLS_KEY_PATH}`);
      });
      
      tlsServer.on('error', (err) => {
        console.error('❌ Error en servidor TLS:', err.message);
      });
    } else {
      console.log(`⚠️  Certificados TLS no encontrados en:`);
      console.log(`   Key: ${TLS_KEY_PATH}`);
      console.log(`   Cert: ${TLS_CERT_PATH}`);
      console.log(`   TLS deshabilitado. Para habilitar TLS:`);
      console.log(`   1. Genera certificados SSL`);
      console.log(`   2. Colócalos en la carpeta certs/`);
      console.log(`   3. Reinicia el broker`);
    }
  } catch (error) {
    console.error('❌ Error configurando TLS:', error.message);
    console.log(`   TLS deshabilitado. El broker funcionará solo en puerto ${MQTT_PORT}`);
  }
} else {
  console.log(`🔓 TLS deshabilitado (MQTT_USE_TLS=false)`);
}

// Mostrar resumen
console.log(`
╔════════════════════════════════════════════╗
║       FlowSight MQTT Broker v1.0.0         ║
╠════════════════════════════════════════════╣
║  🚀 TCP Port: ${MQTT_PORT.toString().padEnd(28)}║
${tlsServer ? `║  🔒 TLS Port: ${MQTT_TLS_PORT.toString().padEnd(28)}║` : `║  🔒 TLS Port: Disabled${' '.repeat(20)}║`}
║  🌐 WebSocket Port: ${WS_PORT.toString().padEnd(22)}║
║  🔐 Auth: ${process.env.NODE_ENV === 'development' ? 'Disabled (DEV)'.padEnd(31) : 'Enabled (Per Device)'.padEnd(31)}║
╚════════════════════════════════════════════╝
`);

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
  
  // Cerrar servidor TLS si existe
  if (tlsServer) {
    tlsServer.close(() => {
      console.log('✅ Servidor TLS cerrado');
    });
  }
  
  // Cerrar servidor TCP
  tcpServer.close(() => {
    console.log('✅ Servidor TCP cerrado');
  });
  
  aedes.close(() => {
    console.log('✅ Broker cerrado correctamente');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('❌ Error no capturado:', err);
});

module.exports = aedes;

