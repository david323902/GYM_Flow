const Venta = require('../models/Venta.model');

// En server/controllers/venta.controller.js
const crearVenta = async (req, res) => {
  try {
    // 1. Buscar la última venta para obtener el consecutivo
    const ultimaVenta = await Venta.findOne().sort({ _id: -1 }).lean();
    
    let secuencia = 0;
    if (ultimaVenta && ultimaVenta.numero_venta) {
      const val = ultimaVenta.numero_venta;
      if (!isNaN(val)) {
        secuencia = Number(val);
      } else {
        const matches = val.toString().match(/(\d+)$/);
        if (matches) secuencia = parseInt(matches[0], 10);
      }
    }
    const fechaActual = new Date();
    const anio = fechaActual.getFullYear();
    const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
    const nuevoNumero = `FAC-${anio}-${mes}-${String(secuencia + 1).padStart(3, '0')}`;

    console.log('📝 Generando venta #', nuevoNumero);
    // 2. Crear la venta con el nuevo número
    const nuevaVenta = new Venta(req.body);
    // Usamos strict: false para forzar el guardado de numero_venta aunque no esté en el esquema
    nuevaVenta.set('numero_venta', nuevoNumero, { strict: false });

    const ventaGuardada = await nuevaVenta.save();
    res.status(201).json(ventaGuardada);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: error.message });
  }
};


const obtenerVentas = async (req, res) => {
  try {
    const ventas = await Venta.find({ deleted: false })
      .populate('cliente', 'nombre documento')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: ventas });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const eliminarVenta = async (req, res) => {
  try {
    await Venta.findByIdAndUpdate(req.params.id, { deleted: true });
    res.json({ success: true, message: 'Venta eliminada' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { crearVenta, obtenerVentas, eliminarVenta };