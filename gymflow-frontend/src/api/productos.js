import axios from './axios'

export const productosAPI = {
  getAll: () => axios.get('/productos'),
  get: (id) => axios.get(`/productos/${id}`),
  create: (data) => axios.post('/productos', data),
  update: (id, data) => axios.put(`/productos/${id}`, data),
  delete: (id) => axios.delete(`/productos/${id}`),
  updateStock: (id, cantidad) => axios.patch(`/productos/${id}/stock`, { cantidad })
}