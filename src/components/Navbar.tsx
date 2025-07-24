import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import {
  Navbar,
  Nav,
  Container,
  Offcanvas,
  Spinner,
  NavDropdown,
} from 'react-bootstrap';
import classNames from 'classnames';

const NavigationBar = () => {
  const { user, logout, isAuthenticated, isLoading } = useAuth();

  const linkClassName = ({ isActive }: { isActive: boolean }) =>
    classNames('nav-link', { active: isActive });

  if (isLoading) {
    return (
      <Navbar bg="dark" variant="dark" className="mb-3">
        <Container>
          <Navbar.Text className="text-light">
            <Spinner animation="border" size="sm" className="me-2" /> Loading...
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
        <Navbar.Toggle aria-controls="offcanvasNavbar" />
        <Navbar.Offcanvas
          id="offcanvasNavbar"
          aria-labelledby="offcanvasNavbarLabel"
          placement="end"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title id="offcanvasNavbarLabel">Menu</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Nav className="justify-content-end flex-grow-1 pe-3">
              <NavLink to="/" end className={linkClassName}>
                Dashboard
              </NavLink>
              <NavLink to="/meters" className={linkClassName}>
                Meters
              </NavLink>
              <NavLink to="/pmcs" className={linkClassName}>
                PMCS
              </NavLink>
              {user?.role === 'admin' && (
                <NavLink to="/admin" className={linkClassName}>
                  Admin
                </NavLink>
              )}
            </Nav>

            {isAuthenticated && (
              <Nav className="mt-4">
                <NavDropdown
                  title={user?.email}
                  id="user-nav-dropdown"
                  align="end"
                  className="w-100"
                >
                  <NavDropdown.ItemText className="text-muted small">
                    Signed in as<br />
                    <strong>{user?.email}</strong>
                  </NavDropdown.ItemText>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={logout}>Logout</NavDropdown.Item>
                </NavDropdown>
              </Nav>
            )}
          </Offcanvas.Body>
        </Navbar.Offcanvas>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;
