// server/controllers/auth.controller.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin.model');

const authController = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log('🔐 [LOGIN] Intento:', { email });

      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          mensaje: 'Email y contraseña son requeridos' 
        });
      }

      // Buscar admin
      const admin = await Admin.findOne({ email });
      
      if (!admin) {
        console.log('❌ [LOGIN] Admin no encontrado:', email);
        return res.status(401).json({ 
          success: false, 
          mensaje: 'Credenciales inválidas' 
        });
      }

      // Verificar contraseña
      const isValid = await bcrypt.compare(password, admin.password);
      if (!isValid) {
        console.log('❌ [LOGIN] Contraseña incorrecta');
        return res.status(401).json({ 
          success: false, 
          mensaje: 'Credenciales inválidas' 
        });
      }

      // Generar token
      const token = jwt.sign(
        { 
          id: admin._id, 
          email: admin.email,
          nombre: admin.nombre,
          rol: admin.rol 
        },
        process.env.JWT_SECRET || 'gymflow_secret_key_2024',
        { expiresIn: '24h' }
      );

      console.log('✅ [LOGIN] Exitoso:', admin.email);
      
      return res.json({
        success: true,
        mensaje: 'Login exitoso',
        token,
        usuario: {
          id: admin._id,
          email: admin.email,
          nombre: admin.nombre,
          rol: admin.rol
        }
      });
    } catch (error) {
      console.error('💥 [LOGIN] Error:', error);
      return res.status(500).json({ 
        success: false, 
        mensaje: 'Error en el servidor' 
      });
    }
  }
};

module.exports = authController;