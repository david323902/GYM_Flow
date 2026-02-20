const express = require('express');
const router = express.Router();
const controller = require('../controllers/producto.controller');

router.post('/', controller.crearProducto);
router.get('/', controller.obtenerProductos);
router.put('/:id', controller.actualizarProducto);
router.delete('/:id', controller.eliminarProducto);
router.patch('/:id/stock', controller.actualizarStock);

module.exports = router;