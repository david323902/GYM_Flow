// test-simple.js - Archivo de prueba simple
const mongoose = require('mongoose');

console.log('🔌 Probando conexión a MongoDB...');

// Conectar directamente sin variables de entorno
mongoose.connect('mongodb://localhost:27017/gymflow')
  .then(() => {
    console.log('✅ ¡Conectado a MongoDB exitosamente!');
    console.log('🎉 MongoDB está funcionando correctamente');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error conectando a MongoDB:', error.message);
    console.log('💡 Asegúrate de que MongoDB esté ejecutándose');
    process.exit(1);
  });