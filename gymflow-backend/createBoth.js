const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function createBothAdmins() {
    try {
        await mongoose.connect("mongodb://localhost:27017/gymflow");
        
        // Usar el modelo existente
        const Admin = require("./server/models/Admin.model");
        
        const admins = [
            {
                email: "admin@gymflow.com",
                password: "123456",
                nombre: "Admin GymFlow",
                rol: "superadmin"
            },
            {
                email: "admin@gmail.com", 
                password: "123456",
                nombre: "Admin Gmail",
                rol: "superadmin"
            },
            {
                email: "test@test.com",
                password: "123456", 
                nombre: "Usuario Test",
                rol: "secretaria"
            }
        ];
        
        for (let adminData of admins) {
            // Eliminar si existe
            await Admin.deleteOne({ email: adminData.email });
            
            // Hashear contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminData.password, salt);
            
            // Crear admin
            const admin = new Admin({
                ...adminData,
                password: hashedPassword,
                isActive: true
            });
            
            await admin.save();
            console.log("✅ Admin creado:", adminData.email);
        }
        
        console.log("\n🎉 TODOS LOS ADMINS CREADOS:");
        console.log("=============================");
        console.log("1. 📧 admin@gymflow.com / 123456");
        console.log("2. 📧 admin@gmail.com / 123456");
        console.log("3. 📧 test@test.com / 123456");
        console.log("=============================");
        
        mongoose.connection.close();
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

createBothAdmins();
