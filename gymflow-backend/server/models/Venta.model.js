const mongoose = require('mongoose');

const VentaSchema = new mongoose.Schema({
  numeroFactura: { type: String },
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  items: [{
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto' },
    nombre: String,
    cantidad: Number,
    precioUnitario: Number,
    subtotal: Number
  }],
  total: { type: Number, required: true },
  metodoPago: { type: String, default: 'efectivo' },
  fecha: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Venta', VentaSchema);