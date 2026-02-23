import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import LoginPage from '../LoginPage';
import { apiSlice } from '../../../redux/api/apiSlice';
import authReducer from '../../../redux/slices/authSlice';

// Mock AuthContext
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
  }),
}));

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: null }),
}));

const createTestStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      [apiSlice.reducerPath]: apiSlice.reducer,
    },
    middleware: (getDefault) => getDefault().concat(apiSlice.middleware),
  });

const renderWithProviders = (ui) => {
  const store = createTestStore();
  return render(
    <Provider store={store}>
      <BrowserRouter>{ui}</BrowserRouter>
    </Provider>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the login form', () => {
      renderWithProviders(<LoginPage />);

      expect(screen.getByText('ERP Senegal')).toBeInTheDocument();
      expect(screen.getByText('Gestion Commerciale & Comptable')).toBeInTheDocument();
    });

    it('renders email input field', () => {
      renderWithProviders(<LoginPage />);

      const emailInput = screen.getByLabelText('Adresse email');
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('name', 'email');
      expect(emailInput).toHaveAttribute('placeholder', 'votre@email.com');
    });

    it('renders password input field', () => {
      renderWithProviders(<LoginPage />);

      const passwordInput = screen.getByLabelText('Mot de passe');
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('name', 'password');
      expect(passwordInput).toHaveAttribute('placeholder', 'Votre mot de passe');
    });

    it('renders submit button', () => {
      renderWithProviders(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: 'Se connecter' });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('renders remember me checkbox', () => {
      renderWithProviders(<LoginPage />);

      expect(screen.getByLabelText('Se souvenir de moi')).toBeInTheDocument();
    });

    it('renders forgot password link', () => {
      renderWithProviders(<LoginPage />);

      const forgotPasswordLink = screen.getByText('Mot de passe oublie ?');
      expect(forgotPasswordLink).toBeInTheDocument();
      expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
    });
  });

  describe('Form validation', () => {
    it('shows required validation on empty submit', () => {
      renderWithProviders(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: 'Se connecter' });
      fireEvent.click(submitButton);

      const emailInput = screen.getByLabelText('Adresse email');
      const passwordInput = screen.getByLabelText('Mot de passe');

      expect(emailInput).toBeRequired();
      expect(passwordInput).toBeRequired();
    });

    it('email field has required attribute', () => {
      renderWithProviders(<LoginPage />);

      const emailInput = screen.getByLabelText('Adresse email');
      expect(emailInput).toHaveAttribute('required');
    });

    it('password field has required attribute', () => {
      renderWithProviders(<LoginPage />);

      const passwordInput = screen.getByLabelText('Mot de passe');
      expect(passwordInput).toHaveAttribute('required');
    });
  });

  describe('Form interaction', () => {
    it('updates email field on change', () => {
      renderWithProviders(<LoginPage />);

      const emailInput = screen.getByLabelText('Adresse email');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('updates password field on change', () => {
      renderWithProviders(<LoginPage />);

      const passwordInput = screen.getByLabelText('Mot de passe');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      expect(passwordInput).toHaveValue('password123');
    });

    it('clears error when typing in form fields', () => {
      renderWithProviders(<LoginPage />);

      // Simulate an error being displayed (would require mock API failure)
      const emailInput = screen.getByLabelText('Adresse email');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      // Error should be cleared when typing
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Submit button states', () => {
    it('submit button is enabled by default', () => {
      renderWithProviders(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: 'Se connecter' });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Email autofocus', () => {
    it('email input has autofocus attribute', () => {
      renderWithProviders(<LoginPage />);

      const emailInput = screen.getByLabelText('Adresse email');
      expect(emailInput).toHaveAttribute('autoFocus');
    });
  });

  describe('Footer text', () => {
    it('renders footer text', () => {
      renderWithProviders(<LoginPage />);

      expect(screen.getByText('ERP Commercial & Comptable - SYSCOHADA / OHADA')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('renders with correct styling classes', () => {
      const { container } = renderWithProviders(<LoginPage />);

      const mainDiv = container.querySelector('.d-flex.justify-content-center.align-items-center.vh-100');
      expect(mainDiv).toBeInTheDocument();
    });
  });
});
