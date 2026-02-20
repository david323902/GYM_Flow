const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../server/.env') });

const bcrypt = require('bcryptjs');
const Admin = require('../server/models/Admin.model');

async function resetAdmin() {
    let connection = null;
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gymflow';
        
        console.log('🔌 Conectando a MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado a MongoDB');
        
        const db = mongoose.connection.db; // Usar la conexión nativa para la operación de borrado
        
        console.log('👤 Limpiando colección de admins...');
        await db.collection('admins').deleteMany({});
        console.log('✅ Colección limpiada');
        
        console.log('👤 Creando nuevo admin con el modelo de Mongoose...');
        const newAdmin = new Admin({
            email: 'admin@gymflow.com',
            password: 'admin123', // La contraseña en texto plano. El hook pre-save se encargará de hashearla.
            nombre: 'Admin Principal',
            rol: 'superadmin',
            isActive: true
        });
        
        // Al guardar, el hook 'pre-save' en el modelo Admin se activará
        // y hasheará la contraseña de forma segura antes de almacenarla.
        await newAdmin.save();

        console.log('✅ Admin creado exitosamente');
        console.log('📧 Email: admin@gymflow.com');
        console.log('🔐 Password: admin123');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('✅ Conexión cerrada');
        }
        process.exit(0);
    }
}

resetAdmin();
