const express = require('express');
const router = express.Router();
const controller = require('../controllers/groupMemberships.controller');

// Create membership
router.post('/', controller.create);

// Get members by group
router.get('/group/:group_id', controller.getByGroup);

// Get membership by ID
router.get('/:membership_id', controller.getById);

// Update membership role
router.put('/:membership_id/role', controller.updateRole);

// Delete membership
router.delete('/:membership_id', controller.delete);

module.exports = router;
