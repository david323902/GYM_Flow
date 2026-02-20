import api from './axios'

export const testAPI = {
  checkHealth: () => api.get('/health'),
  checkTransacciones: () => api.get('/transacciones'),
  checkUsuarios: () => api.get('/usuarios'),
  checkAsistencias: () => api.get('/asistencias'),
}