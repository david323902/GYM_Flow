const mongoose = require('mongoose');
const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: path.resolve(__dirname, '../server/.env') });

const connectDB = require('../server/models/database');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const eliminarColeccionClientes = async () => {
  try {
    await connectDB();
    console.log('✅ Conectado a la base de datos.');

    const collections = await mongoose.connection.db.listCollections({ name: 'clientes' }).toArray();
    if (collections.length === 0) {
      console.log('👍 La colección "clientes" no existe. No hay nada que eliminar.');
      await mongoose.connection.close();
      return;
    }

    console.log('\n' + '⚠️'.repeat(20));
    console.log('ADVERTENCIA: Estás a punto de eliminar PERMANENTEMENTE la colección "clientes".');
    console.log('Esta acción no se puede deshacer. Asegúrate de haber migrado los datos.');
    console.log('⚠️'.repeat(20) + '\n');

    rl.question('Escribe "eliminar clientes" para confirmar: ', async (answer) => {
      if (answer === 'eliminar clientes') {
        console.log('\n🗑️  Eliminando colección "clientes"...');
        await mongoose.connection.db.dropCollection('clientes');
        console.log('✅ Colección "clientes" eliminada exitosamente.');
      } else {
        console.log('\n🚫 Operación cancelada. La colección no ha sido eliminada.');
      }
      rl.close();
      await mongoose.connection.close();
      console.log('🔌 Conexión a la base de datos cerrada.');
    });

  } catch (error) {
    console.error('❌ Error durante el proceso:', error);
    if (rl) rl.close();
    if (mongoose.connection.readyState === 1) await mongoose.connection.close();
  }
};

eliminarColeccionClientes();