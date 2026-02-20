const mongoose = require('mongoose');
const Plan = require('../models/Plan.js');
const path =require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function crearPlanesIniciales() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI no está definida en tu archivo .env');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Verificar si ya hay planes
    const conteoPlanes = await Plan.countDocuments();
    
    if (conteoPlanes > 0) {
      console.log(`📊 Ya existen ${conteoPlanes} planes en la base de datos. No se agregarán nuevos planes.`);
      await mongoose.disconnect();
      console.log('🔴 Desconectado de MongoDB.');
      return;
    }
    
    // Crear planes iniciales
    const planesIniciales = [
      {
        nombre: 'Mensual',
        descripcion: 'Acceso por un mes',
        precio: 50000,
        duracion: 30,
        tipo: 'mensual',
        entradasIncluidas: 0
      },
      {
        nombre: 'Trimestral',
        descripcion: 'Acceso por tres meses',
        precio: 120000,
        duracion: 90,
        tipo: 'trimestral',
        entradasIncluidas: 0
      },
      {
        nombre: 'Anual',
        descripcion: 'Acceso por un año',
        precio: 400000,
        duracion: 365,
        tipo: 'anual',
        entradasIncluidas: 0
      },
      {
        nombre: 'Diario',
        descripcion: 'Acceso por un día',
        precio: 5000,
        duracion: 1,
        tipo: 'diario',
        entradasIncluidas: 1
      }
    ];
    
    console.log('📝 Creando planes iniciales...');
    
    await Plan.insertMany(planesIniciales);
    console.log(`✅ ${planesIniciales.length} planes creados exitosamente.`);
    
    console.log('🎉 Proceso completado.');
    
    await mongoose.disconnect();
    console.log('🔴 Desconectado de MongoDB.');
    
  } catch (error) {
    console.error('❌ Error en el script de creación de planes:', error.message);
    process.exit(1);
  }
}

crearPlanesIniciales();