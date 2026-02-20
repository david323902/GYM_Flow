const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

async function crearUsuariosIniciales() {
    try {
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gymflow');
        console.log('✅ Conectado a MongoDB');

        // Definir esquema y modelo
        const adminSchema = new mongoose.Schema({
            email: { type: String, required: true, unique: true },
            password: { type: String, required: true },
            nombre: { type: String, required: true },
            role: { type: String, enum: ['superadmin', 'secretaria'], default: 'secretaria' },
            permisos: { type: [String], default: [] },
            isActive: { type: Boolean, default: true }
        }, { timestamps: true });

        const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

        // Usuarios iniciales
        const usuarios = [
            {
                email: 'superadmin@gymflow.com',
                password: 'admin123',
                nombre: 'Super Administrador',
                role: 'superadmin',
                permisos: [
                    'gestion_usuarios',
                    'gestion_asistencias',
                    'gestion_gastos',
                    'ver_reportes',
                    'gestion_planes',
                    'administrar_sistema'
                ]
            },
            {
                email: 'secretaria@gymflow.com',
                password: 'secre123',
                nombre: 'Secretaria Principal',
                role: 'secretaria',
                permisos: [
                    'gestion_asistencias',
                    'ver_usuarios'
                ]
            }
        ];

        for (const userData of usuarios) {
            // Verificar si ya existe
            const existe = await Admin.findOne({ email: userData.email });
            if (existe) {
                console.log(`⚠️  ${userData.email} ya existe`);
                continue;
            }

            // Encriptar contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(userData.password, salt);

            // Crear usuario
            const usuario = new Admin({
                ...userData,
                password: hashedPassword
            });

            await usuario.save();
            console.log(`✅ ${userData.role} creado: ${userData.email} / ${userData.password}`);
        }

        console.log('\n🎉 Usuarios iniciales creados exitosamente!');
        console.log('🔑 Credenciales:');
        console.log('   👑 Super Admin: superadmin@gymflow.com / admin123');
        console.log('   📝 Secretaria: secretaria@gymflow.com / secre123');

        // Cerrar conexión
        await mongoose.connection.close();
        console.log('✅ Conexión a MongoDB cerrada');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

crearUsuariosIniciales();