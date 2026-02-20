const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

async function createAdmin() {
    try {
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gymflow');
        console.log('✅ Conectado a MongoDB');

        // Verificar si ya existe el modelo Admin
        const Admin = require('../models/Admin');
        
        // Verificar si ya existe un admin
        const existingAdmin = await Admin.findOne({ email: 'admin@gymflow.com' });
        if (existingAdmin) {
            console.log('✅ Admin ya existe:', existingAdmin.email);
            process.exit(0);
        }

        // Crear contraseña hasheada
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // Crear admin
        const admin = new Admin({
            email: 'admin@gymflow.com',
            password: hashedPassword,
            nombre: 'Administrador',
            role: 'superadmin'
        });

        await admin.save();
        
        console.log('✅ Admin creado exitosamente!');
        console.log('📧 Email: admin@gymflow.com');
        console.log('🔑 Password: admin123');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

createAdmin();