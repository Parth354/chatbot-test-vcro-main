import { expect, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    MemoryRouter: actual.MemoryRouter,
    Routes: actual.Routes,
    Route: actual.Route,
  };
});

import { MemoryRouter, Routes, Route } from 'react-router-dom';
vi.mock('../../src/hooks/useAuth', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    AuthProvider: actual.AuthProvider,
    useAuth: actual.useAuth,
  };
});

import { AuthProvider, useAuth } from '../../src/hooks/useAuth';
import { supabase } from '../../src/integrations/supabase/client';

// Mock supabase.auth methods
vi.mock('../../src/integrations/supabase/client', async (importOriginal) => {
  const actual = await importOriginal();
  let authStateChangeCallback: Function | null = null;

  const mockSupabase = {
    ...actual.supabase,
    auth: {
      ...actual.supabase.auth,
      signInWithOAuth: vi.fn((options) => {
        let userToReturn;
        if (options.provider === 'google') {
          if (options.options?.redirectTo?.includes('/admin')) {
            userToReturn = mockAdminUser;
          } else {
            userToReturn = mockUser;
          }
        } else {
          userToReturn = mockUser;
        }
        const session = { user: userToReturn, access_token: 'mock-token', refresh_token: 'mock-refresh', expires_in: 3600 };
        if (authStateChangeCallback) {
          authStateChangeCallback('SIGNED_IN', session);
        }
        return Promise.resolve({ data: { user: userToReturn, session }, error: null });
      }),
      signOut: vi.fn(() => {
        if (authStateChangeCallback) {
          authStateChangeCallback('SIGNED_OUT', null);
        }
        return Promise.resolve({ error: null });
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
        eq: vi.fn((column, value) => {
          if (column === 'user_id') {
            if (value === mockAdminUser.id) {
              return {
                maybeSingle: vi.fn().mockResolvedValue({ data: mockAdminProfile, error: null }),
                single: vi.fn().mockResolvedValue({ data: mockAdminProfile, error: null }),
              };
            } else if (value === mockUser.id) {
              return {
                maybeSingle: vi.fn().mockResolvedValue({ data: mockUserProfile, error: null }),
                single: vi.fn().mockResolvedValue({ data: mockUserProfile, error: null }),
              };
            }
          }
          return {
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
    })),
  };

  return {
    supabase: mockSupabase,
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

// Helper to render component wrapped in AuthProvider
const renderWithAuthProvider = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <AuthProvider navigate={vi.fn()}> {/* Mock navigate */}
        <Routes>
          <Route path="*" element={ui} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
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
    // Reset getSession mock for each test to control initial state
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });
    // Reset profile fetch mock for each test
    vi.mocked(supabase.from).mockImplementation((tableName) => {
      if (tableName === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((column, value) => {
              if (column === 'user_id') {
                if (value === mockAdminUser.id) {
                  return {
                    maybeSingle: vi.fn().mockResolvedValue({ data: mockAdminProfile, error: null }),
                    single: vi.fn().mockResolvedValue({ data: mockAdminProfile, error: null }),
                  };
                } else if (value === mockUser.id) {
                  return {
                    maybeSingle: vi.fn().mockResolvedValue({ data: mockUserProfile, error: null }),
                    single: vi.fn().mockResolvedValue({ data: mockUserProfile, error: null }),
                  };
                }
              }
              return {
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              };
            }),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({})),
          })),
        } as any;
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({})),
        })),
      } as any;
    });
  });

  test('initial state is loading and no user', async () => {
    renderWithAuthProvider(<TestComponent />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Loaded')).toBeInTheDocument();
      expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
    });
  });

  test('AuthProvider provides user and profile if session exists initially', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({ data: { session: { user: mockAdminUser } as any }, error: null });
    vi.mocked(supabase.from('profiles').select().eq().maybeSingle).mockResolvedValueOnce({ data: mockAdminProfile, error: null });

    renderWithAuthProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent(mockAdminUser.email);
      expect(screen.getByTestId('profile-role')).toHaveTextContent('admin');
      expect(screen.getByText('Loaded')).toBeInTheDocument();
    });
  });

  test('signInWithGoogle correctly sets user and user role', async () => {
    vi.mocked(supabase.from('profiles').select().eq().maybeSingle).mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } }); // Profile not found
    vi.mocked(supabase.from('profiles').insert().select().single).mockResolvedValueOnce({ data: mockUserProfile, error: null }); // New profile created

    renderWithAuthProvider(<TestComponent />);

    const signInButton = screen.getByTestId('signin-google');
    await act(async () => {
      await userEvent.click(signInButton);
    });

    await waitFor(() => {
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(expect.objectContaining({ provider: 'google' }));
      expect(screen.getByTestId('user-email')).toHaveTextContent(mockUser.email);
      expect(screen.getByTestId('profile-role')).toHaveTextContent('user');
    });
  });

  test('signInWithGoogleForAdmin correctly sets user and admin role', async () => {
    vi.mocked(supabase.from('profiles').select().eq().maybeSingle).mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } }); // Profile not found
    vi.mocked(supabase.from('profiles').insert().select().single).mockResolvedValueOnce({ data: mockAdminProfile, error: null }); // New profile created

    renderWithAuthProvider(<TestComponent />);

    const adminSignInButton = screen.getByTestId('signin-google-admin');
    await act(async () => {
      await userEvent.click(adminSignInButton);
    });

    await waitFor(() => {
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(expect.objectContaining({ options: { redirectTo: expect.stringContaining('/admin') } }));
      expect(screen.getByTestId('user-email')).toHaveTextContent(mockAdminUser.email);
      expect(screen.getByTestId('profile-role')).toHaveTextContent('admin');
    });
  });

  test('signOut clears user and profile states', async () => {
    // Start with a logged-in user
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({ data: { session: { user: mockUser } as any }, error: null });
    vi.mocked(supabase.from('profiles').select().eq().maybeSingle).mockResolvedValueOnce({ data: mockUserProfile, error: null });

    renderWithAuthProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent(mockUser.email);
    });

    const signOutButton = screen.getByTestId('signout');
    await act(async () => {
      await userEvent.click(signOutButton);
    });

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
      expect(screen.queryByTestId('profile-role')).not.toBeInTheDocument();
      expect(screen.getByText('Loaded')).toBeInTheDocument(); // Still loaded, but no user
    });
  });

  test('profile role is updated if user role changes after login', async () => {
    // Simulate initial login as a regular user
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({ data: { session: { user: mockUser } as any }, error: null });
    vi.mocked(supabase.from('profiles').select().eq().maybeSingle).mockResolvedValueOnce({ data: mockUserProfile, error: null });

    renderWithAuthProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('profile-role')).toHaveTextContent('user');
    });

    // Simulate a change in profile role (e.g., admin upgrades user)
    await act(async () => {
      // Access the callback from the mock
      const onAuthStateChangeCallback = vi.mocked(supabase.auth.onAuthStateChange).mock.calls[0][0];
      onAuthStateChangeCallback('SIGNED_IN', { user: mockAdminUser, access_token: 'new-mock-token' });
    });

    await waitFor(() => {
      expect(screen.getByTestId('profile-role')).toHaveTextContent('admin');
    });
  });
});