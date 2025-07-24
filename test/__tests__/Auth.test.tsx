import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Auth from '@/pages/Auth';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Mocks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    MemoryRouter: actual.MemoryRouter,
  };
});

describe('Auth Page', () => {
  const mockSignInWithPassword = vi.fn();
  const mockSignInWithGoogle = vi.fn();
  const mockSignUp = vi.fn();
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useAuth as vi.Mock).mockReturnValue({
    signInWithPasswordForAdmin: mockSignInWithPassword,
    signInWithGoogleForAdmin: mockSignInWithGoogle,
    signUp: mockSignUp,
  });

    (useToast as vi.Mock).mockReturnValue({ toast: mockToast });
  });

  const renderComponent = () => {
    render(
      <MemoryRouter initialEntries={['/auth']}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders the sign-in and sign-up tabs', () => {
    renderComponent();
    expect(screen.getByRole('tab', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /sign up/i })).toBeInTheDocument();
  });

  describe('Sign-In Form', () => {
    it('shows validation errors for empty fields', async () => {
      renderComponent();
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      expect(await screen.findByText('Email is required')).toBeInTheDocument();
      expect(await screen.findByText('Password is required')).toBeInTheDocument();
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });

    it('calls signInWithPassword with correct credentials on submit', async () => {
      renderComponent();
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
      });
    });

    it('displays an error message for invalid credentials', async () => {
      mockSignInWithPassword.mockRejectedValue(new Error('Invalid login credentials'));
      renderComponent();

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'wrong-password');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  describe('Sign-Up Form', () => {
    beforeEach(async () => {
      renderComponent();
      await userEvent.click(screen.getByRole('tab', { name: /sign up/i }));
    });

    it('shows validation errors for empty fields', async () => {
      await userEvent.click(screen.getByRole('button', { name: /create account/i }));

      expect(await screen.findByText('Full Name is required')).toBeInTheDocument();
      expect(await screen.findByText('Email is required')).toBeInTheDocument();
      expect(await screen.findByText('Password is required')).toBeInTheDocument();
      expect(await screen.findByText('Confirm Password is required')).toBeInTheDocument();
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('shows an error for mismatched passwords', async () => {
      await userEvent.type(screen.getByLabelText(/full name/i), 'Test User');
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'password456');
      await userEvent.click(screen.getByRole('button', { name: /create account/i }));

      expect(await screen.findByText("Passwords don't match")).toBeInTheDocument();
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('calls signUp with correct data on successful submission', async () => {
      mockSignUp.mockResolvedValue({ data: { user: {} }, error: null });
      await userEvent.type(screen.getByLabelText(/full name/i), 'Test User');
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: 'Test User' },
          },
        });
      });
    });

    it('shows a toast notification on successful sign-up', async () => {
      mockSignUp.mockResolvedValue({ data: { user: {} }, error: null });
      await userEvent.type(screen.getByLabelText(/full name/i), 'Test User');
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Account created!',
          description: 'Please check your email to confirm your account before signing in.',
        });
      });
    });
  });

  describe('Google Sign-In', () => {
    it('calls signInWithGoogle when the Google button is clicked', async () => {
      renderComponent();
      await userEvent.click(screen.getByRole('button', { name: /google/i }));
      expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
    });
  });
});