import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Header from '../Header';

// Mock contexts
const mockLogout = jest.fn();
const mockUser = {
  _id: '1',
  firstName: 'Amadou',
  lastName: 'Diallo',
  fullName: 'Amadou Diallo',
  email: 'amadou@test.com',
  role: { name: 'admin', displayName: 'Administrateur' },
};

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout,
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
      auth: () => ({ user: mockUser, accessToken: 'tok', isAuthenticated: true, isLoading: false }),
      ui: () => ({ pageTitle: 'Dashboard', breadcrumbs: [], sidebarCollapsed: false, sidebarOpen: false }),
    },
    middleware: (gd) => gd({ serializableCheck: false }),
  });

const renderHeader = () =>
  render(
    <Provider store={createStore()}>
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    </Provider>
  );

describe('Header', () => {
  it('renders without crashing', () => {
    renderHeader();
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('shows user name', () => {
    renderHeader();
    expect(screen.getByText(/Amadou/)).toBeInTheDocument();
  });

  it('shows user initials avatar', () => {
    renderHeader();
    expect(screen.getByText('AD')).toBeInTheDocument();
  });

  it('contains deconnexion option', () => {
    renderHeader();
    expect(screen.getByText('Deconnexion')).toBeInTheDocument();
  });

  it('contains profil link', () => {
    renderHeader();
    expect(screen.getByText('Mon profil')).toBeInTheDocument();
  });
});
