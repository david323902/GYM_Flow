const Producto = require('../models/Producto.model');

const crearProducto = async (req, res) => {
  try {
    const producto = new Producto(req.body);
    await producto.save();
    res.status(201).json({ success: true, data: producto });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const obtenerProductos = async (req, res) => {
  try {
    const productos = await Producto.find({ deleted: false }).sort({ createdAt: -1 });
    res.json({ success: true, data: productos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const actualizarProducto = async (req, res) => {
  try {
    const producto = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: producto });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const eliminarProducto = async (req, res) => {
  try {
    await Producto.findByIdAndUpdate(req.params.id, { deleted: true });
    res.json({ success: true, message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const actualizarStock = async (req, res) => {
  try {
    const { cantidad } = req.body; // Cantidad a sumar (positivo) o restar (negativo)
    const producto = await Producto.findById(req.params.id);
    if (!producto) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    
    producto.stock += parseInt(cantidad);
    await producto.save();
    
    res.json({ success: true, data: producto });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { crearProducto, obtenerProductos, actualizarProducto, eliminarProducto, actualizarStock };