// Script para crear usuarios de prueba
require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const Usuario = require('../server/models/Usuario.model');

const usuarios = [
  {
    nombre: 'Juan Pérez',
    documento: '1234567890',
    email: 'juan@example.com',
    telefono: '3001234567',
    plan: 'Mensualidad Premium',
    tipoPlan: 'mensualidad',
    fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
    estado: 'activo'
  },
  {
    nombre: 'María García',
    documento: '0987654321',
    email: 'maria@example.com',
    telefono: '3009876543',
    plan: 'Tiquetera 20 sesiones',
    tipoPlan: 'tiquetera',
    entradas: 20,
    entradasRestantes: 20,
    fechaVencimiento: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 días
    estado: 'activo'
  },
  {
    nombre: 'Carlos López',
    documento: '1122334455',
    email: 'carlos@example.com',
    telefono: '3005555555',
    plan: 'Mensualidad Básica',
    tipoPlan: 'mensualidad',
    fechaVencimiento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 días
    estado: 'activo'
  },
  {
    nombre: 'Ana Martínez',
    documento: '5566778899',
    email: 'ana@example.com',
    telefono: '3007777777',
    plan: 'Tiquetera 10 sesiones',
    tipoPlan: 'tiquetera',
    entradas: 10,
    entradasRestantes: 5,
    fechaVencimiento: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 días
    estado: 'activo'
  }
];

async function seedUsuarios() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gymflow');
    console.log('✅ Conectado a MongoDB');

    console.log('\n🗑️  Limpiando usuarios existentes...');
    await Usuario.deleteMany({});
    console.log('✅ Usuarios eliminados');

    console.log('\n📝 Insertando usuarios de prueba...');
    const resultado = await Usuario.insertMany(usuarios);
    console.log(`✅ ${resultado.length} usuarios creados exitosamente`);

    console.log('\n📋 Usuarios creados:');
    resultado.forEach(user => {
      console.log(`  - ${user.nombre} (Doc: ${user.documento}) - Plan: ${user.plan}`);
    });

    console.log('\n🎯 Puedes usar estos documentos para registrar asistencia:');
    usuarios.forEach(user => {
      console.log(`   ${user.documento} (${user.nombre})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedUsuarios();
