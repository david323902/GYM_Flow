import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  documento: {
    type: String,
    required: [true, 'El documento es obligatorio'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  telefono: String,
  foto: String,
  huella: String,
  plan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan'
  },
  estado: {
    type: String,
    enum: ['activo', 'inactivo', 'vencido'],
    default: 'activo'
  }
}, {
  timestamps: true
});

export default mongoose.model('User', userSchema);
