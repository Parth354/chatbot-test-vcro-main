import '@testing-library/jest-dom'
import { expect, vi } from 'vitest';

// Mock ResizeObserver
const ResizeObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
vi.stubGlobal('ResizeObserver', ResizeObserverMock);

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      })),
      getSession: vi.fn(() => Promise.resolve({
        data: {
          session: {
            user: { id: 'test-user-id', email: 'test@example.com' },
          },
        },
        error: null,
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockAgentData, error: null })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

// Mock router
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(() => vi.fn()),
  useParams: vi.fn(() => ({ agentId: 'test-id' })),
  useLocation: vi.fn(() => ({ pathname: '/test' })),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    isLoading: false,
  })),
}))

// Mock useToast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
    dismiss: vi.fn(),
    toasts: [],
  })),
}));

// Mock useChatbotEffects hook
vi.mock('@/hooks/useChatbotEffects', () => ({
  useChatbotEffects: vi.fn(() => ({
    setInternalChatbotData: vi.fn(),
    setLoadingChatbotData: vi.fn(),
    setMessages: vi.fn(),
    setIsExpanded: vi.fn(),
    setIsVisible: vi.fn(),
    setCurrentMessageIndex: vi.fn(),
    setChatHistory: vi.fn(),
    setIsBotTyping: vi.fn(),
    setHasChatHistory: vi.fn(),
    setCurrentUser: vi.fn(),
    setIsLoggedIn: vi.fn(),
    setSessionId: vi.fn(),
    setSuggestedPrompts: vi.fn(),
    setAgentPersona: vi.fn(),
  })),
}));
