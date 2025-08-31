const { validationResult } = require('express-validator');
const Settlement = require('../models/settlement.model');


// Create a new payment
exports.createSettlement = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { group_id, from_user, to_user, amount } = req.body;
    console.log(`[Settlement] Creating payment: group=${group_id}, from=${from_user}, to=${to_user}, amount=${amount}`);

    const settlement = await Settlement.create({ group_id, from_user, to_user, amount });
    console.log(`[Settlement] Created settlement ID: ${settlement.settlement_id}`);
    
    // Log all group balances after payment creation
    const groupBalances = await Settlement.getGroupBalances(group_id);
    console.log(`[Settlement] After payment creation - Group ${group_id} balances updated`);
    
    res.status(201).json(settlement);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ message: 'Error processing request', error: error.message });
  }
};

// Get payment by ID
exports.getSettlement = async (req, res) => {
  try {
    const settlement = await Settlement.getById(req.params.id);
    if (!settlement) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json(settlement);
  } catch (error) {
    console.error('Error getting payment:', error);
    res.status(500).json({ message: 'Error processing request' });
  }
};

// Get all payments for a group
exports.getSettlementsByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const settlements = await Settlement.getByGroup(groupId);
    res.json(settlements);
  } catch (error) {
    console.error('Error getting payments:', error);
    res.status(500).json({ message: 'Error processing request' });
  }
};

// Update a payment
exports.updateSettlement = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const settlement = await Settlement.update(req.params.id, req.body);
    if (!settlement) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json(settlement);
  } catch (error) {
    console.error('Error updating payment:', error);
      res.status(500).json({ message: 'Error processing request' });
  }
};

// Delete a payment
exports.deleteSettlement = async (req, res) => {
  try {
    const settlement = await Settlement.delete(req.params.id);
    if (!settlement) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ message: 'Error processing request' });
  }
};

// Get user balance in a group
exports.getUserBalance = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const balance = await Settlement.getUserBalance(groupId, userId);
    
    if (!balance) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(balance);
  } catch (error) {
    console.error('Error getting user balance:', error);
    res.status(500).json({ message: 'Error processing request' });
  }
};

// Get all balances for a group
exports.getGroupBalances = async (req, res) => {
  try {
    const { groupId } = req.params;
    const balances = await Settlement.getGroupBalances(groupId);
    res.json(balances);
  } catch (error) {
    console.error('Error getting group balances:', error);
    res.status(500).json({ message: 'Error processing request' });
  }
};
