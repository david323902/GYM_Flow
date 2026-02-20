﻿const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    maxlength: [100, 'El nombre no puede tener más de 100 caracteres']
  },
  documento: {
    type: String,
    required: [true, 'El documento es obligatorio'],
    unique: true,
    trim: true,
    validate: {
      validator: function(doc) {
        return /^\d{5,15}$/.test(doc);
      },
      message: 'El documento debe contener solo números (5-15 dígitos)'
    }
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: 'El email debe tener un formato válido'
    }
  },
  telefono: {
    type: String,
    trim: true,
    validate: {
      validator: function(phone) {
        return !phone || /^\d{7,15}$/.test(phone);
      },
      message: 'El teléfono debe contener solo números (7-15 dígitos)'
    }
  },
  plan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: [true, 'El plan es obligatorio']
  },
  estado: {
    type: String,
    enum: {
      values: ['activo', 'inactivo', 'vencido'],
      message: 'El estado debe ser: activo, inactivo o vencido'
    },
    default: 'activo'
  },
  fecha_inicio: {
    type: Date,
    required: [true, 'La fecha de inicio es obligatoria'],
    default: Date.now
  },
  fecha_vencimiento: {
    type: Date
  },
  entradas_totales: {
    type: Number,
    min: [0, 'Las entradas totales no pueden ser negativas']
  },
  entradas_restantes: {
    type: Number,
    min: [0, 'Las entradas restantes no pueden ser negativas'],
    default: 0
  },
  plan_nombre: String,
  plan_tipo: {
    type: String,
    enum: ['tiempo', 'entradas']
  },
  plan_precio: {
    type: Number,
    min: [0, 'El precio no puede ser negativo']
  },
  notificaciones_activas: {
    type: Boolean,
    default: true
  },
  historial_cambios: [{
    plan_anterior: String,
    plan_nuevo: String,
    fecha: { type: Date, default: Date.now },
    valor_restante: Number,
    monto_pagado: Number
  }],
  ultima_asistencia: { type: Date },
  seguimiento_inactividad: {
    ultimo_mensaje: Date,
    tipo_mensaje: String, // 'saludo', 'oferta'
    respondio: { type: Boolean, default: false }
  },
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para mejor performance
userSchema.index({ documento: 1 });
userSchema.index({ estado: 1 });
userSchema.index({ plan_id: 1 });
userSchema.index({ fecha_vencimiento: 1 });

// Virtual para calcular si el usuario puede ingresar
userSchema.virtual('puedeIngresar').get(function() {
  if (this.estado !== 'activo') return false;
  
  if (this.fecha_vencimiento && new Date() > this.fecha_vencimiento) {
    return false;
  }
  
  if (this.plan_tipo === 'entradas' && this.entradas_restantes <= 0) {
    return false;
  }
  
  return true;
});

// Middleware para actualizar estado basado en fechas/entradas
userSchema.pre('save', function(next) {
  const ahora = new Date();
  
  // Actualizar estado si el plan está vencido
  if (this.fecha_vencimiento && ahora > this.fecha_vencimiento && this.estado === 'activo') {
    this.estado = 'vencido';
  }
  
  // Actualizar estado si no hay entradas
  if (this.plan_tipo === 'entradas' && this.entradas_restantes === 0 && this.estado === 'activo') {
    this.estado = 'vencido';
  }
  
  next();
});

// Método para registrar asistencia
userSchema.methods.registrarAsistencia = async function() {
  // Actualizar fecha de última asistencia para todos los usuarios
  this.ultima_asistencia = new Date();

  if (this.plan_tipo === 'entradas' && this.entradas_restantes > 0) {
    this.entradas_restantes -= 1;
    
    if (this.entradas_restantes === 0) {
      this.estado = 'vencido';
    }
    
    await this.save();
    return true;
  }

  // Para planes de tiempo (mensualidad), solo guardamos la fecha si está activo
  if (this.plan_tipo !== 'entradas' && this.estado === 'activo') {
    await this.save();
    return true;
  }
  
  return false;
};

// Método estático para buscar por documento
userSchema.statics.findByDocumento = function(documento) {
  return this.findOne({ documento: documento.toString().trim() });
};

module.exports = mongoose.model('User', userSchema);