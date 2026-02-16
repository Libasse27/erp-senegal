import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  FiHome,
  FiUsers,
  FiTruck,
  FiPackage,
  FiShoppingCart,
  FiFileText,
  FiDollarSign,
  FiBookOpen,
  FiBarChart2,
  FiSettings,
  FiChevronLeft,
  FiBox,
} from 'react-icons/fi';
import {
  selectSidebarCollapsed,
  toggleSidebarCollapsed,
  selectSidebarOpen,
} from '../../redux/slices/uiSlice';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { section: 'PRINCIPAL' },
  { path: '/', label: 'Tableau de bord', icon: FiHome },

  { section: 'COMMERCIAL' },
  { path: '/clients', label: 'Clients', icon: FiUsers, permission: 'clients:read' },
  { path: '/fournisseurs', label: 'Fournisseurs', icon: FiTruck, permission: 'suppliers:read' },
  { path: '/produits', label: 'Produits', icon: FiPackage, permission: 'products:read' },
  { path: '/stocks', label: 'Stocks', icon: FiBox, permission: 'products:read' },

  { section: 'VENTES' },
  { path: '/devis', label: 'Devis', icon: FiFileText, permission: 'quotes:read' },
  { path: '/commandes', label: 'Commandes', icon: FiShoppingCart, permission: 'invoices:read' },
  { path: '/factures', label: 'Factures', icon: FiFileText, permission: 'invoices:read' },

  { section: 'FINANCE' },
  { path: '/paiements', label: 'Paiements', icon: FiDollarSign, permission: 'payments:read' },
  { path: '/comptabilite', label: 'Comptabilite', icon: FiBookOpen, permission: 'journal:read' },

  { section: 'ANALYSE' },
  { path: '/rapports', label: 'Rapports', icon: FiBarChart2, permission: 'reports:read' },

  { section: 'SYSTEME' },
  { path: '/admin', label: 'Administration', icon: FiSettings, roles: ['admin'] },
];

const Sidebar = () => {
  const dispatch = useDispatch();
  const collapsed = useSelector(selectSidebarCollapsed);
  const isOpen = useSelector(selectSidebarOpen);
  const { hasPermission, hasRole } = useAuth();

  const shouldShowItem = (item) => {
    if (item.permission && !hasPermission(item.permission)) return false;
    if (item.roles && !hasRole(...item.roles)) return false;
    return true;
  };

  return (
    <nav className={`sidebar ${collapsed ? 'collapsed' : ''} ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        {!collapsed && <h5>ERP Senegal</h5>}
        <button
          className="btn btn-link text-white ms-auto p-0"
          onClick={() => dispatch(toggleSidebarCollapsed())}
          title={collapsed ? 'Ouvrir le menu' : 'Reduire le menu'}
        >
          <FiChevronLeft
            size={20}
            style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: '0.3s' }}
          />
        </button>
      </div>

      <div className="sidebar-nav">
        {navItems.map((item, index) => {
          if (item.section) {
            if (collapsed) return null;
            return (
              <div key={`section-${index}`} className="nav-section">
                {item.section}
              </div>
            );
          }

          if (!shouldShowItem(item)) return null;

          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : ''}
            >
              <span className="nav-icon">
                <Icon size={18} />
              </span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default Sidebar;
