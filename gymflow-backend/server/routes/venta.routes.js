const express = require('express');
const router = express.Router();
const controller = require('../controllers/venta.controller');

router.post('/', controller.crearVenta);
router.get('/', controller.obtenerVentas);
router.delete('/:id', controller.eliminarVenta);

module.exports = router;