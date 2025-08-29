const express = require('express');
const router = express.Router();
const controller = require('../controllers/groupMemberships.controller');

// Crear membresía
router.post('/', controller.create);

// Obtener miembros por grupo
router.get('/group/:group_id', controller.getByGroup);

// Obtener membresía por ID
router.get('/:membership_id', controller.getById);

// Actualizar rol de membresía
router.put('/:membership_id/role', controller.updateRole);

// Eliminar membresía
router.delete('/:membership_id', controller.delete);

module.exports = router;