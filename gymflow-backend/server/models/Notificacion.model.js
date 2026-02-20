const mongoose = require('mongoose');

const NotificacionSchema = new mongoose.Schema({
  tipo: {
    type: String,
    required: true,
    enum: ['vencimiento_proximo', 'manual', 'sistema']
  },
  mensaje: {
    type: String,
    required: true
  },
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  leida: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: Object
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notificacion', NotificacionSchema);