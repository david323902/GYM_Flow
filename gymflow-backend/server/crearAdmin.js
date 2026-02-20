const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function crearAdmin() {
    try {
        console.log('🔗 Conectando a MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/gymflow');
        console.log('✅ Conectado a MongoDB');
        
        // Definir esquema de Admin
        const adminSchema = new mongoose.Schema({
            email: { type: String, required: true, unique: true },
            password: { type: String, required: true },
            nombre: { type: String, required: true },
            rol: { type: String, enum: ['superadmin', 'secretaria'], default: 'secretaria' },
            isActive: { type: Boolean, default: true }
        }, { timestamps: true });
        
        // Hook para hashear contraseña
        adminSchema.pre('save', async function() {
            if (!this.isModified('password')) return;
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        });
        
        const Admin = mongoose.model('Admin', adminSchema);
        
        // Eliminar admin existente si hay
        await Admin.deleteOne({ email: 'admin@gymflow.com' });
        
        // Crear nuevo admin
        const admin = new Admin({
            email: 'admin@gymflow.com',
            password: '123456', // Se hasheará automáticamente
            nombre: 'Administrador',
            rol: 'superadmin',
            isActive: true
        });
        
        await admin.save();
        
        console.log('🎉 ADMINISTRADOR CREADO EXITOSAMENTE');
        console.log('===================================');
        console.log('📧 Email: admin@gymflow.com');
        console.log('🔑 Password: 123456');
        console.log('👤 Nombre: Administrador');
        console.log('👑 Rol: superadmin');
        console.log('===================================');
        console.log('💡 Usa estas credenciales para hacer login');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.message.includes('connect')) {
            console.log('');
            console.log('⚠️  MongoDB no está corriendo. Soluciones:');
            console.log('   1. Inicia MongoDB: net start MongoDB');
            console.log('   2. O instala MongoDB: https://www.mongodb.com/try/download/community');
            console.log('   3. O usa Docker: docker run -d -p 27017:27017 mongo');
        }
        process.exit(1);
    }
}

crearAdmin();
