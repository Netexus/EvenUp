const express = require('express');
const router = express.Router();
const controller = require('../controllers/expenseGroup.controller');

router.get('/', controller.getAllGroups);
router.post('/', controller.createGroup);
router.put('/:id', controller.updateGroup);
router.delete('/:id', controller.deleteGroup);

module.exports = router;