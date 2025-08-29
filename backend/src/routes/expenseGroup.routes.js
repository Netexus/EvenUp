const express = require('express');
const router = express.Router();
const controller = require('../controllers/expenseGroup.controller');

// Get all groups
router.get('/', controller.getAllGroups);

// Get groups by user (member or creator)
router.get('/user/:userId', controller.getGroupsByUser);

// Get group details
router.get('/:id', controller.getGroupDetails);

// Create group (Trip)
router.post('/trip', controller.createGroupTrip);

// Create group (Relationship)
router.post('/relationship', controller.createGroupRelationship);

// Create group (Other)
router.post('/other', controller.createGroupOther);

// Update group
router.put('/:id', controller.updateGroup);

// Delete group
router.delete('/:id', controller.deleteGroup);

module.exports = router;