const cron = require('node-cron');
const mongoose = require('mongoose');
const { enviarEmail } = require('../services/emailService');

const iniciarCronJobs = () => {
  console.log('⏰ Sistema de tareas programadas iniciado');

  // Ejecutar todos los días a las 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ [CRON] Ejecutando tarea: Recordatorios de vencimiento de planes.');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.log('⚠️ [CRON] Tarea omitida: Credenciales de email no configuradas.');
        return;
    }

    try {
      let Usuario;
      try { 
        Usuario = mongoose.model('Usuario'); 
      } catch(e) { 
        console.error('[CRON] Error: Modelo de Usuario no encontrado.');
        return; 
      }

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      // Días en los que se enviará recordatorio (ej: 1, 3 y 7 días antes)
      const diasRecordatorio = [1, 3, 7]; 

      for (const dia of diasRecordatorio) {
        const fechaObjetivo = new Date(hoy);
        fechaObjetivo.setDate(hoy.getDate() + dia);

        const inicioDelDia = new Date(fechaObjetivo.setHours(0, 0, 0, 0));
        const finDelDia = new Date(fechaObjetivo.setHours(23, 59, 59, 999));

        // Buscar usuarios activos cuyo plan vence en la fecha objetivo
        const usuariosPorVencer = await Usuario.find({
          fecha_vencimiento: { $gte: inicioDelDia, $lte: finDelDia },
          estado: 'activo',
          notificaciones_activas: { $ne: false } // Opcional: Respetar si el usuario no quiere notificaciones
        });

        if (usuariosPorVencer.length > 0) {
          console.log(`[CRON] 📧 Encontrados ${usuariosPorVencer.length} usuarios con plan venciendo en ${dia} día(s).`);

          for (const usuario of usuariosPorVencer) {
              if (usuario.email) {
                  console.log(`[CRON] -> Enviando recordatorio a ${usuario.email}`);
                  // Enviar email usando el servicio centralizado (fire and forget)
                  enviarEmail(usuario.email, 'planProximoVencer', { usuario, diasRestantes: dia })
                    .catch(err => console.error(`[CRON] Error enviando email a ${usuario.email}:`, err));
              }
          }
        }
      }
      console.log('✅ [CRON] Tarea de recordatorios finalizada.');

    } catch (error) {
      console.error('❌ [CRON] Error fatal en la tarea de recordatorios:', error);
    }
  });
};

const detenerCronJobs = () => {};

module.exports = { iniciarCronJobs, detenerCronJobs };