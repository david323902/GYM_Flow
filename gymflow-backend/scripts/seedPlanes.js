// server/scripts/seedPlanes.js
const mongoose = require('mongoose');
const Plan = require('../models/Plan');
require('dotenv').config();

const planesPredefinidos = [
  {
    nombre: "Quincena",
    descripcion: "15 días de acceso ilimitado",
    precio: 30000,
    duracionDias: 15,
    tipo: "tiempo",
    caracteristicas: [
      { nombre: "Acceso a todas las áreas", incluido: true },
      { nombre: "Sin límite de visitas", incluido: true },
      { nombre: "Locker incluido", incluido: true },
      { nombre: "Clases grupales", incluido: false }
    ],
    estado: "activo"
  },
  {
    nombre: "Mensual",
    descripcion: "30 días de acceso completo",
    precio: 50000,
    duracionDias: 30,
    tipo: "tiempo",
    caracteristicas: [
      { nombre: "Todo lo del plan quincenal", incluido: true },
      { nombre: "2 clases grupales incluidas", incluido: true },
      { nombre: "Asesoría nutricional básica", incluido: true },
      { nombre: "1 invitado por mes", incluido: true }
    ],
    estado: "activo"
  },
  {
    nombre: "Tiquetera",
    descripcion: "12 entradas, válido por 60 días",
    precio: 40000,
    tipo: "entradas",
    entradasIncluidas: 12,
    duracionDias: 60,
    caracteristicas: [
      { nombre: "12 entradas", incluido: true },
      { nombre: "Válido por 60 días", incluido: true },
      { nombre: "Puede compartir", incluido: true },
      { nombre: "Sin fecha fija", incluido: true }
    ],
    estado: "activo"
  },
  {
    nombre: "Trimestral",
    descripcion: "90 días con descuento especial",
    precio: 120000,
    duracionDias: 90,
    tipo: "tiempo",
    caracteristicas: [
      { nombre: "Descuento del 20%", incluido: true },
      { nombre: "1 acompañante gratis al mes", incluido: true },
      { nombre: "Clases grupales ilimitadas", incluido: true },
      { nombre: "Evaluación física completa", incluido: true }
    ],
    estado: "activo"
  },
  {
    nombre: "Personalizado",
    descripcion: "Entrenamiento personalizado + acceso",
    precio: 180000,
    duracionDias: 30,
    tipo: "personalizado",
    caracteristicas: [
      { nombre: "8 sesiones de entrenamiento personal", incluido: true },
      { nombre: "Plan nutricional personalizado", incluido: true },
      { nombre: "Seguimiento semanal", incluido: true },
      { nombre: "Análisis de composición corporal", incluido: true }
    ],
    estado: "activo"
  }
];

const seedPlanes = async () => {
  try {
    // Conectar a MongoDB - usa la cadena de conexión correcta
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gymflow';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conectado a MongoDB');

    // Eliminar planes existentes
    const result = await Plan.deleteMany({});
    console.log(`🗑️  ${result.deletedCount} planes anteriores eliminados`);

    // Insertar nuevos planes
    await Plan.insertMany(planesPredefinidos);
    console.log(`✨ ${planesPredefinidos.length} planes creados exitosamente`);

    // Mostrar planes creados
    console.log('\n📋 PLANES DISPONIBLES:');
    console.log('='.repeat(50));
    
    const planes = await Plan.find({}).sort({ precio: 1 });
    planes.forEach((plan, index) => {
      console.log(`\n${index + 1}. 🏷️  ${plan.nombre.toUpperCase()}`);
      console.log(`   💰 Precio: $${plan.precio.toLocaleString()}`);
      console.log(`   📅 Duración: ${plan.duracionDias} días`);
      console.log(`   📝 ${plan.descripcion}`);
      
      if (plan.tipo === 'entradas') {
        console.log(`   🎟️  Entradas incluidas: ${plan.entradasIncluidas}`);
      }
    });

    console.log('\n✅ Seed completado exitosamente');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  seedPlanes();
}

module.exports = seedPlanes;