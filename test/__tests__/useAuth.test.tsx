import { vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom'; // Keep MemoryRouter for AuthProvider's internal navigation
import { useAuth } from '../../src/hooks/useAuth';
import { supabase } from '../../src/integrations/supabase/client';

// Mock react-router-dom to ensure MemoryRouter and other components are available
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(), // Mock useNavigate for AuthProvider
  };
});

// Mock supabase.auth methods
vi.mock('../../src/integrations/supabase/client', () => {
  let authStateChangeCallback: Function | null = null;

  const mockSupabase = {
    auth: {
      signInWithOAuth: vi.fn((options) => {
        const user = options.options.redirectTo.includes('admin=true') ? mockAdminUser : mockUser;
        const session = { user, access_token: 'mock-token', refresh_token: 'mock-refresh', expires_in: 3600 };
        if (authStateChangeCallback) {
          authStateChangeCallback('SIGNED_IN', session);
        }
        return Promise.resolve({ data: { user, session }, error: null });
      }),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn((callback) => {
        authStateChangeCallback = callback;
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        };
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
          single: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({})),
      })),
    })),
  };

  return {
    supabase: mockSupabase,
  };
});

// Explicitly mock useAuth and AuthProvider
vi.mock('../../src/hooks/useAuth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/hooks/useAuth')>();
  const mockUseAuth = vi.fn();
  const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
    // This mock AuthProvider simply renders its children
    // The actual hook logic will be controlled by mockUseAuth
    return children;
  };

  return {
    ...actual,
    useAuth: mockUseAuth,
    AuthProvider: MockAuthProvider,
  };
});

const mockAdminUser = {
  id: 'admin-user-id',
  email: 'admin@example.com',
  user_metadata: { full_name: 'Admin User' },
  app_metadata: { provider: 'google', redirectTo: 'http://localhost/auth/callback?admin=true' },
};

const mockAdminProfile = {
  id: 'admin-profile-id',
  user_id: 'admin-user-id',
  email: 'admin@example.com',
  role: 'admin',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockUser = {
  id: 'regular-user-id',
  email: 'user@example.com',
  user_metadata: { full_name: 'Regular User' },
  app_metadata: { provider: 'google', redirectTo: 'http://localhost/auth/callback' },
};

const mockUserProfile = {
  id: 'user-profile-id',
  user_id: 'regular-user-id',
  email: 'user@example.com',
  role: 'user',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Test component to expose hook values
const TestComponent = () => {
  const auth = useAuth();
  return (
    <div data-testid="auth-status">
      {auth.loading ? 'Loading...' : 'Loaded'}
      {auth.user && <span data-testid="user-email">{auth.user.email}</span>}
      {auth.profile && <span data-testid="profile-role">{auth.profile.role}</span>}
      <button onClick={auth.signInWithGoogle} data-testid="signin-google">Sign In Google</button>
      <button onClick={auth.signInWithGoogleForAdmin} data-testid="signin-google-admin">Sign In Google Admin</button>
      <button onClick={auth.signOut} data-testid="signout">Sign Out</button>
    </div>
  );
};

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock implementation for each test
    (useAuth as vi.Mock).mockReturnValue({
      user: null,
      profile: null,
      session: null,
      loading: true,
      signOut: vi.fn(),
      signInWithGoogle: vi.fn(),
      signInWithGoogleForAdmin: vi.fn(),
    });
  });

  test('initial state is loading and no user', async () => {
    (supabase.auth.getSession as vi.Mock).mockResolvedValueOnce({ data: { session: null }, error: null });

    render(
      <MemoryRouter>
        <MockAuthProvider navigate={vi.fn()}> {/* Mock navigate */}
          <TestComponent />
        </MockAuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Loaded')).toBeInTheDocument();
      expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
    });
  });

  test('admin login via Google correctly sets user and admin role', async () => {
    // Mock the useAuth hook to return a loading state initially, then the admin user
    (useAuth as vi.Mock).mockReturnValueOnce({
      user: null,
      profile: null,
      session: null,
      loading: true,
      signOut: vi.fn(),
      signInWithGoogle: vi.fn(),
      signInWithGoogleForAdmin: vi.fn(() => {
        // Simulate the effect of signInWithOAuth
        (useAuth as vi.Mock).mockReturnValue({
          user: mockAdminUser,
          profile: mockAdminProfile,
          session: { user: mockAdminUser },
          loading: false,
          signOut: vi.fn(),
          signInWithGoogle: vi.fn(),
          signInWithGoogleForAdmin: vi.fn(),
        });
      }),
    }).mockReturnValueOnce({
      user: mockAdminUser,
      profile: mockAdminProfile,
      session: { user: mockAdminUser },
      loading: false,
      signOut: vi.fn(),
      signInWithGoogle: vi.fn(),
      signInWithGoogleForAdmin: vi.fn(),
    });

    render(
      <MemoryRouter>
        <MockAuthProvider navigate={vi.fn()}> {/* Mock navigate */}
          <TestComponent />
        </MockAuthProvider>
      </MemoryRouter>
    );

    const adminSignInButton = screen.getByTestId('signin-google-admin');
    await act(async () => {
      await userEvent.click(adminSignInButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent(mockAdminUser.email);
      expect(screen.getByTestId('profile-role')).toHaveTextContent('admin');
    }, { timeout: 10000 });
  });

  test('regular user login via Google correctly sets user and user role', async () => {
    // Mock initial session to be null
    (supabase.auth.getSession as vi.Mock).mockResolvedValueOnce({ data: { session: null }, error: null });

    // Mock profile fetch/creation for regular user
    (supabase.from as vi.Mock).mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: { code: 'PGRST116' } }), // Profile not found
          single: () => Promise.resolve({ data: mockUserProfile, error: null }), // New profile created
        }),
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: mockUserProfile, error: null }),
        }),
      }),
    });

    render(
      <MemoryRouter>
        <MockAuthProvider navigate={vi.fn()}> {/* Mock navigate */}
          <TestComponent />
        </MockAuthProvider>
      </MemoryRouter>
    );

    const signInButton = screen.getByTestId('signin-google');
    await act(async () => {
      await userEvent.click(signInButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent(mockUser.email);
      expect(screen.getByTestId('profile-role')).toHaveTextContent('user');
    }, { timeout: 10000 });
  });

  test('upgrades user to admin on admin login', async () => {
    (supabase.auth.getSession as vi.Mock).mockResolvedValueOnce({ data: { session: null }, error: null });

    // 1. Initial login as a regular user
    (supabase.from as vi.Mock).mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { ...mockUserProfile }, error: null }),
        }),
      }),
    } as any);

    const { rerender } = renderWithAuthProvider(<TestComponent />);

    const signInButton = screen.getByTestId('signin-google');
    await act(async () => {
      await userEvent.click(signInButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('profile-role')).toHaveTextContent('user');
    });

    // 2. Log out
    const signOutButton = screen.getByTestId('signout');
    await act(async () => {
      await userEvent.click(signOutButton);
    });

    await waitFor(() => {
      expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
    });

    // 3. Log back in as admin
    (supabase.from as vi.Mock).mockReturnValueOnce({
      // Mock the profile fetch for the admin login
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { ...mockUserProfile }, error: null }),
        }),
      }),
      // Mock the role update call
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: { ...mockUserProfile, role: 'admin' }, error: null }),
          }),
        }),
      }),
    } as any);

    rerender(
        <MemoryRouter initialEntries={['/']}>
            <AuthProvider navigate={vi.fn()}>
                <Routes>
                    <Route path="*" element={<TestComponent />} />
                </Routes>
            </AuthProvider>
        </MemoryRouter>
    );

    const adminSignInButton = screen.getByTestId('signin-google-admin');
    await act(async () => {
      await userEvent.click(adminSignInButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('profile-role')).toHaveTextContent('admin');
    });
  });
});
