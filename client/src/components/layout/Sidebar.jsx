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
  FiCreditCard,
  FiDatabase,
  FiClipboard,
  FiLayers,
} from 'react-icons/fi';
import {
  selectSidebarCollapsed,
  toggleSidebarCollapsed,
  selectSidebarOpen,
} from '../../redux/slices/uiSlice';
import { useAuth } from '../../contexts/AuthContext';
import { PERM } from '../../config/permissions';

// Thème visuel par rôle
const ROLE_THEMES = {
  admin: {
    gradient: 'linear-gradient(160deg, #7f1d1d 0%, #1a0505 100%)',
    accent: '#f87171',
    label: 'Administrateur',
    icon: '🔐',
  },
  manager: {
    gradient: 'linear-gradient(160deg, #312e81 0%, #0f0b2e 100%)',
    accent: '#818cf8',
    label: 'Manager',
    icon: '👔',
  },
  comptable: {
    gradient: 'linear-gradient(160deg, #14532d 0%, #021f0d 100%)',
    accent: '#34d399',
    label: 'Comptable',
    icon: '💰',
  },
  commercial: {
    gradient: 'linear-gradient(160deg, #7c2d12 0%, #1c0700 100%)',
    accent: '#fb923c',
    label: 'Commercial',
    icon: '📈',
  },
  vendeur: {
    gradient: 'linear-gradient(160deg, #78350f 0%, #1a0f00 100%)',
    accent: '#fbbf24',
    label: 'Vendeur',
    icon: '🛒',
  },
  caissier: {
    gradient: 'linear-gradient(160deg, #164e63 0%, #031820 100%)',
    accent: '#22d3ee',
    label: 'Caissier',
    icon: '💳',
  },
  gestionnaire_stock: {
    gradient: 'linear-gradient(160deg, #4c1d95 0%, #130520 100%)',
    accent: '#a78bfa',
    label: 'Gestion Stock',
    icon: '📦',
  },
};

const DEFAULT_THEME = {
  gradient: 'linear-gradient(160deg, #2d3748 0%, #1e293b 100%)',
  accent: '#60a5fa',
  label: 'Utilisateur',
  icon: '👤',
};

const navItems = [
  { section: 'PRINCIPAL' },
  { path: '/', label: 'Tableau de bord', icon: FiHome },

  { section: 'COMMERCIAL' },
  { path: '/clients',       label: 'Clients',       icon: FiUsers,       permission: PERM.CLIENTS_READ },
  { path: '/fournisseurs',  label: 'Fournisseurs',  icon: FiTruck,       permission: PERM.FOURNISSEURS_READ },
  { path: '/produits',      label: 'Produits',      icon: FiPackage,     permission: PERM.PRODUITS_READ },
  { path: '/stocks',        label: 'Stocks',        icon: FiBox,         permission: PERM.STOCKS_READ },

  { section: 'VENTES' },
  { path: '/ventes/devis',      label: 'Devis',      icon: FiFileText,   permission: PERM.DEVIS_READ },
  { path: '/ventes/commandes',  label: 'Commandes',  icon: FiShoppingCart, permission: PERM.COMMANDES_READ },
  { path: '/ventes/factures',   label: 'Factures',   icon: FiClipboard,  permission: PERM.FACTURES_READ },

  { section: 'ACHATS' },
  { path: '/achats/commandes', label: 'Commandes fournisseurs', icon: FiShoppingCart, permission: PERM.CMD_FOURNISSEURS_READ },

  { section: 'FINANCE' },
  { path: '/paiements',                    label: 'Paiements',        icon: FiDollarSign, permission: PERM.PAIEMENTS_READ },
  { path: '/paiements/tresorerie',         label: 'Tresorerie',       icon: FiCreditCard, permission: PERM.PAIEMENTS_READ },
  { path: '/paiements/comptes-bancaires',  label: 'Comptes Bancaires',icon: FiDatabase,   permission: PERM.COMPTES_BANCAIRES_READ },

  { section: 'COMPTABILITE' },
  { path: '/comptabilite/plan',       label: 'Plan Comptable',      icon: FiLayers,   permission: PERM.COMPTABILITE_READ },
  { path: '/comptabilite/ecritures',  label: 'Ecritures',           icon: FiBookOpen, permission: PERM.ECRITURES_READ },
  { path: '/comptabilite/grand-livre',label: 'Grand Livre',         icon: FiBookOpen, permission: PERM.COMPTABILITE_READ },
  { path: '/comptabilite/balance',    label: 'Balance',             icon: FiBarChart2,permission: PERM.COMPTABILITE_READ },
  { path: '/comptabilite/resultat',   label: 'Compte de Resultat',  icon: FiBarChart2,permission: PERM.COMPTABILITE_READ },
  { path: '/comptabilite/bilan',      label: 'Bilan',               icon: FiBarChart2,permission: PERM.COMPTABILITE_READ },
  { path: '/comptabilite/exercices',  label: 'Exercices',           icon: FiSettings, permission: PERM.COMPTABILITE_READ },

  { section: 'ANALYSE' },
  { path: '/rapports', label: 'Rapports', icon: FiBarChart2, permission: PERM.RAPPORTS_READ },

  { section: 'SYSTEME' },
  { path: '/admin/utilisateurs', label: 'Utilisateurs',    icon: FiUsers,    roles: ['admin'] },
  { path: '/admin/entreprise',   label: 'Entreprise',      icon: FiHome,     roles: ['admin'] },
  { path: '/admin/parametres',   label: 'Parametres',      icon: FiSettings, roles: ['admin'] },
  { path: '/admin/audit',        label: "Journal d'Audit", icon: FiFileText, roles: ['admin'] },
];

const Sidebar = () => {
  const dispatch = useDispatch();
  const collapsed = useSelector(selectSidebarCollapsed);
  const isOpen = useSelector(selectSidebarOpen);
  const { user, hasPermission, hasRole } = useAuth();

  const roleName = user?.role?.name || '';
  const theme = ROLE_THEMES[roleName] || DEFAULT_THEME;

  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Utilisateur';

  const shouldShowItem = (item) => {
    if (item.permission && !hasPermission(item.permission)) return false;
    if (item.roles && !hasRole(...item.roles)) return false;
    return true;
  };

  return (
    <nav
      className={`sidebar ${collapsed ? 'collapsed' : ''} ${isOpen ? 'open' : ''}`}
      style={{
        '--sidebar-gradient': theme.gradient,
        '--sidebar-accent': theme.accent,
      }}
    >
      {/* Barre de titre */}
      <div className="sidebar-brand">
        {!collapsed && <span className="sidebar-app-name">ERP Sénégal</span>}
        <button
          className="btn btn-link text-white ms-auto p-0"
          onClick={() => dispatch(toggleSidebarCollapsed())}
          title={collapsed ? 'Ouvrir le menu' : 'Réduire le menu'}
        >
          <FiChevronLeft
            size={20}
            style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: '0.3s' }}
          />
        </button>
      </div>

      {/* Profil utilisateur */}
      <div className="sidebar-profile">
        <div
          className="sidebar-avatar"
          style={{ backgroundColor: theme.accent }}
          title={fullName}
        >
          {initials}
        </div>
        {!collapsed && (
          <div className="sidebar-profile-info">
            <span className="sidebar-profile-name">{fullName}</span>
            <span className="sidebar-profile-role" style={{ color: theme.accent }}>
              {theme.icon} {theme.label}
            </span>
          </div>
        )}
      </div>

      <div className="sidebar-divider" />

      {/* Navigation */}
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
