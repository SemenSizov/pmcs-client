// AuthCallback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { toast } from 'react-toastify';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (!code) {
        toast.error('Missing auth code');
        return navigate('/user-not-found');
      }

      try {
        const res = await api.post('/auth/google/callback', { code });
        console.log('Response from backend:', res.data);
        const { token } = res.data;

        console.log('Received token, saving to localStorage');
        localStorage.setItem('token', token);
        window.location.href = '/'; // повне перезавантаження — AuthProvider ініціалізується
      } catch (err: any) {
        toast.error('Authorization failed');
        navigate('/user-not-found');
      }
    };

    handleAuth();
  }, [navigate]);

  return <p>Logging in...</p>;
};

export default AuthCallback;
