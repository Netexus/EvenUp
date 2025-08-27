const express = require('express');
const router = express.Router();
const settlementController = require('../controllers/settlement.controller');
const { 
  createSettlementValidator,
  updateSettlementValidator,
  getSettlementValidator,
  getSettlementsByGroupValidator,
  getUserBalanceValidator
} = require('../middleware/validators');

// Create a new payment
router.post('/', createSettlementValidator, settlementController.createSettlement);

// Get payment by ID
router.get('/:id', getSettlementValidator, settlementController.getSettlement);

// Get all payments for a group
router.get('/group/:groupId', getSettlementsByGroupValidator, settlementController.getSettlementsByGroup);

// Update a payment
router.put('/:id', updateSettlementValidator, settlementController.updateSettlement);

// Delete a payment
router.delete('/:id', getSettlementValidator, settlementController.deleteSettlement);

// Get user balance in a group
router.get('/balance/group/:groupId/user/:userId', 
  getUserBalanceValidator, 
  settlementController.getUserBalance
);

module.exports = router;
