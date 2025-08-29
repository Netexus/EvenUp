const GroupMembershipsModel = require('../models/groupMemberships.model');

module.exports = {
  // POST /group-memberships
  create: async (req, res) => {
    try {
      const { group_id, user_id, role } = req.body;
      const membershipId = await GroupMembershipsModel.create(group_id, user_id, role);
      res.status(201).json({ membership_id: membershipId });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /group-memberships/group/:group_id
  getByGroup: async (req, res) => {
    try {
      const { group_id } = req.params;
      const memberships = await GroupMembershipsModel.getByGroup(group_id);
      res.json(memberships);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /group-memberships/:membership_id
  getById: async (req, res) => {
    try {
      const { membership_id } = req.params;
      const membership = await GroupMembershipsModel.getById(membership_id);
      if (!membership) return res.status(404).json({ error: 'Membership not found' });
      res.json(membership);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // PUT /group-memberships/:membership_id/role
  updateRole: async (req, res) => {
    try {
      const { membership_id } = req.params;
      const { role } = req.body;
      const affected = await GroupMembershipsModel.updateRole(membership_id, role);
      if (!affected) return res.status(404).json({ error: 'Membership not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // DELETE /group-memberships/:membership_id
  delete: async (req, res) => {
    try {
      const { membership_id } = req.params;
      const affected = await GroupMembershipsModel.delete(membership_id);
      if (!affected) return res.status(404).json({ error: 'Membership not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};