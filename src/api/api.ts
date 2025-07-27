import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: false, // якщо треба — можна ввімкнути
});

export const addAuthTokenToApi = (token: string) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const removeAuthTokenFromApi = () => {
  delete api.defaults.headers.common['Authorization'];
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 500) {
      const errorMessage = 'Сталася помилка на сервері. Спробуйте пізніше.';
      if (error.message) {
        errorMessage.concat(`Деталі: ${error.message}`);
        toast.error(errorMessage);
      }
      return Promise.reject(error);
    }
    if (error.response?.status === 401) {
      toast.error('Сесія завершена. Увійдіть знову.');
      window.location.href = '/'
    }
  }
);

export default api;
