import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: false // якщо треба — можна ввімкнути
});

export const addAuthTokenToApi = (token: string) =>{
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export const removeAuthTokenFromApi = () => {
  delete api.defaults.headers.common['Authorization']
}

export default api;