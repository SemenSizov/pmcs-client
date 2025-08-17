// NavigationBar.tsx
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { Navbar, Nav, Container, Offcanvas, Spinner, NavDropdown } from 'react-bootstrap';
import { useState } from 'react';

const NavigationBar = () => {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const handleClose = () => setShowMenu(false);
  const handleShow = () => setShowMenu(true);

  const handleNavItemClick = () => {
    handleClose();
  };

  if (isLoading) {
    return (
      <Navbar bg="dark" variant="dark" className="mb-3">
        <Container>
          <Navbar.Text className="text-light">
            <Spinner animation="border" size="sm" className="me-2" /> Завантаження...
          </Navbar.Text>
        </Container>
      </Navbar>
    );
  }

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-3">
      <Container fluid>
        <Navbar.Brand as={NavLink} to="/">
          PMCS
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="offcanvasNavbar" onClick={handleShow} />
        <Navbar.Offcanvas
          id="offcanvasNavbar"
          show={showMenu}
          onHide={handleClose}
          aria-labelledby="offcanvasNavbarLabel"
          placement="end"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title id="offcanvasNavbarLabel">Меню</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Nav className="justify-content-end flex-grow-1 pe-3">
              <Nav.Link as={NavLink} to="/dashboard" end onClick={handleNavItemClick}>
                Головна
              </Nav.Link>
              <Nav.Link as={NavLink} to="/meters" onClick={handleNavItemClick}>
                Показники мотогодин
              </Nav.Link>
              <Nav.Link as={NavLink} to="/pmcs" onClick={handleNavItemClick}>
                Журнал обслуговування
              </Nav.Link>
              {user?.role === 'admin' && (
                <Nav.Link as={NavLink} to="/admin" onClick={handleNavItemClick}>
                  Налаштування
                </Nav.Link>
              )}
            </Nav>

            {isAuthenticated ? (
              <Nav className="mt-4">
                <NavDropdown title={user?.email} id="user-nav-dropdown" align="end" className="w-100">
                  <NavDropdown.ItemText className="text-muted small">
                    Ви увійшли як
                    <br />
                    <strong>{user?.email}</strong>
                  </NavDropdown.ItemText>
                  <NavDropdown.Divider />
                  <NavDropdown.Item
                    onClick={() => {
                      handleNavItemClick();
                      logout();
                    }}
                    className="text-danger"
                  >
                    Вийти
                  </NavDropdown.Item>
                </NavDropdown>
              </Nav>
            ) : (
              <Nav className="mt-4">
                <Nav.Link
                  onClick={() => (handleNavItemClick(), (window.location.href = '/auth/callback'))}
                  className="text-light"
                >
                  Увійти
                </Nav.Link>
              </Nav>
            )}
          </Offcanvas.Body>
        </Navbar.Offcanvas>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;
