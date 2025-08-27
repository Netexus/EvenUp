const pool = require('../config/database');

const ExpenseGroup = {
  async getAll() {
    const [rows] = await pool.query('SELECT * FROM expense_groups');
    return rows;
  },

  async create(data) {
    const { group_name, created_by, origin, destination, departure, trip_return, income_1, income_2, category } = data;
    const [result] = await pool.query(
      'INSERT INTO expense_groups (group_name, created_by, origin, destination, departure, trip_return, income_1, income_2, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [group_name, created_by, origin, destination, departure, trip_return, income_1, income_2, category]
    );
    const [rows] = await pool.query('SELECT * FROM expense_groups WHERE group_id = ?', [result.insertId]);
    return rows[0];
  },

  async update(id, data) {
    const { group_name, origin, destination, departure, trip_return, income_1, income_2, category } = data;
    const [result] = await pool.query(
      'UPDATE expense_groups SET group_name = ?, origin = ?, destination = ?, departure = ?, trip_return = ?, income_1 = ?, income_2 = ?, category = ? WHERE group_id = ?',
      [group_name, origin, destination, departure, trip_return, income_1, income_2, category, id]
    );
    if (result.affectedRows === 0) return null;
    const [rows] = await pool.query('SELECT * FROM expense_groups WHERE group_id = ?', [id]);
    return rows[0];
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM expense_groups WHERE group_id = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = ExpenseGroup;
