import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import DashboardPage from '../DashboardPage';

// Mock recharts to avoid canvas issues in jsdom
jest.mock('recharts', () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { _id: '1', firstName: 'Test', role: { name: 'admin' } },
    hasPermission: () => true,
    hasRole: () => true,
  }),
}));

jest.mock('../../../hooks/usePageTitle', () => () => null);

const mockStatsData = {
  data: {
    success: true,
    data: {
      chiffreAffaires: 15000000,
      totalClients: 50,
      facturesEnCours: 12,
      alertesStock: 5,
      facturesRecentes: [],
      paiementsRecents: [],
      ventesParMois: [],
      repartitionPaiements: [],
    },
  },
  isLoading: false,
  isError: false,
};

jest.mock('../../../redux/api/dashboardApi', () => ({
  useGetDashboardStatsQuery: () => mockStatsData,
}));

const createStore = () =>
  configureStore({
    reducer: {
      auth: () => ({ user: { _id: '1', firstName: 'Test' }, accessToken: 'tok', isAuthenticated: true }),
      ui: () => ({ pageTitle: 'Dashboard', breadcrumbs: [] }),
    },
    middleware: (gd) => gd({ serializableCheck: false }),
  });

const renderDashboard = () =>
  render(
    <Provider store={createStore()}>
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    </Provider>
  );

describe('DashboardPage', () => {
  it('renders without crashing', () => {
    renderDashboard();
    expect(document.querySelector('.stat-card')).toBeTruthy();
  });

  it('shows stat cards with formatted data', () => {
    renderDashboard();
    expect(screen.getByText(/15\s*000\s*000/)).toBeInTheDocument();
  });

  it('displays client count', () => {
    renderDashboard();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('displays factures en cours', () => {
    renderDashboard();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('displays stock alerts', () => {
    renderDashboard();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
