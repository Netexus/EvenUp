const pool = require('../config/database');

const ExpenseParticipants = {
  async addParticipant(expenseId, userId, shareAmount) {
    const [res] = await pool.execute(
      `INSERT INTO expense_participants (expense_id, user_id, share_amount)
       VALUES (?, ?, ?)`,
      [expenseId, userId, shareAmount]
    );
    return this.getById(res.insertId);
  },

  async addMany(expenseId, participants = []) {
    if (!participants.length) return [];
    const values = [];
    const placeholders = participants.map(p => {
      values.push(expenseId, p.user_id, p.share_amount);
      return '(?, ?, ?)';
    }).join(', ');
    await pool.execute(
      `INSERT INTO expense_participants (expense_id, user_id, share_amount)
       VALUES ${placeholders}`,
      values
    );
    return this.getByExpense(expenseId);
  },

  async getByExpense(expenseId) {
    const [rows] = await pool.execute(
      `SELECT ep.*, u.name
       FROM expense_participants ep
       JOIN app_users u ON ep.user_id = u.user_id
       WHERE ep.expense_id = ?`,
      [expenseId]
    );
    return rows;
  },

  async getById(participantId) {
    const [rows] = await pool.execute(
      `SELECT ep.*, u.name
       FROM expense_participants ep
       JOIN app_users u ON ep.user_id = u.user_id
       WHERE ep.participant_id = ?`,
      [participantId]
    );
    return rows[0];
  },

  async update(participantId, data) {
    const fields = [];
    const values = [];
    if (Object.prototype.hasOwnProperty.call(data, 'user_id')) {
      fields.push('user_id = ?'); values.push(data.user_id);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'share_amount')) {
      fields.push('share_amount = ?'); values.push(data.share_amount);
    }
    if (!fields.length) return this.getById(participantId);
    values.push(participantId);
    await pool.execute(`UPDATE expense_participants SET ${fields.join(', ')} WHERE participant_id = ?`, values);
    return this.getById(participantId);
  },

  async remove(participantId) {
    const [res] = await pool.execute(`DELETE FROM expense_participants WHERE participant_id = ?`, [participantId]);
    return res.affectedRows > 0;
  },

  async removeByExpense(expenseId) {
    await pool.execute(`DELETE FROM expense_participants WHERE expense_id = ?`, [expenseId]);
    return true;
  }
};

module.exports = ExpenseParticipants;
