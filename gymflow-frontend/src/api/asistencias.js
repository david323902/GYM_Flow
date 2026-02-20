import { API_URL, getAuthHeaders, handleResponse } from './config';

export const asistenciasAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/asistencias`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },
  registrar: async (documento) => {
    const response = await fetch(`${API_URL}/asistencias`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ documento })
    });
    return handleResponse(response);
  }
};