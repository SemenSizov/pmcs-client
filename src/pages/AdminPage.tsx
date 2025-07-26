import { Nav, Dropdown } from 'react-bootstrap';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';

export default function AdminPage() {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const location = useLocation();
  const navigate = useNavigate();

  const routes = [
    { path: 'users', label: 'Користувачі' },
    { path: 'locations', label: 'Техніка' },
    { path: 'equipment-types', label: 'Типи обладнання' },
    { path: 'equipment-units', label: 'Обладнання' },
    { path: 'procedures', label: 'Регламентні процедури' },
  ];

  const currentPath = location.pathname.split('/').pop();

  return (
    <div className="container mt-4">
      {isMobile ? (
        <Dropdown className="mb-3">
          <Dropdown.Toggle variant="secondary" id="admin-dropdown" className="w-100 text-start">
            {routes.find((r) => r.path === currentPath)?.label || 'Меню'}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            {routes.map((route) => (
              <Dropdown.Item
                key={route.path}
                active={currentPath === route.path}
                onClick={() => navigate(route.path)}
              >
                {route.label}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      ) : (
        <Nav variant="tabs" className="mb-3">
          {routes.map((route) => (
            <Nav.Item key={route.path}>
              <Nav.Link as={NavLink} to={route.path}>
                {route.label}
              </Nav.Link>
            </Nav.Item>
          ))}
        </Nav>
      )}
      <Outlet />
    </div>
  );
}
