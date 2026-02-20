const express = require('express');
const router = express.Router();
const cajaController = require('../controllers/caja.controller');

router.post('/venta', cajaController.registrarVenta);
router.post('/gasto', cajaController.registrarGasto);
router.get('/cierre', cajaController.obtenerCierre);

module.exports = router;