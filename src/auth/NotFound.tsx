import { Button, Container, Row, Col, Card } from 'react-bootstrap';
import { redirectToGoogle } from './auth';

const NotFound = () => {
  const handleTryAnother = () => {
    redirectToGoogle(); // спробувати увійти іншим обліковим записом
  };

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100">
      <Row>
        <Col>
          <Card className="text-center shadow">
            <Card.Body>
              <Card.Title className="mb-3">Користувача не знайдено</Card.Title>
              <Card.Text>
                Ваш Google-акаунт не має доступу до цього додатку.
              </Card.Text>
              <Button variant="primary" onClick={handleTryAnother}>
                Увійти з іншим акаунтом
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFound;
