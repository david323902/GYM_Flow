const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './server/.env' });

async function resetAdmin() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gymflow';
    const client = new MongoClient(uri);
    
    try {
        console.log('🔌 Conectando a MongoDB (driver nativo)...');
        await client.connect();
        console.log('✅ Conectado a MongoDB');
        
        const db = client.db('gymflow');
        const adminsCollection = db.collection('admins');
        
        // Limpiar colección
        console.log('🗑️ Limpiando colección...');
        await adminsCollection.deleteMany({});
        console.log('✅ Colección limpiada');
        
        // Hashear contraseña
        console.log('🔐 Hasheando contraseña...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        // Insertar nuevo admin
        console.log('👤 Creando nuevo admin...');
        const result = await adminsCollection.insertOne({
            email: 'admin@gymflow.com',
            password: hashedPassword,
            nombre: 'Admin Principal',
            rol: 'superadmin',
            permisos: [],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        console.log('✅ Admin creado exitosamente');
        console.log('📧 Email: admin@gymflow.com');
        console.log('🔐 Password: admin123 (hasheada)');
        console.log('🆔 ID:', result.insertedId);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.close();
        console.log('✅ Conexión cerrada');
    }
}

resetAdmin();
