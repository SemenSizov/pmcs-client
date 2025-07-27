import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import type { JSX } from 'react';

type role ="user"|"admin"

interface ProtectedRouteProps {
  children: JSX.Element;
  roles?: role[];
  invert?: boolean;
}

const ProtectedRoute = ({ children, roles, invert = false }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return null;

  if (invert && isAuthenticated) {
    return <Navigate to="/" />;
  }

  if (!invert && !isAuthenticated) {
    return <Navigate to="/home" />;
  }

  if (roles && (!user || !roles.includes(user.role!))) {
    return <Navigate to="/user-not-found" />;
  }

  return children;
};

export default ProtectedRoute
