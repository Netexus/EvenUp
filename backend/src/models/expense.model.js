const pool = require('../config/database');

const Expense = {
  async create(expenseData) {
    const { group_id, paid_by, amount, description = null, category = null, date, expense_name } = expenseData;
    const [result] = await pool.execute(
      `INSERT INTO expenses (group_id, paid_by, amount, description, category, date, expense_name)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [group_id, paid_by, amount, description, category, date, expense_name]
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
    const allowed = ['group_id', 'paid_by', 'amount', 'description', 'category', 'date', 'expense_name'];
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

const ExpensesSummaryModel = {
  getExpensesByGroupForUser: async (groupId, userId) => {
    const query = `
      SELECT
        e.expense_name,
        u.name AS paid_by_user,
        e.date,
        e.amount,
        e.category,
        CASE
          WHEN e.paid_by = ? THEN e.amount - COALESCE(ep.share_amount, 0)
          ELSE COALESCE(ep.share_amount, 0)
        END AS user_contribution
      FROM expenses AS e
      JOIN app_users AS u
        ON e.paid_by = u.user_id
      LEFT JOIN expense_participants AS ep
        ON e.expense_id = ep.expense_id AND ep.user_id = ?
      WHERE e.group_id = ?
      ORDER BY e.date DESC;
    `;

    const [rows] = await pool.query(query, [userId, userId, groupId]);
    return rows;
  }
};

const ExpenseDetailModel = {
  getExpenseDetail: async (expenseId) => {
    const query = `
      SELECT
        e.expense_name,
        e.amount,
        e.date,
        e.description,
        e.category,
        u.name AS paid_by_user,
        GROUP_CONCAT(
          CONCAT(au.name, ': ', ep.share_amount)
          ORDER BY au.name SEPARATOR ', '
        ) AS participants_and_shares
      FROM expenses AS e
      JOIN app_users AS u
        ON e.paid_by = u.user_id
      JOIN expense_participants AS ep
        ON e.expense_id = ep.expense_id
      JOIN app_users AS au
        ON ep.user_id = au.user_id
      WHERE e.expense_id = ?
      GROUP BY
        e.expense_id, e.expense_name, e.amount, e.date, e.description, e.category, u.name;
    `;

    const [rows] = await pool.query(query, [expenseId]);
    return rows[0];
  }
};

const GroupMembersModel = {
  async getGroupMembers(groupId) {
    const [rows] = await pool.execute(
      `SELECT u.user_id AS id, u.name, u.username, u.email
       FROM app_users u
       JOIN group_memberships gm ON u.user_id = gm.user_id
       WHERE gm.group_id = ?`,
      [groupId]
    );
    return rows;
  }
};

module.exports = ExpenseDetailModel;
module.exports = ExpensesSummaryModel;
module.exports = Expense;
module.exports = GroupMembersModel;
