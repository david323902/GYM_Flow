import { API_URL, getAuthHeaders, handleResponse } from './config';

export const transaccionesAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/transacciones`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },
  getHoy: async () => {
    const response = await fetch(`${API_URL}/transacciones/hoy`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },
  create: async (data) => {
    const response = await fetch(`${API_URL}/transacciones`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  update: async (id, data) => {
    const response = await fetch(`${API_URL}/transacciones/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  delete: async (id) => {
    const response = await fetch(`${API_URL}/transacciones/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};