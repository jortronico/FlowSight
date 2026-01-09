const db = require('../config/database');
const bcrypt = require('bcryptjs');

class UserModel {
  static async findAll() {
    const [rows] = await db.execute(
      'SELECT id, email, name, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.execute(
      'SELECT id, email, name, role, is_active, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async findByEmail(email) {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  }

  static async create(userData) {
    const { email, password, name, role = 'viewer' } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name, role]
    );

    return { id: result.insertId, email, name, role };
  }

  static async update(id, userData) {
    const { name, role, is_active } = userData;
    
    await db.execute(
      'UPDATE users SET name = ?, role = ?, is_active = ?, updated_at = NOW() WHERE id = ?',
      [name, role, is_active, id]
    );

    return this.findById(id);
  }

  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await db.execute(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, id]
    );
  }

  static async delete(id) {
    await db.execute('DELETE FROM users WHERE id = ?', [id]);
  }

  static async validatePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }
}

module.exports = UserModel;

