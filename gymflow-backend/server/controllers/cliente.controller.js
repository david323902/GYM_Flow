const usuarioController = require('./usuario.controller');

// Unificamos la lógica redirigiendo todo al controlador de usuarios.
// Esto asume que "Cliente" y "Usuario" son la misma entidad en el sistema.

exports.crearCliente = usuarioController.crearUsuario;
exports.obtenerClientes = usuarioController.obtenerUsuarios;
exports.obtenerClientePorId = usuarioController.obtenerUsuarioPorId;
exports.actualizarCliente = usuarioController.actualizarUsuario;
exports.eliminarCliente = usuarioController.eliminarUsuario;
exports.obtenerEliminados = usuarioController.obtenerEliminados;
exports.restaurarUsuario = usuarioController.restaurarUsuario;
exports.eliminarPermanente = usuarioController.eliminarPermanente;
exports.obtenerExpediente = usuarioController.obtenerExpediente;