// Legacy: copia de la ruta simulada de auth (movida a legacy)
const express = require('express');
const router = express.Router();

// 🎯 SIMULACIÓN DE AUTENTICACIÓN (archivo legacy)
router.post('/login', (req, res) => {
  const { email } = req.body;
  res.json({ success: true, token: 'legacy-token', usuario: { email } });
});

module.exports = router;
