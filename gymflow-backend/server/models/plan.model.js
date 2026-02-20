// server/models/plan.model.js
const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del plan es obligatorio'],
    trim: true
  },
  descripcion: {
    type: String,
    default: ''
  },
  precio: {
    type: Number,
    required: [true, 'El precio es obligatorio'],
    min: [0, 'El precio no puede ser negativo']
  },
  duracionDias: {
    type: Number,
    required: [true, 'La duración en días es obligatoria'],
    min: [1, 'La duración mínima es 1 día'],
    default: 30
  },
  cantidad_entradas: {
    type: Number,
    default: 0, // 0 = ilimitado
    min: [0, 'La cantidad de entradas no puede ser negativa']
  },
  activo: {
    type: Boolean,
    default: true
  },
  tipo: {
    type: String,
    enum: ['mensual', 'quincenal', 'semanal', 'diario', 'tiquetera', 'personalizado'],
    default: 'mensual'
  },
  beneficios: [{
    type: String
  }]
}, {
  timestamps: true,
  versionKey: false
});

module.exports = mongoose.models.Plan || mongoose.model('Plan', planSchema);