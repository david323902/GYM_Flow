const mongoose = require("mongoose");

async function verifyAdmin() {
    try {
        console.log("🔗 Conectando a MongoDB...");
        await mongoose.connect("mongodb://localhost:27017/gymflow");
        
        console.log("✅ Conectado. Buscando administrador...");
        
        // Usar el modelo existente
        const Admin = require("./server/models/Admin.model");
        
        const admin = await Admin.findOne({ email: "admin@gymflow.com" });
        
        if (admin) {
            console.log("\n🎉 ADMINISTRADOR ENCONTRADO:");
            console.log("===============================");
            console.log("📧 Email:", admin.email);
            console.log("👤 Nombre:", admin.nombre);
            console.log("👑 Rol:", admin.rol);
            console.log("✅ Activo:", admin.isActive);
            console.log("🔐 Password (primeros 30 chars):", admin.password.substring(0, 30) + "...");
            console.log("📅 Creado:", admin.createdAt);
            console.log("===============================\n");
            
            // Probar el método comparePassword
            console.log("🔍 Probando comparación de contraseñas...");
            const testPassword = "123456";
            const isValid = await admin.comparePassword(testPassword);
            console.log("🔑 ¿Contraseña '123456' es válida?:", isValid ? "✅ SÍ" : "❌ NO");
            
            // Probar contraseña incorrecta
            const isInvalid = await admin.comparePassword("wrongpassword");
            console.log("🔑 ¿Contraseña 'wrongpassword' es válida?:", isInvalid ? "✅ SÍ" : "❌ NO");
            
        } else {
            console.log("❌ NO se encontró el administrador");
        }
        
        mongoose.connection.close();
    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error("Stack:", error.stack);
    }
}

verifyAdmin();
