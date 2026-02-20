const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🔌 Probando conexión a MongoDB local...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ ¡Conectado a MongoDB local exitosamente!');
    
    // Listar bases de datos
    const adminDb = mongoose.connection.db.admin();
    const result = await adminDb.listDatabases();
    console.log('📊 Bases de datos disponibles:');
    result.databases.forEach(db => {
      console.log(`   - ${db.name} (${db.sizeOnDisk} bytes)`);
    });
    
    await mongoose.connection.close();
    console.log('🎉 ¡Prueba completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    console.log('\n💡 Solución de problemas:');
    console.log('1. ¿Ejecutaste "mongod" en una terminal?');
    console.log('2. ¿El directorio C:\\data\\db existe?');
    console.log('3. Verifica que el puerto 27017 esté disponible');
  }
}

testConnection();