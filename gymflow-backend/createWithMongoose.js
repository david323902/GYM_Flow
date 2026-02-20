const mongoose = require("mongoose");
const Admin = require("./server/models/Admin.model");

async function createAdminWithMongoose() {
    try {
        console.log("🔗 Conectando a MongoDB con Mongoose...");
        await mongoose.connect("mongodb://localhost:27017/gymflow");
        
        // 1. Eliminar el admin existente
        await Admin.deleteOne({ email: "admin@gymflow.com" });
        console.log("🗑️  Admin anterior eliminado");
        
        // 2. Crear NUEVO admin usando el modelo Mongoose
        // IMPORTANTE: Pasar la contraseña EN TEXTO PLANO
        // El pre-save hook la hasheará automáticamente
        const admin = new Admin({
            email: "admin@gymflow.com",
            password: "123456",  // ← TEXTO PLANO, será hasheado por el hook
            nombre: "Administrador Principal",
            rol: "superadmin",
            isActive: true
        });
        
        await admin.save();
        console.log("\n🎉 ADMIN CREADO CON MONGOOSE!");
        console.log("===============================");
        console.log("📧 Email:", admin.email);
        console.log("🔑 Password (texto original): 123456");
        console.log("🔐 Password (hasheada):", admin.password.substring(0, 30) + "...");
        console.log("===============================\n");
        
        // 3. Verificar que comparePassword funciona
        console.log("🔍 Probando comparePassword...");
        const isValid = await admin.comparePassword("123456");
        console.log("¿Contraseña '123456' es válida?:", isValid ? "✅ SÍ" : "❌ NO");
        
        const isInvalid = await admin.comparePassword("wrong");
        console.log("¿Contraseña 'wrong' es válida?:", isInvalid ? "✅ SÍ" : "❌ NO");
        
        mongoose.connection.close();
        
    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error("Stack:", error.stack);
    }
}

// Detener cualquier conexión previa
mongoose.connection.close();

createAdminWithMongoose();
