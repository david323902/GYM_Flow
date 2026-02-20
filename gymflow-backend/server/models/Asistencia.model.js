const mongoose = require('mongoose');

const asistenciaSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: false
  },
  documento: {
    type: String,
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  metodo: {
    type: String,
    default: 'manual'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Asistencia', asistenciaSchema);