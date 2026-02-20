﻿﻿﻿// server/index.js - VERSIÓN CON NOTIFICACIONES
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ===================== VERIFICAR VARIABLES DE ENTORNO =====================
console.log('\n🔍 Verificando configuración...');
const configStatus = {
  'PORT': process.env.PORT || '5000 (default)',
  'MONGODB_URI': process.env.MONGODB_URI ? '✅ Configurado' : '❌ No configurado',
  'JWT_SECRET': process.env.JWT_SECRET ? '✅ Configurado' : '❌ No configurado',
  'EMAIL_USER': process.env.EMAIL_USER ? `✅ ${process.env.EMAIL_USER}` : '❌ No configurado',
  'EMAIL_PASSWORD': process.env.EMAIL_PASSWORD ? '✅ Configurado (oculto)' : '❌ No configurado',
  'EMAIL_SERVICE': process.env.EMAIL_SERVICE || 'gmail (default)'
};

console.table(configStatus);

// Advertencia si falta configuración de email
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.warn('\n⚠️  ADVERTENCIA: Configuración de email incompleta');
  console.warn('   Las notificaciones por email NO funcionarán');
  console.warn('   Configura EMAIL_USER y EMAIL_PASSWORD en el archivo .env\n');
}

// ===================== MIDDLEWARE =====================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Logging de peticiones
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ===================== RUTAS BÁSICAS =====================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'GYMFlow API funcionando',
    version: '2.1',
    features: {
      email_notifications: !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD),
      cron_jobs: true
    },
    endpoints: {
      usuarios: '/api/usuarios',
      planes: '/api/planes',
      asistencias: '/api/asistencias',
      auth: '/api/auth',
      gastos: '/api/gastos',
      reportes: '/api/reportes',
      notificaciones: '/api/notificaciones',
      productos: '/api/productos',
      ventas: '/api/ventas',
      dashboard: '/api/dashboard',
      health: '/api/health'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    email_config: !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD),
    timestamp: new Date().toISOString()
  });
});

// ===================== CARGAR RUTAS =====================
console.log('\n🔧 Cargando rutas...');

// Función para cargar rutas de forma segura
const cargarRuta = (nombre, ruta) => {
  try {
    const modulo = require(ruta);
    if (typeof modulo !== 'function') {
      console.error(`❌ ${nombre}: El módulo no exporta un router válido`);
      return false;
    }
    app.use(nombre, modulo);
    console.log(`✅ ${nombre} cargado`);
    return true;
  } catch (error) {
    console.error(`❌ Error cargando ${nombre}:`, error.message);
    return false;
  }
};

// Cargar rutas en orden de prioridad
const rutasCargadas = {
  auth: cargarRuta('/api/auth', './routes/authRoutes'),
  usuarios: cargarRuta('/api/usuarios', './routes/usuarios.routes'),
  planes: cargarRuta('/api/planes', './routes/planes.routes'),
  asistencias: cargarRuta('/api/asistencias', './routes/asistencias.routes'),
  transacciones: cargarRuta('/api/transacciones', './routes/transaccion.routes'),
  notificaciones: cargarRuta('/api/notificaciones', './routes/notificacionRoutes'),
  productos: cargarRuta('/api/productos', './routes/producto.routes'),
  ventas: cargarRuta('/api/ventas', './routes/venta.routes'),
  dashboard: cargarRuta('/api/dashboard', './routes/dashboard.routes')
};

const totalRutas = Object.keys(rutasCargadas).length;
const rutasExitosas = Object.values(rutasCargadas).filter(Boolean).length;

console.log(`\n📊 Resumen: ${rutasExitosas}/${totalRutas} rutas cargadas exitosamente`);

// ===================== INICIAR TAREAS PROGRAMADAS =====================
let cronJobsIniciados = false;

const iniciarCronJobs = () => {
  try {
    const { iniciarCronJobs } = require('./jobs/cronJobs');
    
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      iniciarCronJobs();
      cronJobsIniciados = true;
      console.log('✅ Tareas programadas iniciadas');
    } else {
      console.warn('⚠️  Tareas programadas NO iniciadas (falta configuración de email)');
    }
  } catch (error) {
    console.warn('⚠️  No se pudieron iniciar las tareas programadas:', error.message);
    console.warn('   Verifica que el archivo ./jobs/cronJobs.js exista');
  }
};

// ===================== MANEJO DE ERRORES =====================
// 404 - Rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl,
    suggestion: 'Verifica los endpoints disponibles en GET /'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error del servidor:', err.message);
  
  res.status(err.status || 500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error del servidor',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ===================== CONEXIÓN MONGODB =====================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gymflow';

console.log('\n🔌 Conectando a MongoDB...');
console.log(`   URI: ${MONGODB_URI.replace(/\/\/.*:.*@/, '//***:***@')}`); // Ocultar credenciales

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000
})
  .then(() => {
    console.log('✅ Conectado a MongoDB exitosamente');
    
    // Iniciar tareas programadas después de conectar a la BD
    iniciarCronJobs();
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════╗
║          🚀 SERVIDOR GYMFLOW INICIADO                  ║
╠════════════════════════════════════════════════════════╣
║  Puerto:              ${PORT.toString().padEnd(31)}║
║  Ambiente:            ${(process.env.NODE_ENV || 'development').padEnd(31)}║
║  MongoDB:             ✅ Conectado                     ║
║  Email:               ${(process.env.EMAIL_USER ? '✅ Configurado' : '❌ No configurado').padEnd(31)}║
║  Notificaciones:      ${(cronJobsIniciados ? '✅ Activas' : '⚠️  Inactivas').padEnd(31)}║
║  Rutas cargadas:      ${rutasExitosas}/${totalRutas}                              ║
╠════════════════════════════════════════════════════════╣
║  📍 Endpoints principales:                             ║
║     • http://localhost:${PORT}/                           ║
║     • http://localhost:${PORT}/api/health                 ║
║     • http://localhost:${PORT}/api/auth                   ║
║     • http://localhost:${PORT}/api/usuarios               ║
║     • http://localhost:${PORT}/api/planes                 ║
║     • http://localhost:${PORT}/api/asistencias            ║
║     • http://localhost:${PORT}/api/notificaciones         ║
╠════════════════════════════════════════════════════════╣
║  🧪 Probar notificaciones:                             ║
║     GET  /api/notificaciones/verificar-config          ║
║     POST /api/notificaciones/test                      ║
╚════════════════════════════════════════════════════════╝
      `);
    });
  })
  .catch(err => {
    console.error('❌ Error conectando a MongoDB:', err.message);
    console.log('\n⚠️  Posibles soluciones:');
    console.log('   1. Verifica que MongoDB esté corriendo: mongod');
    console.log('   2. Revisa la URI en el archivo .env');
    console.log('   3. Asegúrate de tener permisos de conexión');
    console.log(`\n💡 URI usada: ${MONGODB_URI}`);
    
    // Iniciar servidor sin MongoDB (modo demo/desarrollo)
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════╗
║          ⚠️  SERVIDOR EN MODO LIMITADO                 ║
╠════════════════════════════════════════════════════════╣
║  Puerto:              ${PORT.toString().padEnd(31)}║
║  MongoDB:             ❌ Desconectado                  ║
║  Rutas cargadas:      ${rutasExitosas}/${totalRutas}                              ║
║                                                        ║
║  ⚠️  Las rutas que requieren base de datos            ║
║      no funcionarán correctamente                      ║
╚════════════════════════════════════════════════════════╝
      `);
    });
  });

// ===================== MANEJO DE CIERRE GRACEFUL =====================
process.on('SIGINT', async () => {
  console.log('\n\n⏳ Cerrando servidor...');
  
  try {
    // Detener tareas programadas
    if (cronJobsIniciados) {
      const { detenerCronJobs } = require('./jobs/cronJobs');
      detenerCronJobs();
      console.log('✅ Tareas programadas detenidas');
    }
    
    // Cerrar conexión a MongoDB
    await mongoose.connection.close();
    console.log('✅ Conexión a MongoDB cerrada');
    
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al cerrar servidor:', error);
    process.exit(1);
  }
});

// Exportar app para testing
module.exports = app;