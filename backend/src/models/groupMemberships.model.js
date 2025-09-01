const pool = require('../config/database');

const GroupMembershipsModel = {
  // CREATE
  create: async (group_id, user_id, role = 'member') => {
    const query = `
      INSERT INTO group_memberships (group_id, user_id, role)
      VALUES (?, ?, ?)
    `;
    const [result] = await pool.query(query, [group_id, user_id, role]);
    return result.insertId;
  },

  // READ all by group
  getByGroup: async (group_id) => {
    const query = `
      SELECT
        gm.membership_id,
        gm.group_id,
        gm.user_id,
        u.name AS user_name,
        u.username,
        gm.role,
        gm.joined_at
      FROM group_memberships gm
      INNER JOIN app_users u ON gm.user_id = u.user_id
      WHERE gm.group_id = ?
      ORDER BY gm.joined_at ASC
    `;
    const [rows] = await pool.query(query, [group_id]);
    return rows;
  },

  // READ one membership
  getById: async (membership_id) => {
    const query = `
      SELECT
        gm.membership_id,
        gm.group_id,
        gm.user_id,
        u.name AS user_name,
        u.username,
        gm.role,
        gm.joined_at
      FROM group_memberships gm
      INNER JOIN app_users u ON gm.user_id = u.user_id
      WHERE gm.membership_id = ?
      LIMIT 1
    `;
    const [rows] = await pool.query(query, [membership_id]);
    return rows[0];
  },

  // UPDATE role
  updateRole: async (membership_id, role) => {
    const query = `
      UPDATE group_memberships
      SET role = ?
      WHERE membership_id = ?
    `;
    const [result] = await pool.query(query, [role, membership_id]);
    return result.affectedRows;
  },

  // DELETE
  delete: async (membership_id) => {
    const query = `
      DELETE FROM group_memberships
      WHERE membership_id = ?
    `;
    const [result] = await pool.query(query, [membership_id]);
    return result.affectedRows;
  }
};

module.exports = GroupMembershipsModel;
