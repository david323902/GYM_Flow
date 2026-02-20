// test-with-env.js
require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔌 Probando conexión con variables de entorno...');
console.log('MONGODB_URI:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ ¡Conectado a MongoDB usando variables de entorno!');
    
    // Crear la base de datos gymflow si no existe
    const db = mongoose.connection.db;
    console.log('📊 Base de datos:', db.databaseName);
    
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });