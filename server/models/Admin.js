const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  nombre: { 
    type: String, 
    required: [true, 'El nombre es obligatorio'] 
  },
  email: { 
    type: String, 
    required: [true, 'El email es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: [true, 'La contraseña es obligatoria'],
    select: false // No se incluye en las consultas por defecto
  },
  rol: { 
    type: String, 
    enum: ['superadmin', 'admin', 'recepcionista'], 
    default: 'recepcionista' 
  },
  sede: { 
    type: String, 
    default: 'Sede Principal' 
  },
  activo: { 
    type: Boolean, 
    default: true 
  },
  telefono: String,
  ultimoAcceso: Date,
  fechaCreacion: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Hash password antes de guardar
adminSchema.pre('save', async function(next) {
  // Solo hashear si la contraseña fue modificada (o es nueva)
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar passwords
adminSchema.methods.compararPassword = async function(passwordIngresada) {
  return await bcrypt.compare(passwordIngresada, this.password);
};

// Método para generar token JWT
adminSchema.methods.generarJWT = function() {
  const payload = {
    id: this._id,
    nombre: this.nombre,
    email: this.email,
    rol: this.rol
  };
  
  // Requiere jsonwebtoken
  const jwt = require('jsonwebtoken');
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
};

module.exports = mongoose.model('Admin', adminSchema);