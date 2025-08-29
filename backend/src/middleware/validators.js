const { body, param } = require('express-validator');

exports.createSettlementValidator = [
  body('group_id').isInt({ min: 1 }).withMessage('Group ID is required and must be a positive integer'),
  body('from_user').isInt({ min: 1 }).withMessage('Payer user ID is required and must be a positive integer'),
  body('to_user').isInt({ min: 1 }).withMessage('Payee user ID is required and must be a positive integer'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a number greater than zero')
];

exports.updateSettlementValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid payment ID'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a number greater than zero')
];

exports.getSettlementValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid payment ID')
];

exports.getSettlementsByGroupValidator = [
  param('groupId').isInt({ min: 1 }).withMessage('Invalid group ID')
];

exports.getUserBalanceValidator = [
  param('groupId').isInt({ min: 1 }).withMessage('Invalid group ID'),
  param('userId').isInt({ min: 1 }).withMessage('Invalid user ID')
];

// === Expenses & Participants Validations ===

exports.createExpenseValidation = [
  body('group_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Invalid group_id'),
  body('paid_by').isInt({ min: 1 }).withMessage('paid_by (user_id) required'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a number greater than zero'),
  body('description').optional().isString(),
  body('category').optional().isString(),
  body('date').isISO8601().withMessage('date must be YYYY-MM-DD'),
  body('participants').optional().isArray().withMessage('participants must be an array'),
  body('participants.*.user_id').optional().isInt({ min: 1 }),
  body('participants.*.share_amount').optional().isFloat({ gt: 0 })
];

exports.updateExpenseValidation = [
  param('id').isInt({ min: 1 }),
  body('group_id').optional({ nullable: true }).isInt({ min: 1 }),
  body('paid_by').optional().isInt({ min: 1 }),
  body('amount').optional().isFloat({ gt: 0 }),
  body('description').optional().isString(),
  body('category').optional().isString(),
  body('date').optional().isISO8601()
];

exports.addParticipantsValidation = [
  param('id').isInt({ min: 1 }),
  body('participants').isArray({ min: 1 }),
  body('participants.*.user_id').isInt({ min: 1 }),
  body('participants.*.share_amount').isFloat({ gt: 0 })
];

exports.updateParticipantValidation = [
  param('participantId').isInt({ min: 1 }),
  body('user_id').optional().isInt({ min: 1 }),
  body('share_amount').optional().isFloat({ gt: 0 })
];

exports.groupIdParamValidation = [
  param('groupId').isInt({ min: 1 }).withMessage('Invalid group ID')
];