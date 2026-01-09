const db = require('../config/database');

class DeviceModel {
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM devices WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    query += ' ORDER BY name ASC';

    const [rows] = await db.execute(query, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM devices WHERE id = ?', [id]);
    return rows[0];
  }

  static async findBySerialNumber(serialNumber) {
    const [rows] = await db.execute('SELECT * FROM devices WHERE serial_number = ?', [serialNumber]);
    return rows[0];
  }

  static async create(deviceData) {
    const { 
      serial_number, 
      name, 
      type, 
      location = null,
      description = null,
      firmware_version = null
    } = deviceData;

    const [result] = await db.execute(
      `INSERT INTO devices (serial_number, name, type, location, description, firmware_version, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'offline')`,
      [serial_number, name, type, location, description, firmware_version]
    );

    return this.findById(result.insertId);
  }

  static async update(id, deviceData) {
    const { name, type, location, description, firmware_version } = deviceData;
    
    await db.execute(
      `UPDATE devices SET name = ?, type = ?, location = ?, description = ?, firmware_version = ?, updated_at = NOW() WHERE id = ?`,
      [name, type, location, description, firmware_version, id]
    );

    return this.findById(id);
  }

  static async updateStatus(id, status) {
    await db.execute(
      'UPDATE devices SET status = ?, last_seen = NOW(), updated_at = NOW() WHERE id = ?',
      [status, id]
    );
    return this.findById(id);
  }

  static async updateHeartbeat(id) {
    await db.execute(
      'UPDATE devices SET status = "online", last_seen = NOW() WHERE id = ?',
      [id]
    );
  }

  static async delete(id) {
    await db.execute('DELETE FROM devices WHERE id = ?', [id]);
  }

  static async getStatistics() {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online,
        SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) as offline,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error
      FROM devices
    `);
    return stats[0];
  }

  static async getOfflineDevices(minutes = 5) {
    const [rows] = await db.execute(`
      SELECT * FROM devices 
      WHERE last_seen < DATE_SUB(NOW(), INTERVAL ? MINUTE) 
      AND status = 'online'
    `, [minutes]);
    return rows;
  }
}

module.exports = DeviceModel;

