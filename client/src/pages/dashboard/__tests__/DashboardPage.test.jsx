import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from '../../../redux/api/apiSlice';
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

jest.mock('../../../contexts/SocketContext', () => ({
  useSocket: () => ({ socket: null, isConnected: false, subscribe: jest.fn(), unsubscribe: jest.fn() }),
}));

jest.mock('../../../contexts/NotificationContext', () => ({
  useNotifications: () => ({ notifications: [], unreadCount: 0, markAsRead: jest.fn(), markAllAsRead: jest.fn() }),
}));

const mockStatsData = {
  data: {
    success: true,
    data: {
      caDuMois: 15000000,
      clientsActifs: 50,
      facturesImpayees: 12,
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

const emptyQuery = () => ({ data: undefined, isLoading: false, isError: false });

jest.mock('../../../redux/api/dashboardApi', () => ({
  useGetDashboardStatsQuery: () => mockStatsData,
  useGetDashboardChartsQuery: emptyQuery,
  useGetDashboardTopClientsQuery: emptyQuery,
  useGetDashboardStockAlertsQuery: emptyQuery,
  useGetDashboardKpisQuery: emptyQuery,
  useGetDashboardTopProductsQuery: emptyQuery,
  useGetDashboardStockEvolutionQuery: emptyQuery,
  useGetDashboardRecouvrementQuery: emptyQuery,
  useGetDashboardCashflowQuery: emptyQuery,
  useGetDashboardFunnelQuery: emptyQuery,
  useGetDashboardPeriodeQuery: emptyQuery,
  useGetDashboardComparaisonQuery: emptyQuery,
}));

jest.mock('../../../redux/api/saasApi', () => ({
  useGetUsageSaasQuery: () => ({ data: undefined, isLoading: false }),
}));

const createStore = () =>
  configureStore({
    reducer: {
      auth: () => ({ user: { _id: '1', firstName: 'Test' }, accessToken: 'tok', isAuthenticated: true }),
      ui: () => ({ pageTitle: 'Dashboard', breadcrumbs: [] }),
      [apiSlice.reducerPath]: apiSlice.reducer,
    },
    middleware: (gd) => gd({ serializableCheck: false }).concat(apiSlice.middleware),
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
