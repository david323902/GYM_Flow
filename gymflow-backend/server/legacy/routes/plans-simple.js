// Legacy: server/routes/plans-simple.js - DATOS HARCODEADOS
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  console.log('📥 GET /api/planes solicitado - Usando datos hardcodeados');
  
  const planesHardcodeados = [
    {
      _id: "1",
      nombre: "Quincena",
      descripcion: "15 días de acceso ilimitado",
      precio: 30000,
      duracionDias: 15,
      tipo: "tiempo",
      estado: "activo",
      caracteristicas: [
        { nombre: "Acceso a todas las áreas", incluido: true },
        { nombre: "Sin límite de visitas", incluido: true },
        { nombre: "Locker incluido", incluido: true }
      ]
    }
  ];
  
  res.json({
    success: true,
    data: planesHardcodeados,
    count: planesHardcodeados.length,
    message: "Planes cargados exitosamente (datos hardcodeados)"
  });
});

router.post('/', (req, res) => {
  console.log('📤 POST /api/planes - Recibiendo:', req.body);
  
  res.status(201).json({
    success: true,
    data: { ...req.body, _id: Date.now().toString() },
    message: "Plan creado exitosamente (modo simulación)"
  });
});

module.exports = router;
