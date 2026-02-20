const express = require('express');
const router = express.Router();

// 🎯 SIMULACIÓN DE DATOS EN MEMORIA (archivo legacy)
let usuarios = [];
let nextId = 1;

router.get('/', (req, res) => {
  res.json({ success: true, data: usuarios, message: 'Usuarios obtenidos (legacy)' });
});

router.post('/', (req, res) => {
  const nuevoUsuario = { id: nextId++, _id: nextId.toString(), ...req.body, fechaRegistro: new Date() };
  usuarios.push(nuevoUsuario);
  res.status(201).json({ success: true, data: nuevoUsuario, message: 'Usuario creado (legacy)' });
});

module.exports = router;
