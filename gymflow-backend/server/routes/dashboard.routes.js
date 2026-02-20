const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');

// @route   GET /api/dashboard/resumen
// @desc    Obtiene el resumen completo para el dashboard (asistencias, finanzas, usuarios y planes)
router.get('/resumen', dashboardController.obtenerResumenDashboard);

module.exports = router;