// server/tests/testAsistencias.js
const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  console.log('🧪 Iniciando prueba de conexión...\n');
  
  try {
    // Conectar a MongoDB
    console.log('🔗 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    // Verificar colecciones
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('📊 Colecciones en la base de datos:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Contar documentos
    console.log('\n📄 Documentos por colección:');
    
    for (const col of collections) {
      try {
        const count = await db.collection(col.name).countDocuments();
        console.log(`   - ${col.name}: ${count} documentos`);
      } catch (err) {
        console.log(`   - ${col.name}: Error al contar`);
      }
    }
    
    // Verificar índices
    console.log('\n🔍 Índices en colección "usuarios":');
    try {
      const indexes = await db.collection('usuarios').indexes();
      indexes.forEach((index, i) => {
        console.log(`   ${i + 1}. ${JSON.stringify(index.key)}`);
      });
    } catch (err) {
      console.log('   ❌ No se pudieron obtener índices');
    }
    
    // Test de consulta básica
    console.log('\n📋 Test de consulta de usuarios:');
    try {
      const Usuario = require('../models/usuario.model');
      const usuarios = await Usuario.find().limit(5).lean();
      console.log(`   ✅ ${usuarios.length} usuarios encontrados`);
      usuarios.forEach((usuario, i) => {
        console.log(`     ${i + 1}. ${usuario.nombre} - ${usuario.documento}`);
      });
    } catch (err) {
      console.log('   ❌ Error consultando usuarios:', err.message);
    }
    
    // Desconectar
    console.log('\n🔌 Desconectando de MongoDB...');
    await mongoose.disconnect();
    console.log('✅ Prueba completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    console.error('\n🔧 Posibles soluciones:');
    console.error('1. Verifica que MongoDB esté corriendo');
    console.error('2. Revisa la URI en .env');
    console.error('3. Asegúrate de tener permisos de lectura/escritura');
    
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testConnection();
}

module.exports = testConnection;