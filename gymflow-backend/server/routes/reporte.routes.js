// server/routes/reporte.routes.js
const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario.model');
const Asistencia = require('../models/Asistencia.model');
const Gasto = require('../models/gasto.model');

// Reporte general
router.get('/general', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    
    const inicio = fecha_inicio ? new Date(fecha_inicio) : new Date(new Date().setDate(1));
    const fin = fecha_fin ? new Date(fecha_fin) : new Date();
    
    // Usuarios activos
    const usuariosActivos = await Usuario.countDocuments({ estado: 'activo' });
    
    // Asistencias del período
    const asistencias = await Asistencia.countDocuments({
      fecha: { $gte: inicio, $lte: fin }
    });
    
    // Gastos del período
    const gastosData = await Gasto.aggregate([
      {
        $match: {
          fecha: { $gte: inicio, $lte: fin }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$monto' },
          cantidad: { $sum: 1 }
        }
      }
    ]);
    
    const gastos = gastosData[0] || { total: 0, cantidad: 0 };
    
    res.json({
      success: true,
      periodo: {
        inicio: inicio.toISOString(),
        fin: fin.toISOString()
      },
      reporte: {
        usuarios_activos: usuariosActivos,
        total_asistencias: asistencias,
        gastos: {
          total: gastos.total,
          cantidad: gastos.cantidad
        }
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte',
      error: error.message
    });
  }
});

// Reporte de asistencias por día
router.get('/asistencias-diarias', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    
    const inicio = fecha_inicio ? new Date(fecha_inicio) : new Date(new Date().setDate(1));
    const fin = fecha_fin ? new Date(fecha_fin) : new Date();
    
    const asistenciasPorDia = await Asistencia.aggregate([
      {
        $match: {
          fecha: { $gte: inicio, $lte: fin }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$fecha" } },
          cantidad: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    res.json({
      success: true,
      asistencias_por_dia: asistenciasPorDia
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte',
      error: error.message
    });
  }
});

module.exports = router;