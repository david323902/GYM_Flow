require('dotenv').config();
const mongoose = require('mongoose');

console.log('Diagnostico iniciado');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
console.log('MONGO_URI:', MONGO_URI);

if (!MONGO_URI) {
  console.error('ERROR: No hay MONGO_URI');
  process.exit(1);
}

async function diagnosticar() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Conectado a MongoDB');

    const Usuario = require('./server/models/usuario.model');
    const Plan = require('./server/models/plan.model');
    console.log('Modelos importados');

    const countUsuarios = await Usuario.countDocuments();
    const countPlanes = await Plan.countDocuments();
    
    console.log('Usuarios:', countUsuarios);
    console.log('Planes:', countPlanes);

    if (countUsuarios > 0) {
      const usuarios = await Usuario.find().populate('plan').limit(1);
      console.log('Usuario ejemplo:', JSON.stringify(usuarios[0], null, 2));
    }

    console.log('Diagnostico OK');
    process.exit(0);

  } catch (error) {
    console.error('ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

diagnosticar();
