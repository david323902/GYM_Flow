﻿// server/routes/usuarios.routes.js - VERSIÓN LIMPIA
const express = require('express');
const router = express.Router();

// Importar controlador
let usuarioController;
try {
  usuarioController = require('../controllers/usuario.controller');
  console.log('✅ Controlador de usuarios cargado');
} catch (error) {
  console.error('❌ Error cargando controlador:', error.message);
  // Controlador de emergencia
  usuarioController = {
    obtenerUsuarios: async (req, res) => res.json({ message: 'Controlador no disponible' }),
    crearUsuario: async (req, res) => res.json({ message: 'Controlador no disponible' }),
    obtenerUsuarioPorId: async (req, res) => res.json({ message: 'Controlador no disponible' }),
    actualizarUsuario: async (req, res) => res.json({ message: 'Controlador no disponible' }),
    eliminarUsuario: async (req, res) => res.json({ message: 'Controlador no disponible' })
  };
}

// Definir rutas de forma segura
router.get('/', (req, res) => {
  console.log('GET /api/usuarios');
  usuarioController.obtenerUsuarios(req, res).catch(err => {
    console.error('Error en obtenerUsuarios:', err);
    res.status(500).json({ error: 'Error interno' });
  });
});

router.post('/', (req, res) => {
  console.log('POST /api/usuarios');
  usuarioController.crearUsuario(req, res).catch(err => {
    console.error('Error en crearUsuario:', err);
    res.status(500).json({ error: 'Error interno' });
  });
});

router.get('/:id', (req, res) => {
  console.log(`GET /api/usuarios/${req.params.id}`);
  usuarioController.obtenerUsuarioPorId(req, res).catch(err => {
    console.error('Error en obtenerUsuarioPorId:', err);
    res.status(500).json({ error: 'Error interno' });
  });
});

router.put('/:id', (req, res) => {
  console.log(`PUT /api/usuarios/${req.params.id}`);
  usuarioController.actualizarUsuario(req, res).catch(err => {
    console.error('Error en actualizarUsuario:', err);
    res.status(500).json({ error: 'Error interno' });
  });
});

router.delete('/:id', (req, res) => {
  console.log(`DELETE /api/usuarios/${req.params.id}`);
  usuarioController.eliminarUsuario(req, res).catch(err => {
    console.error('Error en eliminarUsuario:', err);
    res.status(500).json({ error: 'Error interno' });
  });
});

// NO usar rutas con "*" - eso causa el error
// router.get('*', ...) // ← ESTO ESTÁ MAL

console.log('✅ Router de usuarios configurado');
module.exports = router;
