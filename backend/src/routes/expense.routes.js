const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/expense.controller');
const v = require('../middleware/validators');

// Expenses
router.post('/', v.createExpenseValidation, ctrl.createExpense);
router.get('/:id', ctrl.getExpense);
router.get('/group/:groupId', v.groupIdParamValidation, ctrl.getExpensesByGroup);
router.put('/:id', v.updateExpenseValidation, ctrl.updateExpense);
router.delete('/:id', ctrl.deleteExpense);

// Participants nested routes
router.get('/:id/participants', ctrl.getParticipants);
router.post('/:id/participants', v.addParticipantsValidation, ctrl.addParticipants);
router.put('/:id/participants/:participantId', v.updateParticipantValidation, ctrl.updateParticipant);
router.delete('/:id/participants/:participantId', ctrl.deleteParticipant);

module.exports = router;