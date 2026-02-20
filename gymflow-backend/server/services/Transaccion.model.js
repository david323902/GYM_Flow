const mongoose = require('mongoose');

const transaccionSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['ingreso', 'egreso'],
    required: true
  },
  categoria: {
    type: String,
    enum: ['producto', 'sesion_unica', 'mensualidad', 'gasto', 'otro'],
    required: true
  },
  descripcion: {
    type: String,
    required: true // Ej: "Agua 600ml", "Entrenamiento Diario", "Pago Limpieza"
  },
  monto: {
    type: Number,
    required: true
  },
  metodoPago: {
    type: String,
    enum: ['efectivo', 'nequi', 'daviplata', 'tarjeta'],
    default: 'efectivo'
  },
  fecha: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaccion', transaccionSchema);