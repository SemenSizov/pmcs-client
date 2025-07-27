import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../auth/AuthProvider';
import api from '../api/api';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handleAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (!code) {
        toast.error('Код авторизації відсутній');
        return navigate('/user-not-found');
      }

      try {
        const res = await api.post('/auth/google/callback', { code });
        const { token } = res.data;

        login(token); // зберігаємо токен у контекст
        window.location.href = '/dashboard'; // повне перезавантаження (уникнення багів з контекстом)
      } catch (err: any) {
        toast.error('Авторизація не вдалася');
        navigate('/user-not-found');
      }
    };

    handleAuth();
  }, [navigate, login]);

  return <p className="text-center mt-5">Виконується вхід...</p>;
};

export default AuthCallback;
