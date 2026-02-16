import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Dropdown from 'react-bootstrap/Dropdown';
import Badge from 'react-bootstrap/Badge';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import { FiMenu, FiBell, FiUser, FiLogOut, FiSettings } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { toggleSidebar, selectPageTitle, selectBreadcrumbs } from '../../redux/slices/uiSlice';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const pageTitle = useSelector(selectPageTitle);
  const breadcrumbs = useSelector(selectBreadcrumbs);
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="main-header">
      <button
        className="btn btn-link text-dark d-lg-none me-3 p-0"
        onClick={() => dispatch(toggleSidebar())}
      >
        <FiMenu size={24} />
      </button>

      <div className="flex-grow-1">
        {breadcrumbs.length > 0 && (
          <Breadcrumb className="mb-0">
            {breadcrumbs.map((crumb, index) => (
              <Breadcrumb.Item
                key={index}
                href={crumb.path}
                active={index === breadcrumbs.length - 1}
              >
                {crumb.label}
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
        )}
        <span className="fw-semibold d-none d-md-inline">{pageTitle}</span>
      </div>

      <div className="d-flex align-items-center gap-3">
        {/* Notifications */}
        <Dropdown align="end">
          <Dropdown.Toggle variant="link" className="text-dark p-0 position-relative">
            <FiBell size={20} />
            {unreadCount > 0 && (
              <Badge
                bg="danger"
                pill
                className="position-absolute top-0 start-100 translate-middle"
                style={{ fontSize: '0.6rem' }}
              >
                {unreadCount}
              </Badge>
            )}
          </Dropdown.Toggle>
          <Dropdown.Menu style={{ minWidth: '300px' }}>
            <Dropdown.Header>Notifications</Dropdown.Header>
            <Dropdown.Item className="text-muted text-center py-3">
              Aucune nouvelle notification
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

        {/* User menu */}
        <Dropdown align="end">
          <Dropdown.Toggle variant="link" className="text-dark text-decoration-none d-flex align-items-center gap-2 p-0">
            <div
              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
              style={{ width: 32, height: 32, fontSize: '0.8rem' }}
            >
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <span className="d-none d-md-inline">{user?.fullName || user?.firstName}</span>
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Header>
              {user?.fullName}
              <br />
              <small className="text-muted">{user?.role?.displayName}</small>
            </Dropdown.Header>
            <Dropdown.Divider />
            <Dropdown.Item onClick={() => navigate('/profil')}>
              <FiUser className="me-2" /> Mon profil
            </Dropdown.Item>
            <Dropdown.Item onClick={() => navigate('/admin/settings')}>
              <FiSettings className="me-2" /> Parametres
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleLogout} className="text-danger">
              <FiLogOut className="me-2" /> Deconnexion
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </header>
  );
};

export default Header;
