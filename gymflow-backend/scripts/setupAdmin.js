// gymflow-backend/scripts/setupAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './server/.env' });

async function setupAdmin() {
  try {
    console.log('🔗 Conectando a MongoDB...');
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gymflow';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Definir el esquema de Admin (igual que en el modelo)
    const AdminSchema = new mongoose.Schema({
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
      },
      password: {
        type: String,
        required: true
      },
      nombre: {
        type: String,
        required: true
      },
      rol: {
        type: String,
        enum: ['superadmin', 'secretaria'],
        default: 'secretaria'
      }
    });
    
    // Usar el modelo si existe, o crear uno temporal
    let Admin;
    try {
      Admin = mongoose.model('Admin');
    } catch {
      Admin = mongoose.model('Admin', AdminSchema);
    }
    
    // Borrar admin existente si hay
    console.log('🗑️  Eliminando admin existente...');
    await Admin.deleteOne({ email: 'admin@test.com' });
    
    // Crear nuevo admin
    console.log('🔄 Creando nuevo admin...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = new Admin({
      email: 'admin@test.com',
      password: hashedPassword,
      nombre: 'Administrador Principal',
      rol: 'superadmin'
    });
    
    await admin.save();
    console.log('✅ Admin creado exitosamente');
    console.log('📋 Datos:');
    console.log('   📧 Email: admin@test.com');
    console.log('   🔑 Password: admin123');
    console.log('   👤 Nombre: Administrador Principal');
    console.log('   👑 Rol: superadmin');
    
    // Mostrar todos los admins
    const admins = await Admin.find({}, 'email nombre rol');
    console.log('\n👥 Todos los admins en la BD:');
    if (admins.length === 0) {
      console.log('   No hay admins en la BD');
    } else {
      admins.forEach((a, i) => {
        console.log(`   ${i+1}. ${a.email} - ${a.nombre} (${a.rol})`);
      });
    }
    
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('💥 Stack:', error.stack);
    process.exit(1);
  }
}

setupAdmin();