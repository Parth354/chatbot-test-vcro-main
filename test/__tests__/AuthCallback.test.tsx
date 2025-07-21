import { render, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AuthCallback from '@/pages/AuthCallback';
import { supabase } from '@/integrations/supabase/client';

// Mock react-router-dom
const mockUseNavigate = vi.fn();
const mockUseLocation = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockUseNavigate,
    useLocation: () => mockUseLocation(),
  };
});

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

describe('AuthCallback Page', () => {
  const originalWindowOpener = window.opener;
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNavigate.mockClear();
    mockUseLocation.mockClear();
    vi.mocked(supabase.auth.getSession).mockClear();

    // Reset window.opener for each test
    Object.defineProperty(window, 'opener', {
      writable: true,
      value: originalWindowOpener,
    });

    // Mock console.log and console.error to prevent noise during tests
    console.log = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    // Restore original console functions
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  it('should close window if chatbot=true and window.opener exists', async () => {
    mockUseLocation.mockReturnValue({ search: '?chatbot=true' });
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: {} as any }, error: null });
    Object.defineProperty(window, 'opener', {
      writable: true,
      value: { someProperty: true }, // Simulate window.opener existing
    });
    const windowCloseSpy = vi.spyOn(window, 'close').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(windowCloseSpy).toHaveBeenCalledTimes(1);
      expect(mockUseNavigate).not.toHaveBeenCalled();
    });
  });

  it('should not navigate if chatbot=true and window.opener does not exist', async () => {
    mockUseLocation.mockReturnValue({ search: '?chatbot=true' });
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: {} as any }, error: null });
    Object.defineProperty(window, 'opener', {
      writable: true,
      value: null,
    });
    const windowCloseSpy = vi.spyOn(window, 'close').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(windowCloseSpy).not.toHaveBeenCalled();
      expect(mockUseNavigate).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith("Chatbot login successful, but not in a popup. No main app navigation.");
    });
  });

  it('should navigate to / if chatbot param is not present', async () => {
    mockUseLocation.mockReturnValue({ search: '?' });
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: {} as any }, error: null });

    render(
      <MemoryRouter>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('should navigate to / if chatbot param is false', async () => {
    mockUseLocation.mockReturnValue({ search: '?chatbot=false' });
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: {} as any }, error: null });

    render(
      <MemoryRouter>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('should handle no session data gracefully', async () => {
    mockUseLocation.mockReturnValue({ search: '?' });
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });

    render(
      <MemoryRouter>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith('/');
    });
  });
});
