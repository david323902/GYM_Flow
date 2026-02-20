// gymflow-backend/server/models/Usuario.model.js
const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  documento: {
    type: String,
    required: [true, 'El documento es obligatorio'],
    unique: true,
    trim: true,
    index: true,
    validate: {
      validator: function(v) {
        // Valida que el documento contenga exactamente 10 dígitos numéricos.
        return /^\d{10}$/.test(v);
      },
      message: props => `${props.value} no es un número de documento válido. Debe contener exactamente 10 dígitos.`
    }
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true, // Permite múltiples valores null pero mantiene unicidad para valores no-null
    validate: {
      validator: function(v) {
        // Permite valores nulos o vacíos, pero si se proporciona uno, debe ser un email válido.
        return v === null || v === '' || /^\S+@\S+\.\S+$/.test(v);
      },
      message: 'Por favor, introduce un correo electrónico válido.'
    }
  },
  telefono: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        // Permite valores nulos o vacíos, pero si se proporciona uno, debe tener 10 dígitos.
        if (v === null || v === '') {
          return true;
        }
        return /^\d{10}$/.test(v);
      },
      message: props => `${props.value} no es un número de teléfono válido. Debe contener exactamente 10 dígitos.`
    }
  },
  direccion: {
    type: String,
    trim: true
  },
  genero: {
    type: String,
    enum: ['Masculino', 'Femenino', 'Otro'],
    default: 'Otro'
  },
  plan: {
    type: String,
    required: [true, 'El plan es obligatorio'],
    trim: true
  },
  tipoPlan: {
    type: String,
    enum: ['mensualidad', 'tiquetera'],
    default: 'mensualidad'
  },
  fechaInicio: {
    type: Date,
    default: Date.now
  },
  fechaVencimiento: {
    type: Date,
    required: [true, 'La fecha de vencimiento es obligatoria']
  },
  entradas: {
    type: Number,
    default: 0,
    min: 0
  },
  entradasRestantes: {
    type: Number,
    default: 0,
    min: 0
  },
  estado: {
    type: String,
    enum: ['activo', 'inactivo', 'vencido', 'suspendido'],
    default: 'activo'
  },
  observaciones: {
    type: String,
    trim: true
  },
  historial_cambios: [{
    plan_anterior: String,
    plan_nuevo: String,
    fecha: Date,
    valor_restante: Number,
    monto_pagado: Number
  }],
  foto: {
    type: String, // Guardaremos la imagen en Base64 o URL
    default: null
  },
  // --- Campos para Soft Delete ---
  deleted: {
    type: Boolean,
    default: false,
    index: true // Index para optimizar búsquedas de no eliminados
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true, // Agrega createdAt y updatedAt automáticamente
  versionKey: false // No incluir __v
});

// Índices para mejorar búsquedas
usuarioSchema.index({ documento: 1 });
usuarioSchema.index({ estado: 1 });
usuarioSchema.index({ fechaVencimiento: 1 });
usuarioSchema.index({ plan: 1 });

// Middleware pre-save para validar fechas (usando async/await para compatibilidad)
usuarioSchema.pre('save', async function() {
  // Validar fechas solo si ambas existen
  if (this.fechaVencimiento && this.fechaInicio) {
    const fechaVenc = new Date(this.fechaVencimiento);
    const fechaIni = new Date(this.fechaInicio);
    
    // Verificar que las fechas sean válidas
    if (isNaN(fechaVenc.getTime()) || isNaN(fechaIni.getTime())) {
      throw new Error('Las fechas proporcionadas no son válidas');
    }
    
    // Validar que fechaVencimiento sea posterior a fechaInicio
    if (fechaVenc < fechaIni) {
      throw new Error('La fecha de vencimiento no puede ser anterior a la fecha de inicio');
    }
  }
});

// Método para verificar si el plan está vencido
usuarioSchema.methods.estaVencido = function() {
  return this.fechaVencimiento < new Date();
};

// Método para verificar si tiene entradas disponibles (solo para tiquetera)
usuarioSchema.methods.tieneEntradas = function() {
  if (this.tipoPlan === 'tiquetera') {
    return this.entradasRestantes > 0;
  }
  return true; // Para mensualidad, siempre tiene "entradas" (acceso ilimitado)
};

module.exports = mongoose.models.Usuario || mongoose.model('Usuario', usuarioSchema);
