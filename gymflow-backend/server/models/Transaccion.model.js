// server/models/Transaccion.model.js
const mongoose = require('mongoose');

const transaccionSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: [
      'mensualidad',      // Pago de plan mensual
      'renovacion',       // Renovación de plan
      'sesion',          // Pago por sesión individual (ej: $5,000)
      'producto',        // Venta de producto (agua, suplemento, etc.)
      'otro',            // Otros ingresos
      'Ingreso',         // Permitir valor genérico del frontend
      'Egreso'           // Permitir valor genérico del frontend
    ],
    required: true
  },
  
  concepto: {
    type: String,
    required: true,
    trim: true
    // Ejemplos: "Botella de agua", "Mensualidad Marzo", "Sesión individual", "Proteína"
  },
  
  monto: {
    type: Number,
    required: true,
    min: 0
  },
  
  cliente_nombre: {
    type: String,
    trim: true
  },
  
  cliente_documento: {
    type: String,
    trim: true
  },
  
  metodo_pago: {
    type: String,
    enum: ['efectivo', 'transferencia', 'tarjeta', 'nequi', 'daviplata', 'otro'],
    default: 'efectivo'
  },
  
  turno: {
    type: String,
    enum: ['mañana', 'tarde', 'noche'],
    default: function() {
      const hora = new Date().getHours();
      if (hora >= 6 && hora < 12) return 'mañana';
      if (hora >= 12 && hora < 18) return 'tarde';
      return 'noche';
    }
  },
  
  fecha: {
    type: Date,
    default: Date.now
  },
  
  notas: {
    type: String,
    trim: true
  },
  
  registrado_por: {
    type: String,
    default: 'Admin'
  }
}, {
  timestamps: true
});

// Índices para búsquedas rápidas
transaccionSchema.index({ fecha: -1 });
transaccionSchema.index({ tipo: 1, fecha: -1 });
transaccionSchema.index({ turno: 1, fecha: -1 });

module.exports = mongoose.model('Transaccion', transaccionSchema);