const db = require('../config/database');

class ValveModel {
  static async findAll(filters = {}) {
    let query = `
      SELECT v.*, d.name as device_name, d.location as device_location 
      FROM valves v 
      LEFT JOIN devices d ON v.device_id = d.id 
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += ' AND v.status = ?';
      params.push(filters.status);
    }

    if (filters.device_id) {
      query += ' AND v.device_id = ?';
      params.push(filters.device_id);
    }

    query += ' ORDER BY v.name ASC';

    const [rows] = await db.execute(query, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.execute(
      `SELECT v.*, d.name as device_name, d.location as device_location 
       FROM valves v 
       LEFT JOIN devices d ON v.device_id = d.id 
       WHERE v.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async create(valveData) {
    const { 
      device_id, 
      name, 
      description = null,
      type = 'on_off',
      min_position = 0,
      max_position = 100
    } = valveData;

    const [result] = await db.execute(
      `INSERT INTO valves (device_id, name, description, type, min_position, max_position, current_position, status) 
       VALUES (?, ?, ?, ?, ?, ?, 0, 'closed')`,
      [device_id, name, description, type, min_position, max_position]
    );

    return this.findById(result.insertId);
  }

  static async update(id, valveData) {
    const { name, description, type, min_position, max_position } = valveData;
    
    await db.execute(
      `UPDATE valves SET name = ?, description = ?, type = ?, min_position = ?, max_position = ?, updated_at = NOW() WHERE id = ?`,
      [name, description, type, min_position, max_position, id]
    );

    return this.findById(id);
  }

  static async updateStatus(id, status, position = null) {
    let query = 'UPDATE valves SET status = ?, updated_at = NOW()';
    const params = [status];

    if (position !== null) {
      query += ', current_position = ?';
      params.push(position);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await db.execute(query, params);
    return this.findById(id);
  }

  static async setPosition(id, position, userId) {
    const valve = await this.findById(id);
    if (!valve) return null;

    // Validar posición
    const clampedPosition = Math.max(
      valve.min_position, 
      Math.min(valve.max_position, position)
    );

    const status = clampedPosition === 0 ? 'closed' : 
                   clampedPosition === 100 ? 'open' : 'partial';

    await db.execute(
      `UPDATE valves SET current_position = ?, target_position = ?, status = ?, last_commanded_by = ?, last_commanded_at = NOW(), updated_at = NOW() WHERE id = ?`,
      [clampedPosition, position, status, userId, id]
    );

    // Registrar en historial
    await db.execute(
      `INSERT INTO valve_history (valve_id, position, commanded_by, commanded_at) VALUES (?, ?, ?, NOW())`,
      [id, clampedPosition, userId]
    );

    return this.findById(id);
  }

  static async delete(id) {
    await db.execute('DELETE FROM valves WHERE id = ?', [id]);
  }

  static async getHistory(valveId, limit = 50) {
    const [rows] = await db.execute(
      `SELECT vh.*, u.name as user_name 
       FROM valve_history vh 
       LEFT JOIN users u ON vh.commanded_by = u.id 
       WHERE vh.valve_id = ? 
       ORDER BY vh.commanded_at DESC 
       LIMIT ?`,
      [valveId, limit]
    );
    return rows;
  }

  static async getStatistics() {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
        SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) as partial,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error
      FROM valves
    `);
    return stats[0];
  }
}

module.exports = ValveModel;

