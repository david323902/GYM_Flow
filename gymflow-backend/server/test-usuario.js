require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 Diagnóstico iniciado\n');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
console.log('MONGO_URI:', MONGO_URI ? '✅ Definida' : '❌ No definida');

if (!MONGO_URI) {
  console.error('❌ Verifica tu archivo .env');
  process.exit(1);
}

async function diagnosticar() {
  try {
    await mongoose.connect(MONGO_URI);
    const cleanURI = MONGO_URI.replace(/[\?&](useNewUrlParser|useUnifiedTopology)=true/g, '');
    await mongoose.connect(cleanURI);
    console.log('✅ Conectado a MongoDB\n');

    const Usuario = require('./server/models/usuario.model');
    const Plan = require('./server/models/plan.model');
    console.log('✅ Modelos importados\n');

    const countUsuarios = await Usuario.countDocuments();
    const countPlanes = await Plan.countDocuments();
    
    console.log(`👥 Usuarios: ${countUsuarios}`);
    console.log(`📋 Planes: ${countPlanes}\n`);

    if (countUsuarios > 0) {
      const usuarios = await Usuario.find().populate('plan').limit(2);
      console.log('Ejemplo de usuario:');
      console.log(JSON.stringify(usuarios[0], null, 2));
    }

    console.log('\n✅ Diagnóstico OK');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

diagnosticar();