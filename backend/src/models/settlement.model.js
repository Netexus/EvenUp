const pool = require('../config/database');

const Settlement = {
  // Create a new payment
  async create(settlementData) {
    const { group_id, from_user, to_user, amount } = settlementData;
    const [result] = await pool.execute(
      'INSERT INTO settlements (group_id, from_user, to_user, amount) VALUES (?, ?, ?, ?)',
      [group_id, from_user, to_user, amount]
    );
    return this.getById(result.insertId);
  },

  // Get payment by ID
  async getById(settlementId) {
    const [rows] = await pool.execute(
      `SELECT s.*, 
              u1.name as from_user_name, 
              u2.name as to_user_name 
       FROM settlements s
       JOIN app_users u1 ON s.from_user = u1.user_id
       JOIN app_users u2 ON s.to_user = u2.user_id
       WHERE s.settlement_id = ?`,
      [settlementId]
    );
    return rows[0];
  },

  // Get all payments for a group
  async getByGroup(groupId) {
    const [rows] = await pool.execute(
      `SELECT s.*, 
              u1.name as from_user_name, 
              u2.name as to_user_name 
       FROM settlements s
       JOIN app_users u1 ON s.from_user = u1.user_id
       JOIN app_users u2 ON s.to_user = u2.user_id
       WHERE s.group_id = ?
       ORDER BY s.created_at DESC`,
      [groupId]
    );
    return rows;
  },

  // Get all balances for a group
  async getGroupBalances(groupId) {
    console.log(`[Balance] Fetching all balances for group ${groupId}`);
    
    const [rows] = await pool.execute(
      `SELECT u.user_id, u.name, u.username, COALESCE(ub.net, 0) as balance,
              ub.last_updated
       FROM app_users u
       LEFT JOIN user_balances ub ON u.user_id = ub.user_id AND ub.group_id = ?
       JOIN group_memberships gm ON u.user_id = gm.user_id
       WHERE gm.group_id = ?
       ORDER BY u.name`,
      [groupId, groupId]
    );
    
    console.log(`[Balance] Group ${groupId} balances:`, rows.map(r => `${r.name}: $${r.balance}`).join(', '));
    return rows.map(row => ({ ...row, net: Number(row.balance || 0) }));
  },

  // Update a payment
  async update(settlementId, updateData) {
    const { amount } = updateData;
    await pool.execute(
      'UPDATE settlements SET amount = ? WHERE settlement_id = ?',
      [amount, settlementId]
    );
    return this.getById(settlementId);
  },

  // Delete a payment
  async delete(settlementId) {
    const settlement = await this.getById(settlementId);
    if (!settlement) return null;
    
    await pool.execute('DELETE FROM settlements WHERE settlement_id = ?', [settlementId]);
    return settlement;
  },

  // Get user balance in a group
  async getUserBalance(groupId, userId) {
    console.log(`[Balance] Fetching balance for user ${userId} in group ${groupId}`);
    
    const [rows] = await pool.execute(
      `SELECT u.user_id, u.name, u.username, COALESCE(ub.net, 0) as balance,
              ub.last_updated
       FROM app_users u
       LEFT JOIN user_balances ub ON u.user_id = ub.user_id AND ub.group_id = ?
       WHERE u.user_id = ?`,
      [groupId, userId]
    );
    
    const result = rows[0];
    if (result) {
      console.log(`[Balance] Found balance: ${result.balance} (last_updated: ${result.last_updated})`);
      return { ...result, net: Number(result.balance || 0) };
    }
    
    console.log(`[Balance] No balance record found for user ${userId} in group ${groupId}`);
    return null;
  }
};

module.exports = Settlement;
