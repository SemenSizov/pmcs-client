import { Nav } from 'react-bootstrap';
import { NavLink, Outlet } from 'react-router-dom';

export default function AdminPage() {
  return (
    <div className="container mt-4">
      <Nav variant="tabs" className="mb-3">
        <Nav.Item>
          <Nav.Link as={NavLink} to="users">
            Користувачі
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={NavLink} to="locations">
            Техніка
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={NavLink} to="equipment-types">
            Типи обладнання
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={NavLink} to="equipment-units">
            Обладнання
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={NavLink} to="procedures">
            Регламентні процедури
          </Nav.Link>
        </Nav.Item>
      </Nav>
      <Outlet />
    </div>
  );
}
