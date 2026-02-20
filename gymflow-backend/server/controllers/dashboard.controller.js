const Asistencia = require('../models/Asistencia.model');
const Transaccion = require('../models/Transaccion.model');
const Usuario = require('../models/Usuario.model');
const Plan = require('../models/plan.model');
const mongoose = require('mongoose');

// @desc    Obtener resumen general para el dashboard (Asistencias + Finanzas)
// @route   GET /api/dashboard/resumen
// @access  Private
exports.obtenerResumenDashboard = async (req, res) => {
  try {
    const hoy = new Date();
    const inicioHoy = new Date(new Date().setHours(0, 0, 0, 0));
    const finHoy = new Date(new Date().setHours(23, 59, 59, 999));

    // 1. Total de asistencias de hoy
    const totalHoy = await Asistencia.countDocuments({
      fecha: { $gte: inicioHoy, $lte: finHoy }
    });

    // 2. Asistencias por hora (hoy)
    const asistenciasPorHoraRaw = await Asistencia.aggregate([
      { $match: { fecha: { $gte: inicioHoy, $lte: finHoy } } },
      {
        $project: {
          // Usar una timezone es crucial para la consistencia. Ajusta si es necesario.
          hora: { $hour: { date: "$fecha", timezone: "America/Bogota" } } 
        }
      },
      {
        $group: {
          _id: "$hora",
          cantidad: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Formatear para que siempre haya 24 horas (de 0 a 23)
    const asistenciasPorHora = Array(24).fill(0);
    asistenciasPorHoraRaw.forEach(item => {
      if (item._id >= 0 && item._id < 24) {
        asistenciasPorHora[item._id] = item.cantidad;
      }
    });

    // 3. Clientes más frecuentes (últimos 30 días)
    const treintaDiasAtras = new Date();
    treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);

    const clientesFrecuentes = await Asistencia.aggregate([
      {
        $match: {
          fecha: { $gte: treintaDiasAtras },
          usuario: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: "$usuario",
          totalAsistencias: { $sum: 1 }
        }
      },
      { $sort: { totalAsistencias: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'usuarios', // nombre de la colección en MongoDB
          localField: '_id',
          foreignField: '_id',
          as: 'infoUsuario'
        }
      },
      {
        $unwind: "$infoUsuario" // Descomponer el array resultante del lookup
      },
      {
        $project: {
          _id: 0,
          usuarioId: "$_id",
          nombre: "$infoUsuario.nombre",
          plan: "$infoUsuario.plan_nombre",
          totalAsistencias: 1
        }
      }
    ]);

    // 4. Ingresos del día (Hoy)
    const ingresosHoyData = await Transaccion.aggregate([
      { 
        $match: { 
          fecha: { $gte: inicioHoy, $lte: finHoy },
          tipo: { $regex: /^ingreso$/i } // Case insensitive para asegurar compatibilidad
        } 
      },
      { $group: { _id: null, total: { $sum: "$monto" } } }
    ]);
    const ingresosHoy = ingresosHoyData[0] ? ingresosHoyData[0].total : 0;

    // 5. Ingresos del mes actual
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59, 999);

    const ingresosMesData = await Transaccion.aggregate([
      { 
        $match: { 
          fecha: { $gte: inicioMes, $lte: finMes },
          tipo: { $regex: /^ingreso$/i }
        } 
      },
      { $group: { _id: null, total: { $sum: "$monto" } } }
    ]);
    const ingresosMes = ingresosMesData[0] ? ingresosMesData[0].total : 0;

    // 6. Estadísticas de Usuarios y Planes
    const totalUsuariosActivos = await Usuario.countDocuments({ estado: 'activo', deleted: { $ne: true } });
    const nuevosUsuariosMes = await Usuario.countDocuments({
      createdAt: { $gte: inicioMes, $lte: finMes },
      deleted: { $ne: true }
    });
    const totalPlanesActivos = await Plan.countDocuments({ activo: true });

    // 7. Distribución de usuarios por plan
    const distribucionPlanes = await Usuario.aggregate([
      { $match: { estado: 'activo', plan: { $ne: null, $ne: '' }, deleted: { $ne: true } } },
      { 
        $group: { 
          _id: "$plan",
          cantidad: { $sum: 1 }
        } 
      },
      {
        $project: {
          _id: 0,
          nombre: "$_id",
          cantidad: 1
        }
      },
      { $sort: { cantidad: -1 } }
    ]);

    // 8. Lista completa de planes (para visualización y gestión en dashboard)
    const listaPlanes = await Plan.find({}).sort({ precio: 1 });
    console.log(`[Dashboard] Enviando ${listaPlanes.length} planes en el resumen.`);

    res.json({
      success: true,
      data: {
        asistencias: {
          totalHoy,
          porHora: asistenciasPorHora,
          clientesFrecuentes
        },
        finanzas: {
          ingresosHoy,
          ingresosMes
        },
        usuarios: {
          activos: totalUsuariosActivos,
          nuevosEsteMes: nuevosUsuariosMes
        },
        planes: {
          totalActivos: totalPlanesActivos,
          distribucion: distribucionPlanes,
          lista: listaPlanes
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de asistencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};