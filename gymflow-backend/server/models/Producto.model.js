const mongoose = require('mongoose');

const ProductoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  categoria: { type: String, required: true }, // Suplemento, Ropa, Bebida, Servicio, Otro
  precio: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  minStock: { type: Number, default: 5 },
  descripcion: { type: String },
  imagen: { type: String }, // Base64 o URL
  deleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Producto', ProductoSchema);