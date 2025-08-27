const pool = require('../config/database');

const Expense = {
  async create(expenseData) {
    const { group_id, paid_by, amount, description = null, category = null, date } = expenseData;
    const [result] = await pool.execute(
      `INSERT INTO expenses (group_id, paid_by, amount, description, category, date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [group_id, paid_by, amount, description, category, date]
    );
    return this.getById(result.insertId);
  },

  async getById(expenseId) {
    const [rows] = await pool.execute(
      `SELECT e.*, u.name AS paid_by_name
       FROM expenses e
       JOIN app_users u ON e.paid_by = u.user_id
       WHERE e.expense_id = ?`,
      [expenseId]
    );
    return rows[0];
  },

  async getByGroup(groupId) {
    const [rows] = await pool.execute(
      `SELECT e.*, u.name AS paid_by_name
       FROM expenses e
       JOIN app_users u ON e.paid_by = u.user_id
       WHERE e.group_id = ?
       ORDER BY e.date DESC, e.expense_id DESC`,
      [groupId]
    );
    return rows;
  },

  async update(expenseId, data) {
    const fields = [];
    const values = [];
    const allowed = ['group_id', 'paid_by', 'amount', 'description', 'category', 'date'];
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(data, k)) {
        fields.push(`${k} = ?`);
        values.push(data[k]);
      }
    }
    if (fields.length === 0) return this.getById(expenseId);
    values.push(expenseId);
    await pool.execute(`UPDATE expenses SET ${fields.join(', ')} WHERE expense_id = ?`, values);
    return this.getById(expenseId);
  },

  async remove(expenseId) {
    const [res] = await pool.execute(`DELETE FROM expenses WHERE expense_id = ?`, [expenseId]);
    return res.affectedRows > 0;
  }
};

module.exports = Expense;
