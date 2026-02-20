const express = require('express');
const router = express.Router();
const planController = require('../controllers/plan.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

// Obtener todos los planes (público para que el frontend pueda listarlos)
router.get('/', planController.obtenerPlanes);

// Obtener un plan por ID
router.get('/:id', planController.obtenerPlanPorId);

// Crear nuevo plan (solo admin)
router.post('/', verificarToken, planController.crearPlan);

// Actualizar plan (solo admin)
router.put('/:id', verificarToken, planController.actualizarPlan);

// Desactivar plan (solo admin)
router.patch('/:id/desactivar', verificarToken, planController.desactivarPlan);

// Eliminar plan (solo admin)
router.delete('/:id', verificarToken, planController.eliminarPlan);

module.exports = router;