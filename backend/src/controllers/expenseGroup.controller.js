const ExpenseGroupModel = require('../models/expenseGroup.model');

// ============================
// Controladores para Expense Groups
// ============================

const expenseGroupController = {
  getAllGroups: async (req, res) => {
    try {
      const groups = await ExpenseGroupModel.getAllGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching groups' });
    }
  },

  getGroupDetails: async (req, res) => {
    try {
      const group = await ExpenseGroupModel.getGroupDetails(req.params.id);
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching group details' });
    }
  },

  createGroupTrip: async (req, res) => {
    try {
      const newGroup = await ExpenseGroupModel.createGroupTrip(req.body);
      res.status(201).json(newGroup);
    } catch (error) {
      res.status(500).json({ error: 'Error creating trip group' });
    }
  },

  createGroupRelationship: async (req, res) => {
    try {
      const newGroup = await ExpenseGroupModel.createGroupRelationship(req.body);
      res.status(201).json(newGroup);
    } catch (error) {
      res.status(500).json({ error: 'Error creating relationship group' });
    }
  },

  createGroupOther: async (req, res) => {
    try {
      const newGroup = await ExpenseGroupModel.createGroupOther(req.body);
      res.status(201).json(newGroup);
    } catch (error) {
      res.status(500).json({ error: 'Error creating other group' });
    }
  },

  updateGroup: async (req, res) => {
    try {
      const updated = await ExpenseGroupModel.updateGroup(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Error updating group' });
    }
  },

  deleteGroup: async (req, res) => {
    try {
      const deleted = await ExpenseGroupModel.deleteGroup(req.params.id);
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
