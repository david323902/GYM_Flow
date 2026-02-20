import axios from './axios'

export const notificacionesAPI = {
  getAll: () => axios.get('/notificaciones'),
  create: (data) => axios.post('/notificaciones', data),
  enviarNotificacionManual: (data) => axios.post('/notificaciones/manual', data),
  enviarReporteCierre: (data) => axios.post('/notificaciones/reporte-cierre', data),
  verificarConfig: () => axios.get('/notificaciones/verificar-config')
}