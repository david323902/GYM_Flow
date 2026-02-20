// server/seedPlans.js
const mongoose = require('mongoose');
require('dotenv').config();

async function crearPlanesPorDefecto() {
  console.log('🌱 Creando planes por defecto...\n');
  
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    // Modelo de Plan
    const PlanSchema = new mongoose.Schema({
      nombre: String,
      descripcion: String,
      precio: Number,
      duracionDias: Number,
      cantidad_entradas: Number,
      tipo: String,
      activo: Boolean
    }, { timestamps: true });
    
    const Plan = mongoose.models.Plan || mongoose.model('Plan', PlanSchema);
    
    // Planes por defecto
    const planesPorDefecto = [
      {
        nombre: 'Mensual Básico',
        descripcion: 'Acceso ilimitado por 30 días',
        precio: 50000,
        duracionDias: 30,
        cantidad_entradas: 0, // Ilimitado
        tipo: 'mensual',
        activo: true
      },
      {
        nombre: 'Tiquetera 12 Entradas',
        descripcion: '12 entradas válidas por 60 días',
        precio: 40000,
        duracionDias: 60,
        cantidad_entradas: 12,
        tipo: 'tiquetera',
        activo: true
      },
      {
        nombre: 'Quincenal',
        descripcion: 'Acceso por 15 días',
        precio: 30000,
        duracionDias: 15,
        cantidad_entradas: 0,
        tipo: 'quincenal',
        activo: true
      },
      {
        nombre: 'Trimestral',
        descripcion: 'Acceso por 90 días',
        precio: 120000,
        duracionDias: 90,
        cantidad_entradas: 0,
        tipo: 'trimestral',
        activo: true
      },
      {
        nombre: 'Prueba 1 Día',
        descripcion: 'Acceso por 1 día de prueba',
        precio: 5000,
        duracionDias: 1,
        cantidad_entradas: 1,
        tipo: 'diario',
        activo: true
      }
    ];
    
    // Eliminar planes existentes
    await Plan.deleteMany({});
    console.log('🗑️  Planes anteriores eliminados\n');
    
    // Insertar nuevos planes
    const planesCreados = await Plan.insertMany(planesPorDefecto);
    console.log(`✅ ${planesCreados.length} planes creados:\n`);
    
    planesCreados.forEach(plan => {
      console.log(`   📌 ${plan.nombre}`);
      console.log(`     💰 Precio: $${plan.precio?.toLocaleString()}`);
      console.log(`     📅 Duración: ${plan.duracionDias} días`);
      console.log(`     🎫 Entradas: ${plan.cantidad_entradas === 0 ? 'Ilimitadas' : plan.cantidad_entradas}`);
      console.log(`     🔑 ID: ${plan._id}\n`);
    });
    
    // Guardar IDs en un archivo para referencia
    const fs = require('fs');
    const ids = planesCreados.map(p => ({ nombre: p.nombre, id: p._id }));
    fs.writeFileSync('planes_ids.json', JSON.stringify(ids, null, 2));
    console.log('📄 IDs guardados en planes_ids.json\n');
    
    console.log('🎉 Planes creados exitosamente!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error creando planes:', error);
    process.exit(1);
  }
}


