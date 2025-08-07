import { useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Button, Container } from 'react-bootstrap';
import { redirectToGoogle } from '../auth/auth';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-light" role="status" />
      </div>
    );
  }

  return (
    <div
      className="d-flex justify-content-center align-items-center text-center text-white px-3"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to right, #0f2027, #203a43, #2c5364)',
      }}
    >
      <Container className="py-5">
        <h1 className="mb-3 display-5 fw-bold">Ласкаво просимо до PMCS</h1>
        <p className="mb-4 fs-5">Щоб розпочати, увійдіть через Google</p>
        <div className="d-flex justify-content-center">
          <Button variant="light" size="lg" style={{ maxWidth: '280px', width: '100%' }} onClick={redirectToGoogle}>
            Увійти через Google
          </Button>
        </div>
      </Container>
    </div>
  );
}
