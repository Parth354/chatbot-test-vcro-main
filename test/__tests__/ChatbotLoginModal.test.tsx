import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Mock Alert and AlertDescription
vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children }: { children: React.ReactNode }) => <div role="alert">{children}</div>,
  AlertDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ChatbotLoginModal from '@/components/ChatbotLoginModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Mock supabase and useAuth
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithOtp: vi.fn(),
      verifyOtp: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    profile: null,
    loading: false,
    signInWithGoogle: vi.fn(),
  })),
}));

describe('ChatbotLoginModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset useAuth mock for each test
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      signInWithGoogle: vi.fn(),
    });
  });

  it('should not render when isOpen is false', async () => {
    await act(async () => {
      render(
        <ChatbotLoginModal
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );
    });
    expect(screen.queryByText('Login to Save Chat History')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <ChatbotLoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );
    expect(screen.getByText('Login to Save Chat History')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Login Code/i })).toBeInTheDocument();
  });

  it('should close the modal when close button is clicked', async () => {
    render(
      <ChatbotLoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /Close login modal/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should send OTP when email is submitted', async () => {
    vi.mocked(supabase.auth.signInWithOtp).mockImplementation(() => Promise.resolve({ data: { user: { id: 'test-user', email: 'test@example.com' }, session: {} as any }, error: null }));

    render(
      <ChatbotLoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await act(async () => {
      await userEvent.type(screen.getByLabelText('Email Address'), 'test@example.com');
      await userEvent.click(screen.getByRole('button', { name: /Send Login Code/i }));
    });

    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({ email: 'test@example.com' });
    await waitFor(() => {
      expect(screen.getByText('Check your email for the login code!')).toBeInTheDocument();
      expect(screen.getByLabelText('Enter Login Code')).toBeInTheDocument();
    });
  });

  it('should display error if email is empty on OTP send', async () => {
    render(
      <ChatbotLoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /Send Login Code/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Please enter your email');
    });
    expect(supabase.auth.signInWithOtp).not.toHaveBeenCalled();
  });

  it('should display error if signInWithOtp fails', async () => {
        vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({ data: { user: { id: 'test-user', email: 'test@example.com' }, session: {} as any }, error: null });

    render(
      <ChatbotLoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await userEvent.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await userEvent.click(screen.getByRole('button', { name: /Send Login Code/i }));

    await waitFor(() => {
      expect(screen.getByText('OTP send failed')).toBeInTheDocument();
    });
  });

  it('should verify OTP and call onSuccess on successful login', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({ data: { user: null, session: null }, error: null });
    vi.mocked(supabase.auth.verifyOtp).mockResolvedValue({ data: { user: mockUser, session: {} as any }, error: null });

    render(
      <ChatbotLoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await userEvent.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await userEvent.click(screen.getByRole('button', { name: /Send Login Code/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('Enter Login Code')).toBeInTheDocument();
    });

    await userEvent.type(screen.getByLabelText('Enter Login Code'), '123456');
    await userEvent.click(screen.getByRole('button', { name: /Verify & Login/i }));

    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({ email: 'test@example.com', token: '123456', type: 'email' });
    expect(mockOnSuccess).toHaveBeenCalledWith(mockUser);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should display error if OTP is empty on verify', async () => {
    vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({ data: { user: null, session: null }, error: null });

    render(
      <ChatbotLoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await userEvent.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await userEvent.click(screen.getByRole('button', { name: /Send Login Code/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('Enter Login Code')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /Verify & Login/i }));

    await waitFor(() => {
      expect(screen.getByText('Please enter both email and OTP')).toBeInTheDocument();
    });
    expect(supabase.auth.verifyOtp).not.toHaveBeenCalled();
  });

  it('should display error if verifyOtp fails', async () => {
    vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({ data: { user: null, session: null }, error: null });
    vi.mocked(supabase.auth.verifyOtp).mockResolvedValue({ data: { user: null, session: null }, error: { message: 'OTP verification failed' } as any });

    render(
      <ChatbotLoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await userEvent.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await userEvent.click(screen.getByRole('button', { name: /Send Login Code/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('Enter Login Code')).toBeInTheDocument();
    });

    await userEvent.type(screen.getByLabelText('Enter Login Code'), '123456');
    await userEvent.click(screen.getByRole('button', { name: /Verify & Login/i }));

    await waitFor(() => {
      expect(screen.getByText('OTP verification failed')).toBeInTheDocument();
    });
  });

  it('should call signInWithGoogle when Google button is clicked', async () => {
    const mockSignInWithGoogle = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      signInWithGoogle: mockSignInWithGoogle,
    });

    render(
      <ChatbotLoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /Sign In with Google/i }));
    expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
  });

  it('should automatically close and call onSuccess if user is already logged in', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      profile: { id: 'profile-123', user_id: 'user-123', email: 'test@example.com', role: 'user', created_at: '', updated_at: '' },
      loading: false,
      signInWithGoogle: vi.fn(),
    });

    render(
      <ChatbotLoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(mockUser);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});
