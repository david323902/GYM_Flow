// gymflow-backend/server/controllers/usuario.controller.js
const Usuario = require('../models/Usuario.model');
const Plan = require('../models/plan.model');
const Asistencia = require('../models/Asistencia.model');
const mongoose = require('mongoose');
const { enviarEmail } = require('../services/emailService');

// Función helper para formatear datos del usuario según tipo de plan
const formatearUsuario = (usuario) => {
  // Convertir a objeto plano si es necesario
  const usuarioObj = usuario.toObject ? usuario.toObject() : usuario;

  // Base de datos siempre incluida
  const baseData = {
    _id: usuarioObj._id,
    nombre: usuarioObj.nombre || '',
    documento: usuarioObj.documento || '',
    email: usuarioObj.email || null,
    telefono: usuarioObj.telefono || null,
    direccion: usuarioObj.direccion || null,
    genero: usuarioObj.genero || 'Otro',
    plan: usuarioObj.plan || null,
    tipoPlan: usuarioObj.tipoPlan || 'mensualidad',
    estado: usuarioObj.estado || 'activo',
    fechaVencimiento: usuarioObj.fechaVencimiento || null,
    observaciones: usuarioObj.observaciones || null,
    foto: usuarioObj.foto || null,
    createdAt: usuarioObj.createdAt || null,
    updatedAt: usuarioObj.updatedAt || null,
  };

  // Si es mensualidad: también mostrar fecha de inicio
  if (baseData.tipoPlan === 'mensualidad') {
    return {
      ...baseData,
      fechaInicio: usuarioObj.fechaInicio || null
    };
  }

  // Si es tiquetera: también mostrar entradas
  if (baseData.tipoPlan === 'tiquetera') {
    return {
      ...baseData,
      entradas: usuarioObj.entradas || 0,
      entradasRestantes: usuarioObj.entradasRestantes || 0
    };
  }

  // Por defecto (si no tiene tipoPlan definido), incluir todo
  return {
    ...baseData,
    fechaInicio: usuarioObj.fechaInicio || null,
    entradas: usuarioObj.entradas || 0,
    entradasRestantes: usuarioObj.entradasRestantes || 0
  };
};

// Crear nuevo usuario
const crearUsuario = async (req, res) => {
  try {
    console.log('📝 Datos recibidos para crear usuario:', req.body);

    const {
      nombre,
      documento,
      email,
      telefono,
      direccion,
      genero,
      plan, // Nombre del plan (texto)
      planId, // ID del plan (si viene del frontend)
      tipoPlan,
      fechaInicio,
      fechaVencimiento,
      fechaFin, // Alias para fechaVencimiento (viene del frontend)
      entradas,
      entradasRestantes,
      entradasDisponibles, // Alias para entradasRestantes (viene del frontend)
      estado,
      observaciones,
      foto
    } = req.body;

    // Validaciones básicas
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es requerido'
      });
    }

    if (!documento || !documento.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El documento es requerido'
      });
    }

    // Si viene planId, obtener el plan desde la base de datos
    let nombrePlan = plan;
    let tipoPlanDelPlan = tipoPlan;
    
    if (planId && !plan) {
      const planEncontrado = await Plan.findById(planId);
      if (!planEncontrado) {
        return res.status(400).json({
          success: false,
          message: 'El plan seleccionado no existe'
        });
      }
      nombrePlan = planEncontrado.nombre;
      // Determinar tipoPlan basado en el tipo del plan
      if (planEncontrado.tipo === 'tiquetera') {
        tipoPlanDelPlan = 'tiquetera';
      } else {
        tipoPlanDelPlan = 'mensualidad';
      }
    }

    if (!nombrePlan) {
      return res.status(400).json({
        success: false,
        message: 'El plan es requerido'
      });
    }

    // Mapear fechaFin a fechaVencimiento si viene
    const fechaVencimientoFinal = fechaVencimiento || fechaFin;
    if (!fechaVencimientoFinal) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de vencimiento es requerida'
      });
    }

    // Verificar si ya existe el documento
    const usuarioExistente = await Usuario.findOne({ documento: documento.trim() });
    if (usuarioExistente) {
      if (usuarioExistente.deleted) {
        // Si el usuario está en la papelera, lo eliminamos físicamente para permitir el nuevo registro
        await Usuario.findByIdAndDelete(usuarioExistente._id);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un usuario con ese documento'
        });
      }
    }

    // Verificar si ya existe el email (si fue proporcionado)
    if (email && email.trim()) {
      const emailExistente = await Usuario.findOne({ email: email.trim() });
      if (emailExistente) {
        if (emailExistente.deleted) {
          // Si es un usuario eliminado (y diferente al del documento, si aplicara), lo borramos
          await Usuario.findByIdAndDelete(emailExistente._id);
        } else {
          return res.status(400).json({
            success: false,
            message: 'Ya existe un usuario con ese correo electrónico'
          });
        }
      }
    }

    // Determinar el tipo de plan si no viene
    const tipoPlanFinal = tipoPlanDelPlan || tipoPlan || 'mensualidad';

    // Preparar datos del usuario
    const datosUsuario = {
      nombre: nombre.trim(),
      documento: documento.trim(),
      email: email?.trim() || undefined,
      telefono: telefono?.trim() || undefined,
      direccion: direccion?.trim() || undefined,
      genero: genero || 'Otro',
      // Mapeo a campos del modelo (camelCase, como en Usuario.model.js)
      plan: nombrePlan,
      tipoPlan: tipoPlanFinal,
      fechaInicio: fechaInicio ? new Date(fechaInicio) : new Date(),
      fechaVencimiento: new Date(fechaVencimientoFinal),
      estado: estado || 'activo',
      observaciones: observaciones?.trim() || undefined,
      foto: foto || null
    };

    // Si es tiquetera, agregar entradas
    if (tipoPlanFinal === 'tiquetera') {
      // Mapear entradasDisponibles a entradasRestantes si viene
      const entradasRestantesFinal = entradasRestantes !== undefined 
        ? entradasRestantes 
        : (entradasDisponibles !== undefined ? entradasDisponibles : (entradas || 10));
      
      datosUsuario.entradas = entradas || entradasRestantesFinal || 10;
      datosUsuario.entradasRestantes = entradasRestantesFinal;
    } else {
      datosUsuario.entradas = 0;
      datosUsuario.entradasRestantes = 0;
    }

    console.log('💾 Creando usuario con datos:', datosUsuario);

    const nuevoUsuario = new Usuario(datosUsuario);
    await nuevoUsuario.save();

    console.log('✅ Usuario creado exitosamente:', nuevoUsuario._id);

    // Enviar correo de bienvenida usando el servicio
    if (nuevoUsuario.email) {
      // Se envía en segundo plano para no bloquear la respuesta al usuario
      enviarEmail(nuevoUsuario.email, 'bienvenida', nuevoUsuario)
        .catch(err => console.error('Error enviando email de bienvenida (fire and forget):', err));
    }

    // Formatear usuario según tipo de plan
    const usuarioFormateado = formatearUsuario(nuevoUsuario);
    
    return res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: usuarioFormateado
    });

  } catch (error) {
    console.error('❌ Error creando usuario:', error);
    
    // Error de validación de Mongoose
    if (error.name === 'ValidationError') {
      const errors = {};
      for (const field in error.errors) {
        errors[field] = error.errors[field].message;
      }
      return res.status(400).json({
        success: false,
        message: 'Error de validación de datos',
        // Devolvemos un objeto con los errores por campo
        errors: errors
      });
    }

    // Error de duplicado (documento único)
    if (error.code === 11000) {
      // Identificar qué campo causó la duplicidad
      const campo = Object.keys(error.keyPattern)[0];
      const mensaje = campo === 'email' 
        ? 'Ya existe un usuario con ese correo electrónico' 
        : 'Ya existe un usuario con ese documento';

      return res.status(400).json({
        success: false,
        message: mensaje
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error al crear usuario',
      error: error.message
    });
  }
};

// Obtener todos los usuarios
const obtenerUsuarios = async (req, res) => {
  try {
    console.log('📥 GET /api/usuarios - Iniciando consulta con query:', req.query);
    
    // Verificar conexión a MongoDB
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ MongoDB no está conectado');
      return res.status(500).json({
        success: false,
        message: 'Base de datos no conectada'
      });
    }

    // Construir un array de condiciones para el $and, que nos permite combinar filtros
    const andConditions = [{ deleted: { $ne: true } }];
    
    const { buscar, inactivos } = req.query;

    // 1. Filtro de búsqueda por nombre, documento o email
    if (buscar) {
      const regex = new RegExp(buscar.trim(), 'i'); // 'i' para case-insensitive
      andConditions.push({
        $or: [
          { nombre: regex },
          { documento: regex },
          { email: regex }
        ]
      });
    }
    
    // 2. Filtro de inactivos (30+ días) - se mantiene la lógica original
    if (inactivos === 'true') {
      const treintaDiasAtras = new Date();
      treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);
      
      andConditions.push({
        estado: 'activo',
        $or: [
          { ultima_asistencia: { $lt: treintaDiasAtras } },
          { ultima_asistencia: { $exists: false }, createdAt: { $lt: treintaDiasAtras } }
        ]
      });
    }

    // Construir la query final a partir de las condiciones
    const query = andConditions.length > 1 ? { $and: andConditions } : andConditions[0];

    console.log('🔎 Query final para MongoDB:', JSON.stringify(query, null, 2));

    const usuarios = await Usuario.find(query)
      .sort({ createdAt: -1 })
      .select('-__v') // Excluir campo __v
      .exec();

    console.log(`✅ Usuarios encontrados: ${usuarios.length}`);

    // Formatear usuarios según tipo de plan
    const usuariosFormateados = usuarios.map(usuario => {
      return formatearUsuario(usuario);
    });

    return res.json({
      success: true,
      count: usuariosFormateados.length,
      data: usuariosFormateados
    });
  } catch (error) {
    console.error('❌ Error obteniendo usuarios:', error);
    console.error('Stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener usuarios',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener un usuario por ID
const obtenerUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    const usuario = await Usuario.findById(id);
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Formatear usuario según tipo de plan
    const usuarioFormateado = formatearUsuario(usuario);

    return res.json({
      success: true,
      data: usuarioFormateado
    });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: error.message
    });
  }
};

// Actualizar usuario
const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizacion = req.body;

    console.log('📝 Actualizando usuario:', id);
    console.log('Datos:', datosActualizacion);

    const usuario = await Usuario.findByIdAndUpdate(
      id,
      datosActualizacion,
      { new: true, runValidators: true }
    );

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    console.log('✅ Usuario actualizado');

    // Formatear usuario según tipo de plan
    const usuarioFormateado = formatearUsuario(usuario);

    return res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: usuarioFormateado
    });
  } catch (error) {
    console.error('❌ Error actualizando usuario:', error);
    
    if (error.name === 'ValidationError') {
      const errors = {};
      for (const field in error.errors) {
        errors[field] = error.errors[field].message;
      }
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        // Devolvemos un objeto con los errores por campo
        errors: errors
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
      error: error.message
    });
  }
};

// Eliminar usuario
const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft Delete: Marcar como eliminado en lugar de borrar físicamente
    const usuario = await Usuario.findByIdAndUpdate(id, {
      deleted: true,
      deletedAt: new Date()
    }, { new: true });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    console.log('🗑️ Usuario enviado a la papelera:', id);

    return res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
      error: error.message
    });
  }
};

// Eliminar usuarios inactivos masivamente (más de 1 año sin asistir y no activos)
const eliminarInactivos = async (req, res) => {
  try {
    console.log('🧹 Ejecutando limpieza de usuarios inactivos...');

    // 1. Calcular fecha de corte (Hace 1 año)
    const unAnioAtras = new Date();
    unAnioAtras.setFullYear(unAnioAtras.getFullYear() - 1);

    // 2. Construir Query
    // - Estado NO es 'activo' (para seguridad)
    // - Y (última asistencia antigua O (nunca asistió Y creado hace mucho))
    const query = {
      estado: { $ne: 'activo' },
      $or: [
        { ultima_asistencia: { $lt: unAnioAtras } },
        { ultima_asistencia: { $exists: false }, createdAt: { $lt: unAnioAtras } }
      ]
    };

    // 3. Ejecutar eliminación
    const resultado = await Usuario.deleteMany(query);

    console.log(`✅ Se eliminaron ${resultado.deletedCount} usuarios inactivos.`);

    return res.json({
      success: true,
      message: `Limpieza completada. Se eliminaron ${resultado.deletedCount} usuarios inactivos.`,
      count: resultado.deletedCount
    });
  } catch (error) {
    console.error('❌ Error eliminando inactivos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar usuarios inactivos',
      error: error.message
    });
  }
};

// Obtener usuarios en papelera
const obtenerEliminados = async (req, res) => {
  try {
    const usuarios = await Usuario.find({ deleted: true })
      .sort({ deletedAt: -1 })
      .select('-__v')
      .exec();

    const usuariosFormateados = usuarios.map(usuario => formatearUsuario(usuario));

    return res.json({
      success: true,
      count: usuariosFormateados.length,
      data: usuariosFormateados
    });
  } catch (error) {
    console.error('Error obteniendo papelera:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener papelera' });
  }
};

// Restaurar usuario eliminado
const restaurarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByIdAndUpdate(id, {
      deleted: false,
      $unset: { deletedAt: 1 }
    }, { new: true });

    if (!usuario) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    return res.json({ success: true, message: 'Usuario restaurado exitosamente' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al restaurar usuario' });
  }
};

// Eliminar usuario permanentemente
const eliminarPermanente = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByIdAndDelete(id);
    
    if (!usuario) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    return res.json({ success: true, message: 'Usuario eliminado permanentemente' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al eliminar permanentemente' });
  }
};

// Vaciar papelera manualmente (eliminar usuarios con deleted=true y antigüedad > X días)
const vaciarPapelera = async (req, res) => {
  try {
    // Por defecto 30 días, o lo que se envíe en query param ?dias=60
    const dias = parseInt(req.query.dias) || 30; 
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - dias);

    const resultado = await Usuario.deleteMany({
      deleted: true,
      deletedAt: { $lt: fechaLimite }
    });

    return res.json({
      success: true,
      message: `Papelera vaciada. Se eliminaron ${resultado.deletedCount} usuarios con más de ${dias} días en papelera.`,
      count: resultado.deletedCount
    });
  } catch (error) {
    console.error('Error vaciando papelera:', error);
    return res.status(500).json({ success: false, message: 'Error al vaciar papelera' });
  }
};

// Obtener expediente completo del usuario (datos + historial asistencias)
const obtenerExpediente = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📂 Solicitando expediente para ID: ${id}`);

    const usuario = await Usuario.findById(id);
    
    if (!usuario) {
      console.log('❌ Usuario no encontrado para expediente');
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Obtener historial de asistencias
    const asistencias = await Asistencia.find({ usuario: id })
      .sort({ fecha: -1 })
      .limit(50); // Últimas 50 asistencias para no sobrecargar

    const totalAsistencias = await Asistencia.countDocuments({ usuario: id });

    const expediente = {
      usuario: {
        ...formatearUsuario(usuario),
        historialCambios: usuario.historial_cambios || []
      },
      historialAsistencias: asistencias,
      estadisticas: {
        totalAsistencias,
        ultimaAsistencia: asistencias.length > 0 ? asistencias[0].fecha : null,
        promedioSemanal: 0 // Aquí podrías agregar lógica más compleja si lo deseas
      }
    };

    return res.json({
      success: true,
      data: expediente
    });
  } catch (error) {
    console.error('Error obteniendo expediente:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener expediente' });
  }
};

module.exports = {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  eliminarUsuario,
  eliminarInactivos,
  obtenerEliminados,
  restaurarUsuario,
  eliminarPermanente,
  vaciarPapelera,
  obtenerExpediente
};