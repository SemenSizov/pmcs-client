import { useEffect } from 'react';
import { redirectToGoogle } from './auth';

const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('token'); // або інший спосіб

  useEffect(() => {
    if (!isAuthenticated) {
      redirectToGoogle();
    }
  }, []);

  if (!isAuthenticated) {
    return <p>Redirecting to login...</p>;
  }

  return <>{children}</>;
};

export default AuthGate;