// server/routes/transaccion.routes.js
const express = require('express');
const router = express.Router();
const transaccionController = require('../controllers/transaccion.controller');

// Registrar nueva transacción
router.post('/', transaccionController.registrarTransaccion);

// Obtener todas las transacciones (con filtros opcionales)
router.get('/', transaccionController.obtenerTransacciones);

// Obtener transacciones de hoy
router.get('/hoy', transaccionController.obtenerTransaccionesHoy);

// Generar cierre de caja
router.post('/cierre', transaccionController.generarCierre);

// Actualizar transacción
router.put('/:id', transaccionController.actualizarTransaccion);

// Eliminar transacción
router.delete('/:id', transaccionController.eliminarTransaccion);

module.exports = router;