/**
 * Script para crear un administrador inicial en MongoDB
 * Uso: node scripts/initAdmin.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const Admin = require('../server/models/Admin.model');

const initAdmin = async () => {
    try {
        console.log('🔗 Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gymflow');
        console.log('✅ Conectado a MongoDB');

        // Verificar si ya existe un admin
        const adminExistente = await Admin.findOne({ email: 'admin@gymflow.com' });
        
        if (adminExistente) {
            console.log('ℹ️  Admin ya existe: admin@gymflow.com');
            console.log('Contraseña: admin123');
        } else {
            // Crear admin inicial
            const adminInicial = new Admin({
                email: 'admin@gymflow.com',
                password: 'admin123',
                nombre: 'Administrador',
                rol: 'superadmin'
            });

            await adminInicial.save();
            console.log('✅ Admin creado exitosamente');
            console.log('📧 Email: admin@gymflow.com');
            console.log('🔑 Contraseña: admin123');
            console.log('⚠️  CAMBIA LA CONTRASEÑA EN PRODUCCIÓN');
        }

        await mongoose.connection.close();
        console.log('🔌 Conexión cerrada');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

initAdmin();
