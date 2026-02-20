const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function crearAdmin() {
  try {
    console.log('🔗 Conectando a MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/gymflow');
    console.log('✅ Conectado a MongoDB');
    
    // Definir esquema
    const AdminSchema = new mongoose.Schema({
      email: String,
      password: String,
      nombre: String,
      rol: String
    });
    
    const Admin = mongoose.model('Admin', AdminSchema);
    
    // Borrar si existe
    console.log('🗑️  Eliminando admin existente...');
    await Admin.deleteOne({ email: 'admin@gymflow.com' });
    
    // Crear nuevo admin
    console.log('🔄 Creando nuevo admin...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = new Admin({
      email: 'admin@gymflow.com',
      password: hashedPassword,
      nombre: 'Administrador Principal',
      rol: 'superadmin'
    });
    
    await admin.save();
    console.log('✅ Admin creado exitosamente');
    console.log('📋 Datos:');
    console.log('   📧 Email: admin@gymflow.com');
    console.log('   🔑 Password: admin123');
    console.log('   👤 Nombre: Administrador Principal');
    console.log('   👑 Rol: superadmin');
    
    mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

crearAdmin();
