const ExpenseGroupModel = require('../models/expenseGroup.model');

// ============================
// Controladores para Expense Groups
// ============================

const expenseGroupController = {
  getAllGroups: async (req, res) => {
    try {
      const groups = await ExpenseGroupModel.getAll();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching groups' });
    }
  },

  getGroupsByUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const groups = await ExpenseGroupModel.getByUser(userId);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching user groups' });
    }
  },

  getGroupDetails: async (req, res) => {
    try {
      const groupId = req.params.id;
      const userId = req.query.userId || req.user?.id || req.user?.user_id || null;
      const group = await ExpenseGroupModel.getGroupDetails(groupId, userId);
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching group details' });
    }
  },

  createGroupTrip: async (req, res) => {
    try {
      const newGroup = await ExpenseGroupModel.createTrip(req.body);
      res.status(201).json(newGroup);
    } catch (error) {
      res.status(500).json({ error: 'Error creating trip group' });
    }
  },

  createGroupRelationship: async (req, res) => {
    try {
      const newGroup = await ExpenseGroupModel.createRelationship(req.body);
      res.status(201).json(newGroup);
    } catch (error) {
      res.status(500).json({ error: 'Error creating relationship group' });
    }
  },

  createGroupOther: async (req, res) => {
    try {
      const newGroup = await ExpenseGroupModel.createOther(req.body);
      res.status(201).json(newGroup);
    } catch (error) {
      res.status(500).json({ error: 'Error creating other group' });
    }
  },

  updateGroup: async (req, res) => {
    try {
      const updated = await ExpenseGroupModel.update(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Error updating group' });
    }
  },

  deleteGroup: async (req, res) => {
    try {
      const deleted = await ExpenseGroupModel.delete(req.params.id);
      res.json(deleted);
    } catch (error) {
      res.status(500).json({ error: 'Error deleting group' });
    }
  }
};

// ============================
// Exportar para el enrutado
// ============================
module.exports = expenseGroupController;
