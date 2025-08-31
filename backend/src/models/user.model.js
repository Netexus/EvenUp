const db = require('../config/database.js');

const Users = {
  async create(userData) {
    const { name, username, phone, email, birthdate } = userData;
    // Controller stores hashed password in userData.password
    const password_hash = userData.password || userData.password_hash;
    const [res] = await db.query(
      'INSERT INTO app_users (name, username, phone, email, birthdate, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
      [name, username, phone, email, birthdate, password_hash]
    );
    const [rows] = await db.query('SELECT user_id, name, username, phone, email, birthdate, created_at FROM app_users WHERE user_id = ?', [res.insertId]);
    return rows[0];
  },

  async getAll() {
    const [rows] = await db.query('SELECT user_id, name, username, phone, email, birthdate, created_at FROM app_users');
    return rows;
  },

  async getProfile(id) {
    const [rows] = await db.query('SELECT name, username, phone, email, password_hash, birthdate FROM app_users WHERE user_id = ?', [id]);
    return rows[0];
  },

  async getById(id) {
    const [rows] = await db.query('SELECT user_id, name, username, phone, email, birthdate, created_at FROM app_users WHERE user_id = ?', [id]);
    return rows[0];
  },

  async getByUsername(username) {
    const [rows] = await db.query('SELECT * FROM app_users WHERE username = ?', [username]);
    return rows[0];
  },

  async getByEmail(email) {
    const [rows] = await db.query('SELECT * FROM app_users WHERE email = ?', [email]);
    return rows[0];
  },

  async search(query, limit = 10) {
    const like = `%${query}%`;
    return db.query(
      'SELECT user_id, username, email, name FROM app_users WHERE username LIKE ? OR email LIKE ? ORDER BY created_at DESC LIMIT ?',
      [like, like, Number(limit) || 10]
    );
  },

  async update(id, userData) {
    const fields = [];
    const values = [];
    const allowed = ['name', 'username', 'phone', 'email', 'birthdate', 'password_hash'];
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(userData, k)) {
        fields.push(`${k} = ?`);
        values.push(userData[k]);
      }
    }
    if (fields.length === 0) return this.getById(id);
    values.push(id);
    await db.query(`UPDATE app_users SET ${fields.join(', ')} WHERE user_id = ?`, values);
    return this.getById(id);
  },

  async remove(id) {
    const [res] = await db.query('DELETE FROM app_users WHERE user_id = ?', [id]);
    return (res.affectedRows || 0) > 0;
  }
};

module.exports = Users;