import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Sidebar from '../Sidebar';

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { _id: '1', firstName: 'Test', role: { name: 'admin' } },
    hasPermission: () => true,
    hasRole: () => true,
  }),
}));

const createStore = (collapsed = false) =>
  configureStore({
    reducer: {
      auth: () => ({ user: { _id: '1', firstName: 'Test' }, accessToken: 'tok', isAuthenticated: true }),
      ui: () => ({ sidebarCollapsed: collapsed, sidebarOpen: false }),
    },
    middleware: (gd) => gd({ serializableCheck: false }),
  });

const renderSidebar = (collapsed = false) =>
  render(
    <Provider store={createStore(collapsed)}>
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    </Provider>
  );

describe('Sidebar', () => {
  it('renders without crashing', () => {
    renderSidebar();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('shows brand name', () => {
    renderSidebar();
    expect(screen.getByText('ERP Senegal')).toBeInTheDocument();
  });

  it('shows navigation links', () => {
    renderSidebar();
    expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
    expect(screen.getByText('Clients')).toBeInTheDocument();
    expect(screen.getByText('Produits')).toBeInTheDocument();
    expect(screen.getByText('Factures')).toBeInTheDocument();
  });

  it('shows section headers', () => {
    renderSidebar();
    expect(screen.getByText('COMMERCIAL')).toBeInTheDocument();
    expect(screen.getByText('VENTES')).toBeInTheDocument();
    expect(screen.getByText('FINANCE')).toBeInTheDocument();
  });

  it('shows admin section for admin role', () => {
    renderSidebar();
    expect(screen.getByText('Utilisateurs')).toBeInTheDocument();
    expect(screen.getByText('Parametres')).toBeInTheDocument();
  });

  it('hides labels when collapsed', () => {
    renderSidebar(true);
    expect(screen.queryByText('ERP Senegal')).not.toBeInTheDocument();
    expect(screen.queryByText('Tableau de bord')).not.toBeInTheDocument();
  });
});
