// gymflow-backend/server/services/emailService.js
const nodemailer = require('nodemailer');

// Configuración del transportador de email
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
}

// Verificar conexión al iniciar
if (transporter) {
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Error en configuración de email:', error);
    } else {
      console.log('✅ Servidor de email listo para enviar mensajes');
    }
  });
} else {
  console.log('⚠️  Email no configurado: El servicio de correos se omitirá temporalmente.');
}

// 🖼️ Configuración del Logo (Reemplaza la URL con la de tu gimnasio)
const LOGO_URL = "https://cdn-icons-png.flaticon.com/512/2964/2964514.png";
const logoHtml = `<div style="text-align: center; margin-bottom: 20px;"><img src="${LOGO_URL}" alt="GymFlow" style="width: 100px; height: auto;" /></div>`;

// Plantillas de emails
const emailTemplates = {
  bienvenida: (usuario) => ({
    subject: '¡Bienvenido a GYM_Flow! 💪',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          ${logoHtml}
          <h1 style="color: #4F46E5; text-align: center;">¡Bienvenido a GYM_Flow! 🎉</h1>
          <p style="font-size: 16px; color: #333;">Hola <strong>${usuario.nombre}</strong>,</p>
          <p style="font-size: 14px; color: #666;">
            Nos complace darte la bienvenida a nuestra familia GYM_Flow. Estamos emocionados de acompañarte en tu viaje fitness.
          </p>
          <div style="background-color: #EEF2FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #4F46E5; margin-top: 0;">📋 Tus Datos de Registro:</h3>
            <p style="margin: 5px 0;"><strong>Nombre:</strong> ${usuario.nombre}</p>
            <p style="margin: 5px 0;"><strong>Documento:</strong> ${usuario.documento}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${usuario.email}</p>
            <p style="margin: 5px 0;"><strong>Teléfono:</strong> ${usuario.telefono}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <h3 style="color: #4F46E5;">Tu Código QR de Acceso</h3>
            <p style="font-size: 14px; color: #666;">
              Usa este código en la entrada para registrar tu asistencia de forma rápida y sin contacto.
            </p>
            <div style="margin-top: 15px; padding: 10px; background-color: white; border: 1px solid #ddd; border-radius: 8px; display: inline-block;">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${usuario.documento}" alt="Tu Código QR" style="width: 200px; height: 200px;" />
            </div>
            <p style="font-size: 18px; font-weight: bold; color: #333; margin-top: 10px; font-family: monospace;">${usuario.documento}</p>
          </div>
          <p style="font-size: 14px; color: #666;">
            Recuerda que puedes consultar tus asistencias y estado de membresía en cualquier momento.
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #999; font-size: 12px;">GYM_Flow - Tu gimnasio, tu progreso</p>
          </div>
        </div>
      </div>
    `
  }),

  planActivado: (datos) => {
    const { usuario, plan } = datos;
    return {
      subject: '✅ Tu Plan ha sido Activado - GYM_Flow',
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          ${logoHtml}
          <h1 style="color: #10B981; text-align: center;">¡Plan Activado! ✅</h1>
          <p style="font-size: 16px; color: #333;">Hola <strong>${usuario.nombre}</strong>,</p>
          <p style="font-size: 14px; color: #666;">
            Tu plan de membresía ha sido activado exitosamente.
          </p>
          <div style="background-color: #ECFDF5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #10B981; margin-top: 0;">💳 Detalles del Plan:</h3>
            <p style="margin: 5px 0;"><strong>Plan:</strong> ${plan.nombre}</p>
            <p style="margin: 5px 0;"><strong>Duración:</strong> ${plan.duracionDias} días</p>
            <p style="margin: 5px 0;"><strong>Fecha de inicio:</strong> ${new Date(usuario.fecha_inicio).toLocaleDateString('es-CO')}</p>
            <p style="margin: 5px 0;"><strong>Fecha de vencimiento:</strong> ${new Date(usuario.fecha_vencimiento).toLocaleDateString('es-CO')}</p>
            <p style="margin: 5px 0;"><strong>Estado:</strong> <span style="color: #10B981;">ACTIVO</span></p>
          </div>
          <p style="font-size: 14px; color: #666;">
            ¡Disfruta de todos los beneficios de tu membresía! Nos vemos en el gimnasio 💪
          </p>
        </div>
      </div>
    `
    };
  },

  planProximoVencer: (datos) => {
    const { usuario, diasRestantes } = datos;
    return {
      subject: `⚠️ Tu Plan Vence en ${diasRestantes} día(s) - GYM_Flow`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          ${logoHtml}
          <h1 style="color: #F59E0B; text-align: center;">⚠️ Recordatorio de Renovación</h1>
          <p style="font-size: 16px; color: #333;">Hola <strong>${usuario.nombre}</strong>,</p>
          <p style="font-size: 14px; color: #666;">
            Tu plan de membresía está próximo a vencer en <strong style="color: #F59E0B;">${diasRestantes} día(s)</strong>.
          </p>
          <div style="background-color: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
            <h3 style="color: #F59E0B; margin-top: 0;">📅 Información del Plan:</h3>
            <p style="margin: 5px 0;"><strong>Plan:</strong> ${usuario.plan_nombre}</p>
            <p style="margin: 5px 0;"><strong>Fecha de vencimiento:</strong> ${new Date(usuario.fecha_vencimiento).toLocaleDateString('es-CO')}</p>
            <p style="margin: 5px 0;"><strong>Días restantes:</strong> ${diasRestantes}</p>
          </div>
          <p style="font-size: 14px; color: #666;">
            No olvides renovar tu membresía para seguir disfrutando de todos los beneficios de GYM_Flow.
          </p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="https://gym-flow.vercel.app/" style="display: inline-block; padding: 12px 30px; background-color: #F59E0B; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Renovar Ahora
            </a>
          </div>
        </div>
      </div>
    `
    };
  },

  planVencido: (datos) => {
    const { usuario } = datos;
    return {
      subject: '🔴 Tu Plan ha Vencido - GYM_Flow',
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          ${logoHtml}
          <h1 style="color: #EF4444; text-align: center;">Plan Vencido 🔴</h1>
          <p style="font-size: 16px; color: #333;">Hola <strong>${usuario.nombre}</strong>,</p>
          <p style="font-size: 14px; color: #666;">
            Tu plan de membresía ha vencido. Para seguir disfrutando de nuestros servicios, por favor renueva tu plan.
          </p>
          <div style="background-color: #FEE2E2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444;">
            <h3 style="color: #EF4444; margin-top: 0;">📅 Plan Vencido:</h3>
            <p style="margin: 5px 0;"><strong>Plan:</strong> ${usuario.plan_nombre}</p>
            <p style="margin: 5px 0;"><strong>Fecha de vencimiento:</strong> ${new Date(usuario.fecha_vencimiento).toLocaleDateString('es-CO')}</p>
            <p style="margin: 5px 0;"><strong>Estado:</strong> <span style="color: #EF4444;">VENCIDO</span></p>
          </div>
          <p style="font-size: 14px; color: #666;">
            ¡Te extrañamos! Renueva hoy y continúa tu progreso fitness.
          </p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="https://gym-flow.vercel.app/" style="display: inline-block; padding: 12px 30px; background-color: #EF4444; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Renovar Mi Plan
            </a>
          </div>
        </div>
      </div>
    `
    };
  },

  asistenciaRegistrada: (datos) => {
    const { usuario, asistencia } = datos;
    return {
      subject: '✅ Asistencia Registrada - GYM_Flow',
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          ${logoHtml}
          <h1 style="color: #10B981; text-align: center;">¡Asistencia Registrada! 💪</h1>
          <p style="font-size: 16px; color: #333;">Hola <strong>${usuario.nombre}</strong>,</p>
          <p style="font-size: 14px; color: #666;">
            Tu asistencia al gimnasio ha sido registrada exitosamente.
          </p>
          <div style="background-color: #ECFDF5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #10B981; margin-top: 0;">📊 Detalles de Asistencia:</h3>
            <p style="margin: 5px 0;"><strong>Fecha:</strong> ${new Date(asistencia.fecha).toLocaleDateString('es-CO')}</p>
            <p style="margin: 5px 0;"><strong>Hora:</strong> ${new Date(asistencia.fecha).toLocaleTimeString('es-CO')}</p>
            <p style="margin: 5px 0;"><strong>Total de asistencias:</strong> ${asistencia.totalAsistencias || 'N/A'}</p>
          </div>
          <p style="font-size: 14px; color: #666;">
            ¡Sigue así! Cada día cuentas un paso más hacia tus objetivos 🎯
          </p>
        </div>
      </div>
    `
    };
  },

  pagoRecibido: (datos) => {
    const { usuario, transaccion } = datos;
    return {
      subject: '✅ Confirmación de Pago y Renovación - GYM_Flow',
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          ${logoHtml}
          <h1 style="color: #10B981; text-align: center;">¡Plan Renovado!</h1>
          <p style="font-size: 16px; color: #333;">Hola <strong>${usuario.nombre}</strong>,</p>
          <p style="font-size: 14px; color: #666;">
            Hemos recibido tu pago y tu plan ha sido renovado. ¡Gracias por seguir con nosotros!
          </p>
          <div style="background-color: #ECFDF5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #10B981; margin-top: 0;">💳 Detalles de la Renovación:</h3>
            <p style="margin: 5px 0;"><strong>Monto Pagado:</strong> $${parseFloat(transaccion.monto).toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Concepto:</strong> ${transaccion.descripcion || 'Renovación de plan'}</p>
            <p style="margin: 5px 0;"><strong>Fecha de Pago:</strong> ${new Date(transaccion.fecha).toLocaleDateString('es-CO')}</p>
            <p style="margin: 5px 0;"><strong>Nueva Fecha de Vencimiento:</strong> <strong style="color: #10B981;">${new Date(usuario.fecha_vencimiento).toLocaleDateString('es-CO')}</strong></p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <h3 style="color: #4F46E5;">Tu Código QR de Acceso</h3>
            <p style="font-size: 14px; color: #666;">
              Puedes seguir usando este código QR para registrar tu asistencia de forma rápida y sin contacto.
            </p>
            <div style="margin-top: 15px; padding: 10px; background-color: white; border: 1px solid #ddd; border-radius: 8px; display: inline-block;">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${usuario.documento}" alt="Tu Código QR" style="width: 200px; height: 200px;" />
            </div>
            <p style="font-size: 18px; font-weight: bold; color: #333; margin-top: 10px; font-family: monospace;">${usuario.documento}</p>
          </div>

          <p style="font-size: 14px; color: #666;">¡Nos vemos en el gimnasio! 💪</p>
        </div>
      </div>
      `
    };
  },

  recuperarPassword: (datos) => {
    const { usuario, codigo } = datos;
    return {
      subject: '🔐 Recuperación de Contraseña - GYM_Flow',
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          ${logoHtml}
          <h1 style="color: #4F46E5; text-align: center;">🔐 Recuperación de Contraseña</h1>
          <p style="font-size: 16px; color: #333;">Hola <strong>${usuario.nombre}</strong>,</p>
          <p style="font-size: 14px; color: #666;">
            Hemos recibido una solicitud para restablecer tu contraseña.
          </p>
          <div style="background-color: #EEF2FF; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="color: #4F46E5; margin-top: 0;">Tu código de recuperación:</h3>
            <p style="font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 5px; margin: 10px 0;">
              ${codigo}
            </p>
            <p style="font-size: 12px; color: #666; margin-top: 10px;">
              Este código expira en 1 hora
            </p>
          </div>
          <p style="font-size: 14px; color: #666;">
            Si no solicitaste este cambio, por favor ignora este correo.
          </p>
        </div>
      </div>
    `
    };
  }
};

// Función principal para enviar emails
async function enviarEmail(destinatario, tipo, datos) {
  if (!transporter) {
    console.log(`⚠️  Email omitido (sin credenciales): ${tipo} para ${destinatario}`);
    return { success: false, error: 'Credenciales de email no configuradas' };
  }

  try {
    const template = emailTemplates[tipo];
    
    if (!template) {
      throw new Error(`Tipo de email no válido: ${tipo}`);
    }

    const { subject, html } = template(datos);

    const mailOptions = {
      from: `"GYM_Flow" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: subject,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email enviado exitosamente:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    return { success: false, error: error.message };
  }
}

// Función para enviar emails en lote
async function enviarEmailsLote(destinatarios, tipo, datos) {
  const resultados = [];
  
  for (const destinatario of destinatarios) {
    const resultado = await enviarEmail(destinatario, tipo, datos);
    resultados.push({ destinatario, ...resultado });
    
    // Esperar un poco entre emails para no saturar
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return resultados;
}

module.exports = {
  enviarEmail,
  enviarEmailsLote,
  emailTemplates
};