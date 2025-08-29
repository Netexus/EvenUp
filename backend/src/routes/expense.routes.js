const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/expense.controller');
const v = require('../middleware/validators');


// ---------
// Expenses
// ---------

// Create expense
router.post('/', v.createExpenseValidation, ctrl.createExpense);

// Get expense by ID
router.get('/:id', ctrl.getExpense);

// Get expenses by group
router.get('/group/:groupId', v.groupIdParamValidation, ctrl.getExpensesByGroup);

// Update expense by ID
router.put('/:id', v.updateExpenseValidation, ctrl.updateExpense);

// Delete expense by ID
router.delete('/:id', ctrl.deleteExpense);

// --------------------------
// Participants nested routes
// --------------------------

// Get participants for an expense
router.get('/:id/participants', ctrl.getParticipants);

// Add participants to an expense
router.post('/:id/participants', v.addParticipantsValidation, ctrl.addParticipants);

// Update a participant in an expense
router.put('/:id/participants/:participantId', v.updateParticipantValidation, ctrl.updateParticipant);

// Delete a participant from an expense
router.delete('/:id/participants/:participantId', ctrl.deleteParticipant);

// GET /api/expenses/summary/:groupId?userId=1
router.get('/summary/:groupId', ExpensesSummaryController.getExpensesByGroupForUser);

// GET /api/expenses/detail/:id
router.get('/detail/:id', ExpenseDetailController.getExpenseDetail);

module.exports = router;