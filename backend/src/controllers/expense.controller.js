const { validationResult } = require('express-validator');
const Expense = require('../models/expense.model');
const Participants = require('../models/expenseParticipants.model');
const pool = require('../config/database');

// Create an expense (optionally with participants array)
exports.createExpense = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { participants = [] } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Insert expense
    const { group_id, paid_by, amount, description, category, date } = req.body;
    const [result] = await conn.execute(
      `INSERT INTO expenses (group_id, paid_by, amount, description, category, date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [group_id, paid_by, amount, description ?? null, category ?? null, date]
    );
    const expenseId = result.insertId;

    // Insert participants if provided
    if (participants.length) {
      const values = [];
      const placeholders = participants.map(p => {
        values.push(expenseId, p.user_id, p.share_amount);
        return '(?, ?, ?)';
      }).join(', ');
      await conn.execute(
        `INSERT INTO expense_participants (expense_id, user_id, share_amount)
         VALUES ${placeholders}`,
        values
      );
    }

    await conn.commit();

    // Return expense with participants
    const expense = await Expense.getById(expenseId);
    const parts = await Participants.getByExpense(expenseId);
    return res.status(201).json({ expense, participants: parts });
  } catch (err) {
    await conn.rollback();
    console.error('createExpense error', err);
    return res.status(500).json({ message: 'Error creating expense', error: err.message });
  } finally {
    conn.release();
  }
};

exports.getExpense = async (req, res) => {
  try {
    const expense = await Expense.getById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    const participants = await Participants.getByExpense(req.params.id);
    return res.json({ expense, participants });
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching expense' });
  }
};

exports.getExpensesByGroup = async (req, res) => {
  try {
    const expenses = await Expense.getByGroup(req.params.groupId);
    return res.json(expenses);
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching expenses' });
  }
};

exports.updateExpense = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const updated = await Expense.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Expense not found' });
    const participants = await Participants.getByExpense(req.params.id);
    return res.json({ expense: updated, participants });
  } catch (err) {
    return res.status(500).json({ message: 'Error updating expense' });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const ok = await Expense.remove(req.params.id);
    if (!ok) return res.status(404).json({ message: 'Expense not found' });
    return res.json({ message: 'Expense deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Error deleting expense' });
  }
};

// Participants sub-resources
exports.getParticipants = async (req, res) => {
  try {
    const items = await Participants.getByExpense(req.params.id);
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching participants' });
  }
};

exports.addParticipants = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const created = await Participants.addMany(req.params.id, req.body.participants || []);
    return res.status(201).json(created);
  } catch (err) {
    return res.status(500).json({ message: 'Error adding participants' });
  }
};

exports.updateParticipant = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const updated = await Participants.update(req.params.participantId, req.body);
    if (!updated) return res.status(404).json({ message: 'Participant not found' });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: 'Error updating participant' });
  }
};

exports.deleteParticipant = async (req, res) => {
  try {
    const ok = await Participants.remove(req.params.participantId);
    if (!ok) return res.status(404).json({ message: 'Participant not found' });
    return res.json({ message: 'Participant deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Error deleting participant' });
  }
};
