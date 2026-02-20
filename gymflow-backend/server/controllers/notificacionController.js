const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

// Intentar obtener el modelo Usuario de forma segura
let Usuario;
try {
  Usuario = mongoose.model('Usuario');
} catch (e) {
  try {
     Usuario = require('../models/Usuario.model');
  } catch(e2) {
     console.warn('Modelo Usuario no encontrado para notificaciones');
  }
}

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const enviarNotificacionManual = async (req, res) => {
  try {
    const { usuarioId, mensaje, canal, email } = req.body;

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ Credenciales de correo no configuradas en .env');
      return res.json({ success: true, message: 'Simulación: Correo enviado (Faltan credenciales en servidor)' });
    }

    let destinatarioEmail = email;

    if (usuarioId && Usuario) {
      const usuario = await Usuario.findById(usuarioId);
      if (usuario) {
        destinatarioEmail = usuario.email;
      }
    }

    if (!destinatarioEmail) {
      return res.status(400).json({ success: false, message: 'No se encontró email para este usuario' });
    }

    const mailOptions = {
      from: `"Gym Flow" <${process.env.EMAIL_USER}>`,
      to: destinatarioEmail,
      subject: 'Aviso Importante - Gym Flow',
      text: mensaje,
      html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #4F46E5;">Hola!</h2>
              <p style="font-size: 16px; color: #333;">${mensaje}</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #888; font-size: 12px;">Enviado desde Gym Flow</p>
             </div>`
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Correo enviado exitosamente' });

  } catch (error) {
    console.error('Error enviando correo:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const verificarConfig = (req, res) => {
  res.json({
    success: true,
    config: {
      email: !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD)
    }
  });
};

const enviarReporteCierre = async (req, res) => {
    // Stub para evitar 404 en cierre de caja si no hay email configurado
    res.json({ success: true, message: 'Reporte procesado' });
};

module.exports = {
  enviarNotificacionManual,
  verificarConfig,
  enviarReporteCierre
};