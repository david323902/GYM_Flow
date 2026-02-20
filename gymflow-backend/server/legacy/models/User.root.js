// Legacy copy of root server/models/User.js
const mongoose = require('mongoose');
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
  }
});

module.exports = mongoose.model('User', userSchema);
