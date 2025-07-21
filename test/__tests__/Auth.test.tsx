import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Auth from '@/pages/Auth';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOtp: vi.fn(), // Not directly used in Auth.tsx, but good to mock if it's a common auth method
      verifyOtp: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
  },
}));

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    profile: null,
    loading: false,
    signInWithGoogleForAdmin: vi.fn(),
  })),
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

describe('Auth Page', () => {
  const mockToast = vi.fn();
  const mockSignInWithGoogleForAdmin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue({ toast: mockToast });
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      signInWithGoogleForAdmin: mockSignInWithGoogleForAdmin,
    });
  });

  const renderAuthPage = () => {
    render(
      <MemoryRouter initialEntries={['/auth']}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('should render Sign In and Sign Up tabs', () => {
    renderAuthPage();
    expect(screen.getByRole('tab', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Sign Up/i })).toBeInTheDocument();
  });

  it('should switch between Sign In and Sign Up tabs', async () => {
    renderAuthPage();
    await userEvent.click(screen.getByRole('tab', { name: /Sign Up/i }));
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Password/i)).toBeInTheDocument(); // Password field is common

    await userEvent.click(screen.getByRole('tab', { name: /Sign In/i }));
    expect(screen.queryByLabelText(/Full Name/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  describe('Sign In Tab', () => {
    it('should display validation errors for empty fields', async () => {
      renderAuthPage();
      await userEvent.click(screen.getByRole('button', { name: /Sign In/i }));

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
      expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('should call signInWithPassword on successful submission', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ data: { user: { id: '123' } as any, session: {} as any }, error: null });

      renderAuthPage();
      await userEvent.type(screen.getByLabelText(/Email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/Password/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /Sign In/i }));

      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success' }));
      });
    });

    it('should display error for invalid credentials', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ data: { user: null, session: null }, error: { message: 'Invalid login credentials' } as any });

      renderAuthPage();
      await userEvent.type(screen.getByLabelText(/Email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/Password/i), 'wrongpass');
      await userEvent.click(screen.getByRole('button', { name: /Sign In/i }));

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
      });
    });

    it('should display error for unconfirmed email', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ data: { user: null, session: null }, error: { message: 'Email not confirmed' } as any });

      renderAuthPage();
      await userEvent.type(screen.getByLabelText(/Email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/Password/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /Sign In/i }));

      await waitFor(() => {
        expect(screen.getByText('Please check your email and click the confirmation link before signing in')).toBeInTheDocument();
      });
    });

    it('should call signInWithGoogleForAdmin when Google button is clicked', async () => {
      renderAuthPage();
      await userEvent.click(screen.getByRole('button', { name: /Google/i }));
      expect(mockSignInWithGoogleForAdmin).toHaveBeenCalledTimes(1);
    });
  });

  describe('Sign Up Tab', () => {
    beforeEach(async () => {
      renderAuthPage();
      await userEvent.click(screen.getByRole('tab', { name: /Sign Up/i }));
    });

    it('should display validation errors for empty fields', async () => {
      await userEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      await waitFor(() => {
        expect(screen.getByText('Full Name is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
        expect(screen.getByText('Confirm Password is required')).toBeInTheDocument();
      });
      expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });

    it('should display error for password mismatch', async () => {
      await userEvent.type(screen.getByLabelText(/Password/i), 'password123');
      await userEvent.type(screen.getByLabelText(/Confirm Password/i), 'different');
      await userEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      await waitFor(() => {
        expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
      });
      expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });

    it('should display error for weak password', async () => {
      await userEvent.type(screen.getByLabelText(/Password/i), 'short');
      await userEvent.type(screen.getByLabelText(/Confirm Password/i), 'short');
      await userEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
      });
      expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });

    it('should call signUp on successful submission and display success message', async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValue({ data: { user: { id: '123' } as any }, error: null });

      await userEvent.type(screen.getByLabelText(/Full Name/i), 'Test User');
      await userEvent.type(screen.getByLabelText(/Email/i), 'signup@example.com');
      await userEvent.type(screen.getByLabelText(/Password/i), 'securepassword');
      await userEvent.type(screen.getByLabelText(/Confirm Password/i), 'securepassword');
      await userEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      await waitFor(() => {
        expect(supabase.auth.signUp).toHaveBeenCalledWith(expect.objectContaining({
          email: 'signup@example.com',
          password: 'securepassword',
          options: { emailRedirectTo: expect.any(String), data: { full_name: 'Test User' } },
        }));
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Account created!' }));
        expect(screen.getByLabelText(/Full Name/i)).toHaveValue(''); // Form cleared
      });
    });

    it('should display error if email already exists', async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValue({ data: { user: null }, error: { message: 'User already registered' } as any });

      await userEvent.type(screen.getByLabelText(/Full Name/i), 'Test User');
      await userEvent.type(screen.getByLabelText(/Email/i), 'existing@example.com');
      await userEvent.type(screen.getByLabelText(/Password/i), 'password123');
      await userEvent.type(screen.getByLabelText(/Confirm Password/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      await waitFor(() => {
        expect(screen.getByText('An account with this email already exists. Please sign in instead.')).toBeInTheDocument();
      });
    });

    it('should display generic error for unexpected sign up failure', async () => {
      vi.mocked(supabase.auth.signUp).mockRejectedValue(new Error('Unexpected error'));

      await userEvent.type(screen.getByLabelText(/Full Name/i), 'Test User');
      await userEvent.type(screen.getByLabelText(/Email/i), 'unexpected@example.com');
      await userEvent.type(screen.getByLabelText(/Password/i), 'password123');
      await userEvent.type(screen.getByLabelText(/Confirm Password/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
      });
    });
  });
});
