import axios from 'axios';

// URL de tu servidor Express (en local suele ser 3000, en Render será la URL asignada)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
});

export default api;