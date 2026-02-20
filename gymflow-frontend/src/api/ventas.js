import axios from './axios'

export const ventasAPI = {
  getAll: () => axios.get('/ventas'),
  get: (id) => axios.get(`/ventas/${id}`),
  create: (data) => axios.post('/ventas', data),
  update: (id, data) => axios.put(`/ventas/${id}`, data),
  delete: (id) => axios.delete(`/ventas/${id}`)
}