import api from './axios'

export const cierreCajaAPI = {
  realizar: (data) => api.post('/cierre-caja', data),
  getUltimo: () => api.get('/cierre-caja/ultimo'),
  getByFecha: (fecha) => api.get(`/cierre-caja/fecha/${fecha}`),
  getAll: () => api.get('/cierre-caja'),
}