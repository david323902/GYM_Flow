const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin.js');

// Ruta de login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar datos
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email y contraseña son requeridos' 
            });
        }

        // Buscar admin
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({ 
                success: false, 
                message: 'Credenciales incorrectas' 
            });
        }

        // Verificar contraseña
        const passwordValido = await bcrypt.compare(password, admin.password);
        if (!passwordValido) {
            return res.status(401).json({ 
                success: false, 
                message: 'Credenciales incorrectas' 
            });
        }

        // Crear token JWT
        const token = jwt.sign(
            { 
                id: admin._id, 
                email: admin.email,
                nombre: admin.nombre,
                role: admin.role 
            },
            process.env.JWT_SECRET || 'gymflow_secret_key',
            { expiresIn: '24h' }
        );

        // Responder sin la contraseña
        const usuarioResponse = {
            id: admin._id,
            email: admin.email,
            nombre: admin.nombre,
            role: admin.role,
            createdAt: admin.createdAt
        };

        res.json({
            success: true,
            message: 'Login exitoso',
            usuario: usuarioResponse,
            token
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

// Ruta de registro
router.post('/registrar', async (req, res) => {
    try {
        const { email, password, nombre } = req.body;

        // Validar datos
        if (!email || !password || !nombre) {
            return res.status(400).json({ 
                success: false, 
                message: 'Todos los campos son requeridos' 
            });
        }

        // Verificar si el admin ya existe
        const adminExistente = await Admin.findOne({ email });
        if (adminExistente) {
            return res.status(400).json({ 
                success: false, 
                message: 'El administrador ya existe' 
            });
        }

        // Hash de la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Crear nuevo admin
        const nuevoAdmin = new Admin({
            email,
            password: hashedPassword,
            nombre,
            role: 'admin'
        });

        await nuevoAdmin.save();

        // Crear token JWT
        const token = jwt.sign(
            { 
                id: nuevoAdmin._id, 
                email: nuevoAdmin.email,
                nombre: nuevoAdmin.nombre,
                role: nuevoAdmin.role 
            },
            process.env.JWT_SECRET || 'gymflow_secret_key',
            { expiresIn: '24h' }
        );

        // Responder sin la contraseña
        const usuarioResponse = {
            id: nuevoAdmin._id,
            email: nuevoAdmin.email,
            nombre: nuevoAdmin.nombre,
            role: nuevoAdmin.role,
            createdAt: nuevoAdmin.createdAt
        };

        res.status(201).json({
            success: true,
            message: 'Administrador registrado exitosamente',
            usuario: usuarioResponse,
            token
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

// Verificar token
router.get('/verificar', async (req, res) => {
    console.log('🔍 Verificando token...');
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Token no proporcionado' 
            });
        }

        // Verificar token
        const decoded = jwt.verify(
            token, 
            process.env.JWT_SECRET || 'gymflow_secret_key'
        );

        // Buscar admin en la base de datos
        const admin = await Admin.findById(decoded.id);
        if (!admin) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuario no encontrado' 
            });
        }

        const adminResponse = {
            id: admin._id,
            email: admin.email,
            nombre: admin.nombre,
            role: admin.role,
            createdAt: admin.createdAt
        };

        res.json({
            success: true,
            usuario: adminResponse
        });

    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token inválido o expirado' 
        });
    }
});

module.exports = router;