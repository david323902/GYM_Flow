﻿﻿const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const allRoutes = require('./routes/index.routes');

console.log('🚀 Iniciando GymFlow Backend...');
console.log('📅', new Date().toLocaleString());

const app = express();

// Configuración
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gymflow';

console.log('📋 Configuración:');
console.log(`   🗄️  MongoDB: ${MONGODB_URI}`);
console.log(`   🌐 Puerto: ${PORT}`);
console.log(`   🔐 JWT: Configurado`);

// Middleware
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir peticiones sin origen (como Postman) y desde tu frontend
    if (!origin || origin === 'http://localhost:5173') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true // Para permitir cookies y cabeceras de autorización
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== RUTAS ====================
app.use('/api', allRoutes);

// ==================== INICIO DEL SERVIDOR ====================

const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Conectado a MongoDB');

    app.listen(PORT, () => {
      console.log('==================================================');
      console.log('🚀 GYMFLOW BACKEND INICIADO');
      console.log('==================================================');
      console.log(`📍 Servidor corriendo en: http://localhost:${PORT}`);
      console.log(`🔑 Login: POST /api/auth/login`);
      console.log(`❤️  Health: GET /api/health`);
      console.log('==================================================');
    });
  } catch (err) {
    console.error('❌ Error fatal al iniciar el servidor:', err.message);
    console.log('💡 Asegúrate de que MongoDB esté corriendo y la URI sea correcta.');
    process.exit(1);
  }
};

startServer();

module.exports = app;