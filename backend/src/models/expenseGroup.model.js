const pool = require('../config/database');
const { getById } = require('./user.model');

const ExpenseGroup = {
  async getAll() {
    const [rows] = await pool.query('SELECT * FROM expense_groups');
    return rows;
  },

  async getByUser(userId) {
    const [rows] = await pool.query(
      `SELECT DISTINCT eg.group_id, eg.group_name, eg.created_by, eg.category, eg.status, eg.created_at,
              eg.origin, eg.destination, eg.departure, eg.trip_return, eg.income_1, eg.income_2
       FROM expense_groups eg
       LEFT JOIN group_memberships gm
         ON gm.group_id = eg.group_id
       WHERE gm.user_id = ? OR eg.created_by = ?
       ORDER BY eg.created_at DESC`,
      [userId, userId]
    );
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM expense_groups WHERE group_id = ?', [id]);
    return rows[0];
  },

  async getGroupDetails(groupId, userId) {
    const [rows] = await pool.query(
      `SELECT 
        eg.group_id,
        eg.group_name,
        eg.category,
        eg.origin,
        eg.destination,
        eg.departure,
        eg.trip_return,
        eg.income_1,
        eg.income_2,
        COUNT(DISTINCT gm.user_id) AS num_members,
        COALESCE(SUM(e.amount), 0) AS total_spent,
        COALESCE(ub.net, 0) AS user_balance
      FROM expense_groups eg
      LEFT JOIN group_memberships gm ON eg.group_id = gm.group_id
      LEFT JOIN expenses e ON eg.group_id = e.group_id
      LEFT JOIN user_balances ub 
          ON eg.group_id = ub.group_id AND ub.user_id = ?
      WHERE eg.group_id = ?
      GROUP BY eg.group_id, eg.group_name, eg.category, eg.origin, eg.destination, eg.departure, eg.trip_return, eg.income_1, eg.income_2, ub.net`,
      [userId || null, groupId]
    );
    return rows[0] || null;
  },

  async createTrip(data) {
    const { group_name, created_by, origin, destination, departure, trip_return, category } = data;
    const [result] = await pool.query(
      'INSERT INTO expense_groups (group_name, created_by, origin, destination, departure, trip_return, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [group_name, created_by, origin, destination, departure, trip_return, category]
    );
    const [rows] = await pool.query('SELECT * FROM expense_groups WHERE group_id = ?', [result.insertId]);
    return rows[0];
  },

  async createRelationship(data) {
    const { group_name, created_by, income_1, income_2, category } = data;
    const [result] = await pool.query(
      'INSERT INTO expense_groups (group_name, created_by, income_1, income_2, category) VALUES (?, ?, ?, ?, ?)',
      [group_name, created_by, income_1, income_2, category]
    );
    const [rows] = await pool.query('SELECT * FROM expense_groups WHERE group_id = ?', [result.insertId]);
    return rows[0];
  },

  async createOther(data) {
    const { group_name, created_by, category } = data;
    const [result] = await pool.query(
      'INSERT INTO expense_groups (group_name, created_by, category) VALUES (?, ?, ?)',
      [group_name, created_by, category]
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
  },

};


module.exports = ExpenseGroup;
