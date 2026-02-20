const Admin = require('../models/Admin.js');

// @desc    Iniciar sesión
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar campos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        msg: 'Por favor ingrese email y contraseña'
      });
    }

    // Buscar admin por email (incluyendo password)
    const admin = await Admin.findOne({ email }).select('+password');
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        msg: 'Credenciales inválidas'
      });
    }

    // Verificar si está activo
    if (!admin.activo) {
      return res.status(401).json({
        success: false,
        msg: 'Cuenta desactivada. Contacte al administrador.'
      });
    }

    // Verificar contraseña
    const esPasswordCorrecto = await admin.compararPassword(password);
    
    if (!esPasswordCorrecto) {
      return res.status(401).json({
        success: false,
        msg: 'Credenciales inválidas'
      });
    }

    // Actualizar último acceso
    admin.ultimoAcceso = new Date();
    await admin.save();

    // Generar token
    const token = admin.generarJWT();

    // Preparar respuesta sin password
    const adminData = {
      id: admin._id,
      nombre: admin.nombre,
      email: admin.email,
      rol: admin.rol,
      sede: admin.sede,
      ultimoAcceso: admin.ultimoAcceso
    };

    res.json({
      success: true,
      msg: 'Inicio de sesión exitoso',
      token,
      admin: adminData
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      msg: 'Error en el servidor'
    });
  }
};

// @desc    Obtener perfil del admin actual
// @route   GET /api/auth/perfil
// @access  Private
exports.getPerfil = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password');
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        msg: 'Admin no encontrado'
      });
    }

    res.json({
      success: true,
      data: admin
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      msg: 'Error en el servidor'
    });
  }
};

// @desc    Registrar nuevo admin (solo superadmin)
// @route   POST /api/auth/registrar
// @access  Private/Superadmin
exports.registrarAdmin = async (req, res) => {
  try {
    const { nombre, email, password, rol, sede } = req.body;

    // Verificar si ya existe
    const adminExistente = await Admin.findOne({ email });
    if (adminExistente) {
      return res.status(400).json({
        success: false,
        msg: 'Ya existe un administrador con este email'
      });
    }

    // Crear nuevo admin
    const nuevoAdmin = new Admin({
      nombre,
      email,
      password,
      rol: rol || 'recepcionista',
      sede: sede || 'Sede Principal'
    });

    await nuevoAdmin.save();

    // Preparar respuesta sin password
    const adminData = {
      id: nuevoAdmin._id,
      nombre: nuevoAdmin.nombre,
      email: nuevoAdmin.email,
      rol: nuevoAdmin.rol,
      sede: nuevoAdmin.sede,
      fechaCreacion: nuevoAdmin.fechaCreacion
    };

    res.status(201).json({
      success: true,
      msg: 'Administrador registrado exitosamente',
      data: adminData
    });

  } catch (error) {
    console.error('Error registrando admin:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        msg: 'Error de validación',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      msg: 'Error en el servidor'
    });
  }
};