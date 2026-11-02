import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ProfilePage } from '../pages/ProfilePage';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import * as AuthContextModule from '../context/AuthContext';
import { AuthUser } from '../types';

describe('StayLocal Frontend Authentication & RBAC Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('LoginPage', () => {
    it('renders the login form with email, password, and submit controls', () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false,
        role: null,
        isHost: false,
        isGuide: false,
        isAdmin: false,
        isTourist: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { name: /Welcome Back/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Register here/i })).toBeInTheDocument();
    });

    it('displays error message when login fails with invalid credentials', async () => {
      const mockLogin = vi.fn().mockRejectedValue(new Error('Invalid email or password'));

      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false,
        role: null,
        isHost: false,
        isGuide: false,
        isAdmin: false,
        isTourist: false,
        login: mockLogin,
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/Email Address/i), {
        target: { value: 'traveler@staylocal.org' },
      });
      fireEvent.change(screen.getByLabelText(/^Password/i), {
        target: { value: 'WrongPassword123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

      await waitFor(() => {
        expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument();
      });
    });
  });

  describe('RegisterPage', () => {
    it('renders role selectors (tourist, host, guide) and NEVER presents admin role option', () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false,
        role: null,
        isHost: false,
        isGuide: false,
        isAdmin: false,
        isTourist: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      );

      // Verify legitimate public roles exist
      expect(screen.getByText('Conscious Traveler')).toBeInTheDocument();
      expect(screen.getByText('Homestay Host')).toBeInTheDocument();
      expect(screen.getByText('Cultural / Trekking Guide')).toBeInTheDocument();

      // STRICT SECURITY REQUIREMENT: No admin role option visible
      expect(screen.queryByText(/Administrator/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/^Admin$/i)).not.toBeInTheDocument();

      // Form inputs
      expect(screen.getByLabelText(/Full Name \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password \*/i)).toBeInTheDocument();
    });

    it('enforces minimum password length validation', async () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false,
        role: null,
        isHost: false,
        isGuide: false,
        isAdmin: false,
        isTourist: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/Full Name \*/i), {
        target: { value: 'Sunita Devi' },
      });
      fireEvent.change(screen.getByLabelText(/Email Address \*/i), {
        target: { value: 'sunita@sarmoli.org' },
      });
      fireEvent.change(screen.getByLabelText(/Password \*/i), {
        target: { value: 'short' }, // < 8 characters
      });

      const submitButton = screen.getByRole('button', { name: /Register as Traveler/i });
      fireEvent.submit(submitButton.closest('form')!);

      await waitFor(() => {
        expect(
          screen.getByText(/Password must be at least 8 characters long/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('ProtectedRoute and RBAC Enforcement', () => {
    it('shows loading state while session verification is in-flight', () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        user: null,
        loading: true,
        error: null,
        isAuthenticated: false,
        role: null,
        isHost: false,
        isGuide: false,
        isAdmin: false,
        isTourist: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Secured Himalayan Secret</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText(/Verifying Himalayan Session/i)).toBeInTheDocument();
      expect(screen.queryByText(/Secured Himalayan Secret/i)).not.toBeInTheDocument();
    });

    it('blocks access and displays 403 Access Restricted when user role does not match required roles', () => {
      const mockTouristUser: AuthUser = {
        id: 'usr_tourist_123',
        fullName: 'Arjun Sen',
        email: 'arjun@example.com',
        role: 'tourist',
        status: 'active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        user: mockTouristUser,
        loading: false,
        error: null,
        isAuthenticated: true,
        role: 'tourist',
        isHost: false,
        isGuide: false,
        isAdmin: false,
        isTourist: true,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      render(
        <MemoryRouter>
          <ProtectedRoute allowedRoles={['host', 'admin']}>
            <div>Restricted Host Management Console</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText(/Access Restricted/i)).toBeInTheDocument();
      expect(screen.getByText(/host or admin/i)).toBeInTheDocument();
      expect(screen.queryByText(/Restricted Host Management Console/i)).not.toBeInTheDocument();
    });

    it('grants access when user has the authorized role', () => {
      const mockHostUser: AuthUser = {
        id: 'usr_host_456',
        fullName: 'Mohan Rawat',
        email: 'mohan@munsiari.org',
        role: 'host',
        status: 'active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        user: mockHostUser,
        loading: false,
        error: null,
        isAuthenticated: true,
        role: 'host',
        isHost: true,
        isGuide: false,
        isAdmin: false,
        isTourist: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      render(
        <MemoryRouter>
          <ProtectedRoute allowedRoles={['host']}>
            <div>Authorized Host Management Console</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText(/Authorized Host Management Console/i)).toBeInTheDocument();
    });
  });

  describe('ProfilePage', () => {
    it('renders host-specific workspace details for host role', () => {
      const mockHostUser: AuthUser = {
        id: 'usr_host_789',
        fullName: 'Kishan Chand',
        email: 'kishan@bageshwar.org',
        role: 'host',
        status: 'active',
        createdAt: '2026-03-15T00:00:00.000Z',
        updatedAt: '2026-03-15T00:00:00.000Z',
      };

      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        user: mockHostUser,
        loading: false,
        error: null,
        isAuthenticated: true,
        role: 'host',
        isHost: true,
        isGuide: false,
        isAdmin: false,
        isTourist: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      render(
        <MemoryRouter>
          <ProfilePage />
        </MemoryRouter>
      );

      expect(
        screen.getByRole('heading', { level: 1, name: 'Kishan Chand' })
      ).toBeInTheDocument();
      expect(screen.getByText('Homestay Host Portal')).toBeInTheDocument();
      expect(screen.getByText(/Uttarakhand Homestay Scheme Standards/i)).toBeInTheDocument();
    });
  });
});
