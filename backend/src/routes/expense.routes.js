const express = require('express');
const router = express.Router();
const {
  createExpense,
  getExpense,
  getExpensesByGroup,
  updateExpense,
  deleteExpense,
  getParticipants,
  addParticipants,
  updateParticipant,
  deleteParticipant,
  ExpensesSummaryController,
  ExpenseDetailController
} = require('../controllers/expense.controller');
const v = require('../middleware/validators');


// ---------
// Expenses
// ---------

// Create expense
router.post('/', v.createExpenseValidation, createExpense);

// Get expense by ID
router.get('/:id', getExpense);

// Get expenses by group
router.get('/group/:groupId', v.groupIdParamValidation, getExpensesByGroup);

// Update expense by ID
router.put('/:id', v.updateExpenseValidation, updateExpense);

// Delete expense by ID
router.delete('/:id', deleteExpense);

// --------------------------
// Participants nested routes
// --------------------------

// Get participants for an expense
router.get('/:id/participants', getParticipants);

// Add participants to an expense
router.post('/:id/participants', v.addParticipantsValidation, addParticipants);

// Update a participant in an expense
router.put('/:id/participants/:participantId', v.updateParticipantValidation, updateParticipant);

// Delete a participant from an expense
router.delete('/:id/participants/:participantId', deleteParticipant);

// GET /api/expenses/summary/:groupId?userId=1
router.get('/summary/:groupId', ExpensesSummaryController.getExpensesByGroupForUser);

// GET /api/expenses/detail/:id
router.get('/detail/:id', ExpenseDetailController.getExpenseDetail);

module.exports = router;