// gymflow-backend/server/middleware/notificationMiddleware.js
const { enviarEmail } = require('../services/emailService');

// Middleware para enviar email después de registro
const notificarRegistro = async (req, res, next) => {
  const originalJson = res.json.bind(res);
  
  res.json = function(data) {
    if (res.statusCode === 201 && data.usuario) {
      // Enviar email de bienvenida en segundo plano
      enviarEmail(data.usuario.email, 'bienvenida', data.usuario)
        .catch(err => console.error('Error al enviar email de bienvenida:', err));
    }
    return originalJson(data);
  };
  
  next();
};

// Middleware para notificar activación de plan
const notificarPlanActivado = async (req, res, next) => {
  const originalJson = res.json.bind(res);
  
  res.json = function(data) {
    if (data.success && data.plan && data.usuario) {
      enviarEmail(data.usuario.email, 'planActivado', {
        nombres: data.usuario.nombres,
        apellidos: data.usuario.apellidos,
        email: data.usuario.email
      }, {
        datosAdicionales: data.plan
      }).catch(err => console.error('Error al enviar email de plan:', err));
    }
    return originalJson(data);
  };
  
  next();
};

// Middleware para notificar asistencia
const notificarAsistencia = async (req, res, next) => {
  const originalJson = res.json.bind(res);
  
  res.json = function(data) {
    if (data.success && data.asistencia && data.usuario) {
      enviarEmail(data.usuario.email, 'asistenciaRegistrada', data.usuario, {
        datosAdicionales: data.asistencia
      }).catch(err => console.error('Error al enviar email de asistencia:', err));
    }
    return originalJson(data);
  };
  
  next();
};

module.exports = {
  notificarRegistro,
  notificarPlanActivado,
  notificarAsistencia
};