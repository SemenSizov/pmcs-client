import axios from 'axios';
import { toast } from 'react-toastify';
import { logout } from '../auth/auth';

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
      logout();
      toast.error('Сесія завершена. Увійдіть знову.');
      window.location.href = '/';
    }
    if (error.response?.status === 403) {
      logout()
      toast.error('Помилка авторизації. Увійдіть знову.');
      window.location.href = '/';
    }
  }
);

export default api;
