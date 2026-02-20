import api from './axios'

export const planesAPI = {
  getAll: () => api.get('/planes'),
  getById: (id) => api.get(`/planes/${id}`),
  create: (data) => api.post('/planes', data),
  update: (id, data) => api.put(`/planes/${id}`, data),
  delete: (id) => api.delete(`/planes/${id}`),
}