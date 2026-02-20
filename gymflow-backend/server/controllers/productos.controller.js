// server/controllers/productos.controller.js
const Producto = require('../models/Producto.model');

// Crear producto
exports.crearProducto = async (req, res) => {
  try {
    const producto = new Producto(req.body);
    await producto.save();
    
    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      producto
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(400).json({
      success: false,
      message: 'Error al crear producto',
      error: error.message
    });
  }
};

// Obtener todos los productos
exports.obtenerProductos = async (req, res) => {
  try {
    const { categoria, estado, stock_bajo } = req.query;
    
    let filtro = {};
    
    if (categoria) filtro.categoria = categoria;
    if (estado) filtro.estado = estado;
    
    let productos = await Producto.find(filtro).sort({ nombre: 1 });
    
    // Filtrar por stock bajo si se solicita
    if (stock_bajo === 'true') {
      productos = productos.filter(p => p.stockBajo());
    }
    
    res.json({
      success: true,
      total: productos.length,
      productos
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos',
      error: error.message
    });
  }
};

// Obtener un producto por ID
exports.obtenerProducto = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    res.json({
      success: true,
      producto
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener producto',
      error: error.message
    });
  }
};

// Actualizar producto
exports.actualizarProducto = async (req, res) => {
  try {
    const producto = await Producto.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      producto
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(400).json({
      success: false,
      message: 'Error al actualizar producto',
      error: error.message
    });
  }
};

// Eliminar producto
exports.eliminarProducto = async (req, res) => {
  try {
    const producto = await Producto.findByIdAndDelete(req.params.id);
    
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto',
      error: error.message
    });
  }
};

// Ajustar stock
exports.ajustarStock = async (req, res) => {
  try {
    const { cantidad, tipo, motivo } = req.body; // tipo: 'entrada' o 'salida'
    
    const producto = await Producto.findById(req.params.id);
    
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    if (tipo === 'entrada') {
      producto.stock += cantidad;
    } else if (tipo === 'salida') {
      if (producto.stock < cantidad) {
        return res.status(400).json({
          success: false,
          message: 'Stock insuficiente'
        });
      }
      producto.stock -= cantidad;
    }
    
    await producto.save();
    
    res.json({
      success: true,
      message: `Stock ${tipo === 'entrada' ? 'incrementado' : 'decrementado'} exitosamente`,
      producto
    });
  } catch (error) {
    console.error('Error al ajustar stock:', error);
    res.status(400).json({
      success: false,
      message: 'Error al ajustar stock',
      error: error.message
    });
  }
};

// Obtener productos con stock bajo
exports.obtenerProductosStockBajo = async (req, res) => {
  try {
    const productos = await Producto.find({ estado: { $ne: 'inactivo' } });
    
    const productosStockBajo = productos.filter(p => p.stockBajo());
    
    res.json({
      success: true,
      total: productosStockBajo.length,
      productos: productosStockBajo
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos con stock bajo',
      error: error.message
    });
  }
};