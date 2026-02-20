﻿﻿﻿// server/routes/index.routes.js
const express = require('express');
const router = express.Router();

// Importar rutas
const authRoutes = require('./authRoutes');
const usuarioRoutes = require('./usuarios.routes');
const planRoutes = require('./planes.routes');
const asistenciaRoutes = require('./asistencias.routes');
const clienteRoutes = require('./cliente.routes');
const notificacionRoutes = require('./notificacionRoutes');
const gastoRoutes = require('./gasto.routes');
const reporteRoutes = require('./reporte.routes');
const productoRoutes = require('./producto.routes');
const ventaRoutes = require('./venta.routes');

// Rutas
router.use('/auth', authRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/planes', planRoutes);
router.use('/asistencias', asistenciaRoutes);
router.use('/clientes', clienteRoutes);
router.use('/notificaciones', notificacionRoutes);
router.use('/gastos', gastoRoutes);
router.use('/reportes', reporteRoutes);
router.use('/productos', productoRoutes);
router.use('/ventas', ventaRoutes);

// Ruta de prueba (opcional)
router.get('/', (req, res) => {
  res.json({ message: 'API de Olimpo Gym funcionando correctamente!' });
});

module.exports = router;