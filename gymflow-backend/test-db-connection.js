const { MongoClient } = require('mongodb');
// Intenta cargar variables de entorno si usas dotenv
try { require('dotenv').config(); } catch (e) { console.log('Nota: dotenv no cargado'); }

async function testConnection() {
  // ⚠️ IMPORTANTE: Asegúrate de que esta variable coincida con la de tu archivo .env
  // Si no usas .env, reemplaza process.env.MONGODB_URI con tu string de conexión real entre comillas.
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gymflow';
  
  console.log('\n🔌 INICIANDO PRUEBA DE CONEXIÓN...');
  console.log('📝 URI:', uri.replace(/:([^:@]{1,})@/, ':****@')); // Oculta la contraseña en el log

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000, // Tiempo límite corto (5s) para fallar rápido si no hay conexión
    connectTimeoutMS: 5000
  });

  try {
    console.log('⏳ Conectando...');
    await client.connect();
    console.log('✅ ¡CONEXIÓN EXITOSA!');
    
    const db = client.db();
    console.log(`🗄️  Base de datos: ${db.databaseName}`);
    
    const collections = await db.listCollections().toArray();
    console.log('📂 Colecciones encontradas:', collections.map(c => c.name).join(', '));
    
    await client.db().command({ ping: 1 });
    console.log('🏓 Ping exitoso. La base de datos responde correctamente.\n');

  } catch (error) {
    console.error('\n❌ ERROR DE CONEXIÓN:', error.message);
    console.error('💡 SUGERENCIA: Verifica tu IP en MongoDB Atlas (Network Access) o que tu servicio local esté corriendo.\n');
  } finally {
    await client.close();
  }
}

testConnection();