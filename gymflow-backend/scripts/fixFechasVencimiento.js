const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../server/.env') });

// Importar modelos
const Usuario = require('../server/models/Usuario.model');
const Plan = require('../server/models/plan.model');

async function fixFechasVencimiento() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gymflow';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    console.log('🔍 Analizando usuarios...');
    // Usamos lean() para ver el documento crudo (incluyendo campos legacy que no estén en el esquema)
    const usuarios = await Usuario.find({}).lean();
    
    let count = 0;
    let errors = 0;

    for (const usuario of usuarios) {
      let setFields = {};
      let unsetFields = {};
      let needsUpdate = false;
      
      // 1. Verificar fecha de vencimiento
      // Buscamos fecha_vencimiento (snake_case) o fechaVencimiento (camelCase legacy)
      let fechaVenc = usuario.fecha_vencimiento ? new Date(usuario.fecha_vencimiento) : null;
      const fechaLegacy = usuario.fechaVencimiento ? new Date(usuario.fechaVencimiento) : null;

      if (!fechaVenc || isNaN(fechaVenc.getTime())) {
        // Caso A: Existe el campo antiguo (camelCase) pero no el nuevo
        if (fechaLegacy && !isNaN(fechaLegacy.getTime())) {
          console.log(`\n👤 Usuario: ${usuario.nombre} (${usuario._id})`);
          console.log(`   💡 Migrando fechaVencimiento antigua: ${fechaLegacy.toISOString().split('T')[0]}`);
          
          fechaVenc = fechaLegacy;
          setFields.fecha_vencimiento = fechaVenc;
          unsetFields.fechaVencimiento = ""; // Marcar para eliminar
          needsUpdate = true;
        } 
        // Caso B: No hay fecha, calcular desde fecha_inicio
        else if (usuario.fecha_inicio) {
          console.log(`\n👤 Usuario: ${usuario.nombre} (${usuario._id})`);
          
          let diasDuracion = 30; // Default mensual
          
          // Intentar obtener duración real del plan
          if (usuario.plan_id) {
            try {
              const plan = await Plan.findById(usuario.plan_id);
              if (plan && plan.duracionDias) {
                diasDuracion = plan.duracionDias;
              }
            } catch (e) {
              // Ignorar error de plan no encontrado
            }
          }
          
          const inicio = new Date(usuario.fecha_inicio);
          fechaVenc = new Date(inicio);
          fechaVenc.setDate(fechaVenc.getDate() + diasDuracion);
          
          console.log(`   🔄 Calculando fecha: Inicio (${inicio.toISOString().split('T')[0]}) + ${diasDuracion} días = ${fechaVenc.toISOString().split('T')[0]}`);
          setFields.fecha_vencimiento = fechaVenc;
          needsUpdate = true;
        }
      }

      // 2. Verificar y corregir estado basado en la fecha válida
      if (fechaVenc && !isNaN(fechaVenc.getTime())) {
        const hoy = new Date();
        const estadoActual = usuario.estado;
        let nuevoEstado = estadoActual;

        // Lógica de estado: Si venció ayer o antes, está vencido.
        if (fechaVenc < hoy && estadoActual === 'activo') {
          nuevoEstado = 'vencido';
          if (!needsUpdate) console.log(`\n👤 Usuario: ${usuario.nombre} (${usuario._id})`);
          console.log(`   ⚠️ Plan vencido el ${fechaVenc.toISOString().split('T')[0]}. Cambiando estado a 'vencido'.`);
          needsUpdate = true;
        } else if (fechaVenc >= hoy && estadoActual === 'vencido') {
          nuevoEstado = 'activo';
          if (!needsUpdate) console.log(`\n👤 Usuario: ${usuario.nombre} (${usuario._id})`);
          console.log(`   ✅ Plan vigente hasta ${fechaVenc.toISOString().split('T')[0]}. Reactivando usuario.`);
          needsUpdate = true;
        }

        if (nuevoEstado !== estadoActual) {
          setFields.estado = nuevoEstado;
          needsUpdate = true;
        }
      }

      // 3. Aplicar cambios
      if (needsUpdate) {
        const updateOp = {};
        if (Object.keys(setFields).length > 0) updateOp.$set = setFields;
        if (Object.keys(unsetFields).length > 0) updateOp.$unset = unsetFields;

        try {
          await Usuario.updateOne({ _id: usuario._id }, updateOp);
          console.log('   💾 Usuario corregido exitosamente');
          count++;
        } catch (err) {
          console.error(`   ❌ Error actualizando usuario: ${err.message}`);
          errors++;
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Proceso completado.`);
    console.log(`📊 Usuarios corregidos: ${count}`);
    console.log(`❌ Errores: ${errors}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error crítico:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

fixFechasVencimiento();