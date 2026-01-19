const db = require('../config/database');

class HomeAlarmModel {
  // Obtener estado actual de la alarma
  static async getStatus() {
    const [rows] = await db.execute(
      `SELECT ha.*,
       u1.name as last_armed_by_name,
       u2.name as last_disarmed_by_name
       FROM home_alarm ha
       LEFT JOIN users u1 ON ha.last_armed_by = u1.id
       LEFT JOIN users u2 ON ha.last_disarmed_by = u2.id
       WHERE ha.id = 1`
    );
    return rows[0];
  }

  // Actualizar estado de la alarma
  static async updateStatus(status, userId, action = null) {
    const updateFields = ['status = ?', 'updated_at = NOW()'];
    const params = [status];

    if (action === 'arm') {
      updateFields.push('last_armed_by = ?', 'last_armed_at = NOW()');
      params.push(userId);
    } else if (action === 'disarm') {
      updateFields.push('last_disarmed_by = ?', 'last_disarmed_at = NOW()');
      params.push(userId);
      if (status === 'disarmed') {
        updateFields.push('triggered_at = NULL');
      }
    } else if (action === 'trigger') {
      updateFields.push('triggered_at = NOW()');
    }

    params.push(1); // ID de la alarma (asumiendo solo una alarma)

    await db.execute(
      `UPDATE home_alarm SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    return this.getStatus();
  }

  // Actualizar estado de la sirena
  static async updateSirenStatus(sirenStatus) {
    await db.execute(
      'UPDATE home_alarm SET siren_status = ?, updated_at = NOW() WHERE id = ?',
      [sirenStatus, 1]
    );
    return this.getStatus();
  }

  // Habilitar/deshabilitar activación automática
  static async setAutoArm(enabled) {
    await db.execute(
      'UPDATE home_alarm SET auto_arm_enabled = ?, updated_at = NOW() WHERE id = ?',
      [enabled, 1]
    );
    return this.getStatus();
  }

  // ========== SENSORES ==========

  // Obtener todos los sensores
  static async getSensors() {
    const [rows] = await db.execute(
      'SELECT * FROM home_alarm_sensors WHERE alarm_id = 1 ORDER BY name ASC'
    );
    return rows;
  }

  // Obtener un sensor por ID
  static async getSensorById(id) {
    const [rows] = await db.execute(
      'SELECT * FROM home_alarm_sensors WHERE id = ? AND alarm_id = 1',
      [id]
    );
    return rows[0];
  }

  // Habilitar/deshabilitar un sensor
  static async toggleSensor(id, enabled) {
    await db.execute(
      'UPDATE home_alarm_sensors SET is_enabled = ?, updated_at = NOW() WHERE id = ? AND alarm_id = 1',
      [enabled, id]
    );
    return this.getSensorById(id);
  }

  // Actualizar estado de un sensor (triggered)
  static async updateSensorTrigger(id, triggered) {
    await db.execute(
      `UPDATE home_alarm_sensors 
       SET is_triggered = ?, 
           last_triggered_at = ${triggered ? 'NOW()' : 'NULL'},
           updated_at = NOW() 
       WHERE id = ? AND alarm_id = 1`,
      [triggered, id]
    );
    return this.getSensorById(id);
  }

  // ========== HORARIOS ==========

  // Obtener todos los horarios
  static async getSchedules() {
    const [rows] = await db.execute(
      'SELECT * FROM home_alarm_schedules WHERE alarm_id = 1 ORDER BY time ASC'
    );
    return rows;
  }

  // Obtener un horario por ID
  static async getScheduleById(id) {
    const [rows] = await db.execute(
      'SELECT * FROM home_alarm_schedules WHERE id = ? AND alarm_id = 1',
      [id]
    );
    return rows[0];
  }

  // Crear un horario
  static async createSchedule(scheduleData) {
    const { name, action, days_of_week, time, is_enabled = true } = scheduleData;
    
    const [result] = await db.execute(
      `INSERT INTO home_alarm_schedules 
       (alarm_id, name, action, days_of_week, time, is_enabled) 
       VALUES (1, ?, ?, ?, ?, ?)`,
      [name, action, days_of_week, time, is_enabled]
    );

    return this.getScheduleById(result.insertId);
  }

  // Actualizar un horario
  static async updateSchedule(id, scheduleData) {
    const { name, action, days_of_week, time, is_enabled } = scheduleData;
    
    await db.execute(
      `UPDATE home_alarm_schedules 
       SET name = ?, action = ?, days_of_week = ?, time = ?, is_enabled = ?, updated_at = NOW() 
       WHERE id = ? AND alarm_id = 1`,
      [name, action, days_of_week, time, is_enabled, id]
    );

    return this.getScheduleById(id);
  }

  // Eliminar un horario
  static async deleteSchedule(id) {
    await db.execute(
      'DELETE FROM home_alarm_schedules WHERE id = ? AND alarm_id = 1',
      [id]
    );
  }

  // Habilitar/deshabilitar un horario
  static async toggleSchedule(id, enabled) {
    await db.execute(
      'UPDATE home_alarm_schedules SET is_enabled = ?, updated_at = NOW() WHERE id = ? AND alarm_id = 1',
      [enabled, id]
    );
    return this.getScheduleById(id);
  }

  // ========== HISTORIAL ==========

  // Agregar evento al historial
  static async addHistory(eventData) {
    const { event_type, sensor_id = null, user_id = null, message = null, metadata = null } = eventData;
    
    const [result] = await db.execute(
      `INSERT INTO home_alarm_history 
       (alarm_id, event_type, sensor_id, user_id, message, metadata) 
       VALUES (1, ?, ?, ?, ?, ?)`,
      [event_type, sensor_id, user_id, message, metadata ? JSON.stringify(metadata) : null]
    );

    return result.insertId;
  }

  // Obtener historial
  static async getHistory(limit = 50) {
    const [rows] = await db.execute(
      `SELECT h.*, 
       s.name as sensor_name,
       u.name as user_name
       FROM home_alarm_history h
       LEFT JOIN home_alarm_sensors s ON h.sensor_id = s.id
       LEFT JOIN users u ON h.user_id = u.id
       WHERE h.alarm_id = 1
       ORDER BY h.created_at DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  }
}

module.exports = HomeAlarmModel;
