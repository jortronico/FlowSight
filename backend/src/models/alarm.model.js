const db = require('../config/database');

class AlarmModel {
  static async findAll(filters = {}) {
    let query = `
      SELECT a.*, d.name as device_name, d.location as device_location 
      FROM alarms a 
      LEFT JOIN devices d ON a.device_id = d.id 
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += ' AND a.status = ?';
      params.push(filters.status);
    }

    if (filters.priority) {
      query += ' AND a.priority = ?';
      params.push(filters.priority);
    }

    if (filters.device_id) {
      query += ' AND a.device_id = ?';
      params.push(filters.device_id);
    }

    query += ' ORDER BY a.triggered_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    const [rows] = await db.execute(query, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.execute(
      `SELECT a.*, d.name as device_name, d.location as device_location 
       FROM alarms a 
       LEFT JOIN devices d ON a.device_id = d.id 
       WHERE a.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async findActiveAlarms() {
    const [rows] = await db.execute(
      `SELECT a.*, d.name as device_name, d.location as device_location 
       FROM alarms a 
       LEFT JOIN devices d ON a.device_id = d.id 
       WHERE a.status IN ('active', 'acknowledged')
       ORDER BY a.priority DESC, a.triggered_at DESC`
    );
    return rows;
  }

  static async create(alarmData) {
    const { 
      device_id, 
      type, 
      message, 
      priority = 'medium', 
      value = null,
      threshold = null 
    } = alarmData;

    const [result] = await db.execute(
      `INSERT INTO alarms (device_id, type, message, priority, value, threshold, status, triggered_at) 
       VALUES (?, ?, ?, ?, ?, ?, 'active', NOW())`,
      [device_id, type, message, priority, value, threshold]
    );

    return this.findById(result.insertId);
  }

  static async acknowledge(id, userId) {
    await db.execute(
      `UPDATE alarms SET status = 'acknowledged', acknowledged_by = ?, acknowledged_at = NOW() WHERE id = ?`,
      [userId, id]
    );
    return this.findById(id);
  }

  static async resolve(id, userId, notes = null) {
    await db.execute(
      `UPDATE alarms SET status = 'resolved', resolved_by = ?, resolved_at = NOW(), notes = ? WHERE id = ?`,
      [userId, notes, id]
    );
    return this.findById(id);
  }

  static async getStatistics() {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'acknowledged' THEN 1 ELSE 0 END) as acknowledged,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN priority = 'critical' AND status = 'active' THEN 1 ELSE 0 END) as critical_active,
        SUM(CASE WHEN priority = 'high' AND status = 'active' THEN 1 ELSE 0 END) as high_active
      FROM alarms
      WHERE triggered_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);
    return stats[0];
  }

  static async getHistory(days = 7) {
    const [rows] = await db.execute(`
      SELECT 
        DATE(triggered_at) as date,
        COUNT(*) as count,
        priority
      FROM alarms
      WHERE triggered_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(triggered_at), priority
      ORDER BY date DESC
    `, [days]);
    return rows;
  }
}

module.exports = AlarmModel;

