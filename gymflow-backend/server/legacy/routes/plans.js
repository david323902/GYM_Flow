const express = require('express');
const router = express.Router();

// 🎯 DATOS DE PLANES
const planes = [
  { 
    _id: "1", 
    nombre: "Quincena", 
    precio: 30000, 
    duracionDias: 15,
    tipo: 'quincenal'
  },
  { 
    _id: "2", 
    nombre: "Mensual", 
    precio: 50000, 
    duracionDias: 30,
    tipo: 'mensual'
  },
  { 
    _id: "3", 
    nombre: "Tiquetera", 
    precio: 40000, 
    duracionDias: 60,
    entradasIncluidas: 12,
    tipo: 'tiquetera'
  },
  { 
    _id: "4", 
    nombre: "Trimestral", 
    precio: 120000, 
    duracionDias: 90,
    tipo: 'trimestral'
  },
  { 
    _id: "5", 
    nombre: "Personalizado", 
    precio: 180000, 
    duracionDias: 30,
    tipo: 'personalizado'
  }
];

// GET todos los planes
router.get('/', (req, res) => {
  console.log('📥 GET /api/planes - Enviando', planes.length, 'planes');
  res.json({
    success: true,
    data: planes,
    message: 'Planes obtenidos exitosamente'
  });
});

module.exports = router;
