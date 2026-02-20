const Plan = require('../models/plan.model');
const Usuario = require('../models/Usuario.model');

// Obtener todos los planes
exports.obtenerPlanes = async (req, res) => {
  try {
    // Si se envía ?todos=true, muestra también los inactivos (útil para gestión/admin)
    const filtro = req.query.todos === 'true' ? {} : { activo: true };
    // Usamos .lean() para obtener objetos JS simples y poder agregarles propiedades
    const planes = await Plan.find(filtro).sort({ precio: 1 }).lean();
    
    // Contar usuarios activos por plan
    const conteoUsuarios = await Usuario.aggregate([
      // Usar regex para detectar 'activo', 'Activo', 'ACTIVO', etc.
      { $match: { estado: { $regex: /^activo$/i }, deleted: { $ne: true } } },
      { 
        $group: { 
          _id: { id: "$plan_id", nombre: "$plan_nombre" }, 
          count: { $sum: 1 } 
        } 
      }
    ]);

    // Combinar la información
    const planesConUsuarios = planes.map(plan => {
      // Sumar usuarios que coincidan por ID o por Nombre (para usuarios antiguos/migrados)
      const totalUsuarios = conteoUsuarios.reduce((acc, curr) => {
        const matchId = curr._id.id && plan._id && curr._id.id.toString() === plan._id.toString();
        // Comparación robusta: ignorar mayúsculas/minúsculas y espacios
        const matchNombre = curr._id.nombre && plan.nombre && 
                           curr._id.nombre.trim().toLowerCase() === plan.nombre.trim().toLowerCase();
        return (matchId || matchNombre) ? acc + curr.count : acc;
      }, 0);
      return { ...plan, usuariosActivos: totalUsuarios };
    });

    res.status(200).json({
      success: true,
      data: planesConUsuarios
    });
  } catch (error) {
    console.error('Error al obtener planes:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener planes',
      error: error.message 
    });
  }
};

// Obtener un plan por ID
exports.obtenerPlanPorId = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    
    if (!plan) {
      return res.status(404).json({ 
        success: false,
        message: 'Plan no encontrado' 
      });
    }

    res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Error al obtener plan:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener plan',
      error: error.message 
    });
  }
};

// Crear un nuevo plan
exports.crearPlan = async (req, res) => {
  try {
    const { nombre, precio, duracionDias, descripcion, tipo, cantidad_entradas, entradas, color } = req.body;

    if (precio < 0) {
      return res.status(400).json({ 
        success: false,
        message: 'El precio no puede ser negativo' 
      });
    }

    // Verificar si ya existe un plan con ese nombre
    const planExiste = await Plan.findOne({ nombre });
    if (planExiste) {
      return res.status(400).json({ 
        success: false,
        message: 'Ya existe un plan con ese nombre' 
      });
    }

    // Sanitizar el tipo de plan
    let tipoSanitized = tipo || 'mensual';
    if (tipoSanitized) {
      tipoSanitized = tipoSanitized.toLowerCase();
      if (tipoSanitized === 'mensualidad') tipoSanitized = 'mensual';
    }

    const nuevoPlan = new Plan({
      nombre,
      precio,
      duracionDias,
      descripcion,
      color: color || '#4F46E5', // Color por defecto (Indigo) si no se envía
      tipo: tipoSanitized,
      cantidad_entradas: cantidad_entradas || entradas || 0, // Soporte para ambos nombres de campo
      activo: true
    });

    await nuevoPlan.save();

    res.status(201).json({
      success: true,
      message: 'Plan creado exitosamente',
      data: nuevoPlan
    });

  } catch (error) {
    console.error('Error al crear plan:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al crear plan',
      error: error.message 
    });
  }
};





// Actualizar un plan
exports.actualizarPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizar = req.body;

    const planActualizado = await Plan.findByIdAndUpdate(
      id,
      datosActualizar,
      { new: true, runValidators: true }
    );

    if (!planActualizado) {
      return res.status(404).json({ 
        success: false,
        message: 'Plan no encontrado' 
      });
    }

    // Si se actualizó el nombre, actualizar también en los usuarios
    if (datosActualizar.nombre) {
      await Usuario.updateMany(
        { plan_id: id },
        { 
          $set: { 
            plan_nombre: datosActualizar.nombre,
            plan: datosActualizar.nombre // Mantener consistencia con campos legacy
          } 
        }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Plan actualizado exitosamente',
      data: planActualizado
    });

  } catch (error) {
    console.error('Error al actualizar plan:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar plan',
      error: error.message 
    });
  }
};

// Desactivar un plan (soft delete)
exports.desactivarPlan = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await Plan.findByIdAndUpdate(
      id,
      { activo: false },
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({ 
        success: false,
        message: 'Plan no encontrado' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Plan desactivado exitosamente',
      data: plan
    });

  } catch (error) {
    console.error('Error al desactivar plan:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al desactivar plan',
      error: error.message 
    });
  }
};

// Eliminar un plan permanentemente
exports.eliminarPlan = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Buscar el plan para validar
    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({ 
        success: false,
        message: 'Plan no encontrado' 
      });
    }

    // 2. Verificar si hay usuarios activos usando este plan
    const usuariosActivos = await Usuario.countDocuments({
      estado: 'activo',
      deleted: { $ne: true },
      $or: [{ plan_id: id }, { plan_nombre: plan.nombre }, { plan: plan.nombre }]
    });

    if (usuariosActivos > 0) {
      return res.status(400).json({ 
        success: false,
        message: `No se puede eliminar: Hay ${usuariosActivos} usuario(s) activo(s) con este plan. Desactívalo en su lugar.` 
      });
    }

    await Plan.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Plan eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar plan:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al eliminar plan',
      error: error.message 
    });
  }
};