const express = require('express');
const router = express.Router();
const {
  crearCliente,
  obtenerClientes,
  obtenerClientePorId,
  actualizarCliente,
  eliminarCliente,
  obtenerExpediente,
  obtenerEliminados,
  restaurarUsuario,
  eliminarPermanente
} = require('../controllers/cliente.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

// --- RUTAS ESPECIALES (Deben ir PRIMERO) ---

router.get('/eliminados', verificarToken, obtenerEliminados);
router.put('/restaurar/:id', verificarToken, restaurarUsuario);
router.delete('/permanente/:id', verificarToken, eliminarPermanente);

// --- RUTAS CRUD ---

router.route('/')
  .post(verificarToken, crearCliente)
  .get(verificarToken, obtenerClientes);

// Ruta específica para expediente (debe ir antes de /:id)
router.get('/:id/expediente', verificarToken, obtenerExpediente);

router.route('/:id')
  .get(verificarToken, obtenerClientePorId)
  .put(verificarToken, actualizarCliente)
  .delete(verificarToken, eliminarCliente);

module.exports = router;