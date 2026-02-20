// server/controllers/transaccion.controller.js
const Transaccion = require('../models/Transaccion.model');
const Usuario = require('../models/Usuario.model');
const Plan = require('../models/plan.model');
const { enviarEmail } = require('../services/emailService');

// Registrar transacción
exports.registrarTransaccion = async (req, res) => {
  try {
    const transaccionData = req.body;

    // Sanitizar 'tipo' para que coincida con el enum del modelo (ej: 'Ingreso', 'Egreso')
    if (transaccionData.tipo) {
      transaccionData.tipo = transaccionData.tipo.charAt(0).toUpperCase() + transaccionData.tipo.slice(1).toLowerCase();
    }

    const transaccion = new Transaccion(transaccionData);
    await transaccion.save();
    
    // Si es un ingreso por mensualidad, renovar plan y enviar correo.
    // Usamos transaccion.cliente (ID del usuario) y transaccion.categoria
    if (transaccion.tipo === 'Ingreso' && transaccion.cliente && transaccion.categoria === 'mensualidad') {
      try {
        const usuario = await Usuario.findById(transaccion.cliente);
        if (usuario) {
          // Activar usuario
          usuario.estado = 'activo';
          
          // Lógica de renovación de fecha de vencimiento
          const plan = await Plan.findOne({ nombre: usuario.plan });
          const duracion = plan ? plan.duracionDias : 30; // Default 30 días si no se encuentra el plan

          const hoy = new Date();
          // Asegurarse de que la fecha de vencimiento no sea nula
          const fechaVencimientoActual = usuario.fechaVencimiento ? new Date(usuario.fechaVencimiento) : hoy;

          // Si el plan ya venció, renovar desde hoy. Si no, desde la fecha de vencimiento.
          const baseParaRenovar = fechaVencimientoActual > hoy ? fechaVencimientoActual : hoy;
          
          const nuevaFechaVencimiento = new Date(baseParaRenovar);
          nuevaFechaVencimiento.setDate(nuevaFechaVencimiento.getDate() + duracion);
          
          usuario.fechaVencimiento = nuevaFechaVencimiento;
          
          await usuario.save();

          // Enviar correo de confirmación de pago y renovación usando el servicio
          if (usuario.email) {
            // Se envía en segundo plano para no bloquear la respuesta al usuario
            enviarEmail(usuario.email, 'pagoRecibido', { usuario, transaccion })
              .catch(err => console.error('Error enviando email de pago (fire and forget):', err));
          }
        }
      } catch (err) {
        console.error('Error actualizando usuario tras transacción:', err);
        // No fallar la transacción si el email o la actualización del usuario falla, solo loguear.
      }
    }

    res.status(201).json({
      success: true,
      message: 'Transacción registrada exitosamente',
      transaccion
    });
  } catch (error) {
    console.error('Error al registrar transacción:', error);
    res.status(400).json({
      success: false,
      message: 'Error al registrar transacción',
      error: error.message
    });
  }
};

// Actualizar transacción
exports.actualizarTransaccion = async (req, res) => {
  try {
    const transaccion = await Transaccion.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!transaccion) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Transacción actualizada exitosamente',
      transaccion
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar transacción',
      error: error.message
    });
  }
};

// Obtener transacciones
exports.obtenerTransacciones = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, tipo, turno } = req.query;
    
    let filtro = {};
    
    // Filtrar por fecha
    if (fecha_inicio && fecha_fin) {
      filtro.fecha = {
        $gte: new Date(fecha_inicio + 'T00:00:00'),
        $lte: new Date(fecha_fin + 'T23:59:59')
      };
    }
    
    // Filtrar por tipo
    if (tipo) filtro.tipo = tipo;
    
    // Filtrar por turno
    if (turno) filtro.turno = turno;
    
    const transacciones = await Transaccion.find(filtro)
      .sort({ fecha: -1 });
    
    // Calcular total
    const total = transacciones.reduce((sum, t) => sum + t.monto, 0);
    
    res.json({
      success: true,
      cantidad: transacciones.length,
      total,
      transacciones
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener transacciones',
      error: error.message
    });
  }
};

// Obtener transacciones de HOY
exports.obtenerTransaccionesHoy = async (req, res) => {
  try {
    const hoy = new Date();
    const inicio = new Date(hoy.setHours(0, 0, 0, 0));
    const fin = new Date(hoy.setHours(23, 59, 59, 999));
    
    const transacciones = await Transaccion.find({
      fecha: { $gte: inicio, $lte: fin }
    }).sort({ fecha: -1 });
    
    const total = transacciones.reduce((sum, t) => sum + t.monto, 0);
    
    // Agrupar por tipo
    const porTipo = transacciones.reduce((acc, t) => {
      if (!acc[t.tipo]) {
        acc[t.tipo] = { cantidad: 0, total: 0 };
      }
      acc[t.tipo].cantidad++;
      acc[t.tipo].total += t.monto;
      return acc;
    }, {});
    
    res.json({
      success: true,
      fecha: inicio.toISOString().split('T')[0],
      cantidad: transacciones.length,
      total,
      por_tipo: porTipo,
      transacciones
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener transacciones de hoy',
      error: error.message
    });
  }
};

// CIERRE DE CAJA
exports.generarCierre = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, tipo_cierre } = req.body;
    
    // Si no hay fechas, usar hoy
    let inicio, fin;
    
    if (fecha_inicio && fecha_fin) {
      inicio = new Date(fecha_inicio + 'T00:00:00');
      fin = new Date(fecha_fin + 'T23:59:59');
    } else {
      // Cierre del día actual
      const hoy = new Date();
      inicio = new Date(hoy.setHours(0, 0, 0, 0));
      fin = new Date(hoy.setHours(23, 59, 59, 999));
    }
    
    // Obtener todas las transacciones del período
    const transacciones = await Transaccion.find({
      fecha: { $gte: inicio, $lte: fin }
    });
    
    // Calcular totales
    const totalGeneral = transacciones.reduce((sum, t) => sum + t.monto, 0);
    
    // Desglose por tipo
    const desglosePorTipo = transacciones.reduce((acc, t) => {
      if (!acc[t.tipo]) {
        acc[t.tipo] = { cantidad: 0, total: 0 };
      }
      acc[t.tipo].cantidad++;
      acc[t.tipo].total += t.monto;
      return acc;
    }, {});
    
    // Desglose por método de pago
    const desglosePorMetodo = transacciones.reduce((acc, t) => {
      if (!acc[t.metodo_pago]) {
        acc[t.metodo_pago] = 0;
      }
      acc[t.metodo_pago] += t.monto;
      return acc;
    }, {});
    
    // Desglose por turno
    const desglosePorTurno = transacciones.reduce((acc, t) => {
      if (!acc[t.turno]) {
        acc[t.turno] = { cantidad: 0, total: 0 };
      }
      acc[t.turno].cantidad++;
      acc[t.turno].total += t.monto;
      return acc;
    }, {});
    
    const cierre = {
      periodo: {
        tipo: tipo_cierre || 'diario',
        fecha_inicio: inicio.toISOString(),
        fecha_fin: fin.toISOString()
      },
      resumen: {
        total_transacciones: transacciones.length,
        total_ingresos: totalGeneral
      },
      desglose_por_tipo: desglosePorTipo,
      desglose_por_metodo_pago: desglosePorMetodo,
      desglose_por_turno: desglosePorTurno,
      transacciones: transacciones
    };
    
    res.json({
      success: true,
      cierre
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar cierre',
      error: error.message
    });
  }
};

// Eliminar transacción
exports.eliminarTransaccion = async (req, res) => {
  try {
    const transaccion = await Transaccion.findByIdAndDelete(req.params.id);
    
    if (!transaccion) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Transacción eliminada'
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar transacción',
      error: error.message
    });
  }
};