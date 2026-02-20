const express = require('express');
const router = express.Router();

// 🎯 SIMULACIÓN DE DATOS (legacy de asistencia)
let asistencias = [];

// POST registrar asistencia (legacy)
router.post('/registrar', (req, res) => {
  const { documento } = req.body;
  const nuevaAsistencia = { _id: Date.now().toString(), documento, fecha: new Date() };
  asistencias.push(nuevaAsistencia);
  res.json({ success: true, message: 'Asistencia registrada (legacy)', data: nuevaAsistencia });
});

router.get('/hoy', (req, res) => {
  res.json({ success: true, data: asistencias.slice(-10) });
});

module.exports = router;
