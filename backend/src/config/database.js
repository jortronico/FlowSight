const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'flowsight_user',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'flowsight_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Verificar conexión
pool.getConnection()
  .then(connection => {
    console.log('✅ Conexión a MySQL establecida');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Error conectando a MySQL:', err.message);
  });

module.exports = pool;

