import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Layout from '../Layout';

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { _id: '1', firstName: 'Test', lastName: 'User', fullName: 'Test User', role: { name: 'admin', displayName: 'Admin' } },
    logout: jest.fn(),
    hasPermission: () => true,
    hasRole: () => true,
  }),
}));

jest.mock('../../../contexts/SocketContext', () => ({
  useSocket: () => ({ socket: null, isConnected: false, subscribe: jest.fn(), unsubscribe: jest.fn() }),
}));

jest.mock('../../../contexts/NotificationContext', () => ({
  useNotifications: () => ({ notifications: [], unreadCount: 0, markAsRead: jest.fn(), markAllAsRead: jest.fn(), clearAll: jest.fn() }),
}));

jest.mock('../../../redux/api/notificationsApi', () => ({
  useGetNotificationsQuery: () => ({ data: { data: [] }, isLoading: false }),
  useGetUnreadCountQuery: () => ({ data: { data: { count: 0 } }, isLoading: false }),
  useMarkAsReadMutation: () => [jest.fn()],
  useMarkAllAsReadMutation: () => [jest.fn()],
}));

const createStore = () =>
  configureStore({
    reducer: {
      auth: () => ({ user: { _id: '1', firstName: 'Test' }, accessToken: 'tok', isAuthenticated: true }),
      ui: () => ({ pageTitle: 'Test', breadcrumbs: [], sidebarCollapsed: false, sidebarOpen: false }),
    },
    middleware: (gd) => gd({ serializableCheck: false }),
  });

const TestChild = () => <div data-testid="child-content">Page Content</div>;

const renderLayout = () =>
  render(
    <Provider store={createStore()}>
      <MemoryRouter initialEntries={['/test']}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/test" element={<TestChild />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>
  );

describe('Layout', () => {
  it('renders without crashing', () => {
    renderLayout();
    expect(document.querySelector('.app-wrapper')).toBeInTheDocument();
  });

  it('renders child content via Outlet', () => {
    renderLayout();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Page Content')).toBeInTheDocument();
  });

  it('contains sidebar navigation', () => {
    renderLayout();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('contains header', () => {
    renderLayout();
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('has main content area', () => {
    renderLayout();
    expect(document.querySelector('.main-content')).toBeInTheDocument();
  });
});
