const mongoose = require('mongoose');
const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: path.resolve(__dirname, '../server/.env') });

// Importar modelo
const Usuario = require('../server/models/Usuario.model');

async function eliminarUsuariosInactivos() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gymflow';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // 1. Calcular fecha de corte (Hace 1 año)
    const unAnioAtras = new Date();
    unAnioAtras.setFullYear(unAnioAtras.getFullYear() - 1);
    
    console.log(`📅 Fecha de corte: ${unAnioAtras.toLocaleDateString()} (Usuarios sin actividad antes de esta fecha)`);

    // 2. Construir Query
    // - Estado NO es 'activo' (para seguridad)
    // - Y (última asistencia antigua O (nunca asistió Y creado hace mucho))
    const query = {
      estado: { $ne: 'activo' }, 
      $or: [
        { ultima_asistencia: { $lt: unAnioAtras } },
        { ultima_asistencia: { $exists: false }, createdAt: { $lt: unAnioAtras } }
      ]
    };

    // 3. Buscar candidatos
    const usuarios = await Usuario.find(query).select('nombre documento ultima_asistencia createdAt estado');
    const count = usuarios.length;

    if (count === 0) {
      console.log('✨ No se encontraron usuarios inactivos para eliminar.');
      process.exit(0);
    }

    console.log(`\n🔍 Se encontraron ${count} usuarios inactivos:`);
    console.log('='.repeat(60));
    usuarios.forEach(u => {
      const fechaRef = u.ultima_asistencia || u.createdAt;
      const tipoFecha = u.ultima_asistencia ? 'Última asistencia' : 'Creado';
      console.log(`👤 ${u.nombre.padEnd(30)} | Doc: ${u.documento.padEnd(12)} | ${tipoFecha}: ${new Date(fechaRef).toLocaleDateString()}`);
    });
    console.log('='.repeat(60));

    // 4. Confirmación y Eliminación
    // Nota: En un script automatizado podrías quitar esta parte, pero es mejor prevenir.
    console.log(`\n⚠️  ADVERTENCIA: Estás a punto de eliminar permanentemente ${count} usuarios.`);
    console.log('   Esta acción no se puede deshacer.');
    
    // Ejecutar eliminación
    const resultado = await Usuario.deleteMany(query);
    console.log(`\n🗑️  Operación completada: ${resultado.deletedCount} usuarios eliminados.`);

  } catch (error) {
    console.error('❌ Error crítico:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Conexión cerrada');
    }
    process.exit(0);
  }
}

eliminarUsuariosInactivos();