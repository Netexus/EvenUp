const ExpenseGroup = require('../models/expenseGroup.model');

// Get all groups
exports.getAllGroups = async (req, res) => {
  try {
    const groups = await ExpenseGroup.getAll();
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching groups' });
  }
};

// Get group details
exports.getGroupDetails = async (req, res) => {
  try {
    const group = await ExpenseGroup.getGroupDetails(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching group details' });
  }
};

// Create group (trip, relationship, other)
exports.createGroupTrip = async (req, res) => {
  try {
    const group = await ExpenseGroup.createTrip(req.body);
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: 'Error creating group' });
  }
};

exports.createGroupRelationship = async (req, res) => {
  try {
    const group = await ExpenseGroup.createRelationship(req.body);
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: 'Error creating group' });
  }
};

exports.createGroupOther = async (req, res) => {
  try {
    const group = await ExpenseGroup.createOther(req.body);
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: 'Error creating group' });
  }
};

// Update group
exports.updateGroup = async (req, res) => {
  try {
    const group = await ExpenseGroup.update(req.params.id, req.body);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Error updating group' });
  }
};

// Delete group
exports.deleteGroup = async (req, res) => {
  try {
    const deleted = await ExpenseGroup.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Group not found' });
    res.json({ message: 'Deleted group' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting group' });
  }
};