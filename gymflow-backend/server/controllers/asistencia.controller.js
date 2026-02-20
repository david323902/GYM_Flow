﻿﻿﻿const Asistencia = require('../models/Asistencia.model');
const Usuario = require('../models/Usuario.model');

exports.registrarAsistencia = async (req, res) => {
  try {
    const { documento } = req.body;
    
    if (!documento) {
      return res.status(400).json({ success: false, message: 'El documento es requerido' });
    }

    // Intentar vincular con un usuario existente
    const usuario = await Usuario.findOne({ documento: documento });

    let mensaje = 'Asistencia registrada (Usuario no encontrado)';
    let estadoCliente = 'desconocido'; // Para que el frontend sepa cómo actuar: 'activo', 'proximo_vencer', 'vencido', 'pocas_entradas', 'sin_entradas'
    let detalles = {};

    if (usuario) {
      // Actualizar siempre la última asistencia
      // usuario.ultimaAsistencia = new Date(); // Nota: este campo no está en el esquema de Usuario.model.js

      // Lógica para planes por tiempo (mensualidad, quincena, etc.)
      if (usuario.tipoPlan === 'mensualidad' || !usuario.tipoPlan) { // Asumir mensualidad si no está definido
        if (usuario.fechaVencimiento) {
          const hoy = new Date();
          hoy.setHours(0, 0, 0, 0);
          const vencimiento = new Date(usuario.fechaVencimiento);
          const diffTime = vencimiento.getTime() - hoy.getTime();
          const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          detalles.diasRestantes = diasRestantes;

          if (diasRestantes < 0) {
            estadoCliente = 'vencido';
            mensaje = `⚠️ PLAN VENCIDO hace ${Math.abs(diasRestantes)} días.`;
            usuario.estado = 'inactivo';
          } else if (diasRestantes <= 5) { // Alerta si quedan 5 días o menos
            estadoCliente = 'proximo_vencer';
            mensaje = `⚠️ ¡PLAN PRÓXIMO A VENCER! Quedan ${diasRestantes} días.`;
          } else {
            estadoCliente = 'activo';
            mensaje = `✅ Plan activo. Quedan ${diasRestantes} días.`;
          }
        } else {
          estadoCliente = 'error';
          mensaje = 'Usuario sin fecha de vencimiento configurada.';
        }
      }
      // Lógica para tiqueteras
      else if (usuario.tipoPlan === 'tiquetera') {
        if (usuario.entradasRestantes > 0) {
          usuario.entradasRestantes -= 1;
          detalles.entradasRestantes = usuario.entradasRestantes;

          if (usuario.entradasRestantes === 0) {
            estadoCliente = 'sin_entradas';
            mensaje = '✅ ¡ÚLTIMA ENTRADA USADA! Renueva tu tiquetera.';
            usuario.estado = 'inactivo';
          } else if (usuario.entradasRestantes <= 3) { // Alerta si quedan 3 entradas o menos
            estadoCliente = 'pocas_entradas';
            mensaje = `⚠️ ¡QUEDAN POCAS ENTRADAS! Restantes: ${usuario.entradasRestantes}.`;
          } else {
            estadoCliente = 'activo';
            mensaje = `✅ Entrada registrada. Restantes: ${usuario.entradasRestantes}.`;
          }
        } else {
          estadoCliente = 'sin_entradas';
          mensaje = '⚠️ ¡SIN ENTRADAS DISPONIBLES! Renueva tu tiquetera.';
          usuario.estado = 'inactivo';
          detalles.entradasRestantes = 0;
        }
      }
      await usuario.save();
    }

    const nuevaAsistencia = new Asistencia({
      documento,
      usuario: usuario ? usuario._id : null,
      fecha: new Date(),
    });

    await nuevaAsistencia.save();

    if (usuario) {
      await nuevaAsistencia.populate('usuario', 'nombre documento plan tipoPlan fechaVencimiento estado entradasRestantes foto');
    }

    res.status(201).json({
      success: true,
      message: mensaje,
      estadoCliente,
      detalles,
      data: nuevaAsistencia
    });
  } catch (error) {
    console.error('Error registrando asistencia:', error);
    res.status(500).json({ success: false, message: 'Error del servidor', error: error.message });
  }
};

exports.obtenerAsistencias = async (req, res) => {
  try {
    // Obtener asistencias de hoy (00:00 a 23:59)
    const hoy = new Date();
    const inicio = new Date(hoy.setHours(0, 0, 0, 0));
    const fin = new Date(hoy.setHours(23, 59, 59, 999));

    const asistencias = await Asistencia.find({
      fecha: { $gte: inicio, $lte: fin }
    }).populate('usuario', 'nombre documento email telefono direccion genero plan tipoPlan fechaInicio fechaVencimiento estado foto entradas entradasRestantes').sort({ fecha: -1 });

    res.json({ success: true, data: asistencias });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error obteniendo asistencias' });
  }
};