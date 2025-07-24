import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import type { ReactNode } from 'react';
import { Spinner } from 'react-bootstrap';
import { redirectToGoogle } from '../auth/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: ('admin' | 'user')[];
}

const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  console.log({ isAuthenticated, user, isLoading });

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!isAuthenticated) {
    redirectToGoogle();
    return null;
  }

  if (roles && (!user?.role || !roles.includes(user.role))) {
    return <Navigate to="/user-not-found" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
