import '@testing-library/jest-dom'
import { expect, vi } from 'vitest';

// Polyfill for PointerEvent and related methods
if (!global.PointerEvent) {
  class PointerEvent extends MouseEvent {
    public pointerId?: number;
    public pointerType?: string;
    public isPrimary?: boolean;

    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId;
      this.pointerType = params.pointerType;
      this.isPrimary = params.isPrimary;
    }
  }
  global.PointerEvent = PointerEvent as any;
}

if (typeof Element.prototype.hasPointerCapture === 'undefined') {
  Element.prototype.hasPointerCapture = function(pointerId) {
    // @ts-ignore
    return this._capturedPointerIds?.has(pointerId) || false;
  };
}
if (typeof Element.prototype.setPointerCapture === 'undefined') {
  Element.prototype.setPointerCapture = function(pointerId) {
    // @ts-ignore
    if (!this._capturedPointerIds) {
      // @ts-ignore
      this._capturedPointerIds = new Set();
    }
    // @ts-ignore
    this._capturedPointerIds.add(pointerId);
  };
}
if (typeof Element.prototype.releasePointerCapture === 'undefined') {
  Element.prototype.releasePointerCapture = function(pointerId) {
    // @ts-ignore
    this._capturedPointerIds?.delete(pointerId);
  };
}

// Mock for window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn().mockImplementation(() => true), // Always clicks "OK"
});

if (typeof Element.prototype.scrollIntoView === 'undefined') {
  Element.prototype.scrollIntoView = vi.fn();
}



// Mock ResizeObserver
const ResizeObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
vi.stubGlobal('ResizeObserver', ResizeObserverMock);

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => {
  const mockDataStore: Record<string, any[]> = {
    agents: [],
    chat_sessions: [],
    chat_messages: [],
    lead_submissions: [],
    profiles: [],
    user_performance: [],
  };

  const createChainableMock = (tableName: string, currentData?: any[]) => {
    let data = currentData ?? mockDataStore[tableName] ?? [];
    let error: any = null;
    let count: number | null = null;
    let isSingle = false;

    const then = (resolve: (value: any) => any) => {
      if (error) {
        return Promise.resolve(resolve({ data: null, error }));
      }
      const result = {
        data: isSingle ? (data[0] || null) : data,
        error: null,
        count: count,
      };
      return Promise.resolve(resolve(result));
    };

    const chain: any = {
      select: vi.fn((selectQuery = '*') => {
        if (selectQuery.includes('count')) {
          count = data.length;
        }
        return chain;
      }),
      insert: vi.fn((newData: any) => {
        const itemsToInsert = Array.isArray(newData) ? newData : [newData];
        itemsToInsert.forEach(item => {
          const newItem = { id: Math.random().toString(36).substring(7), created_at: new Date().toISOString(), ...item };
          mockDataStore[tableName].push(newItem);
          data = [newItem];
        });
        isSingle = !Array.isArray(newData);
        return chain;
      }),
      update: vi.fn((updateData: any) => {
        if (data.length > 0) {
          const updatedData = { ...data[0], ...updateData };
          mockDataStore[tableName] = mockDataStore[tableName].map(item =>
            item.id === data[0].id ? updatedData : item
          );
          data = [updatedData];
        }
        return chain;
      }),
      delete: vi.fn(() => {
        const idsToDelete = data.map(item => item.id);
        mockDataStore[tableName] = mockDataStore[tableName].filter(item => !idsToDelete.includes(item.id));
        data = [];
        return chain;
      }),
      eq: vi.fn((column: string, value: any) => {
        data = (mockDataStore[tableName] || []).filter(item => item[column] === value);
        return chain;
      }),
      in: vi.fn((column: string, values: any[]) => {
        data = (mockDataStore[tableName] || []).filter(item => values.includes(item[column]));
        return chain;
      }),
      order: vi.fn(() => chain),
      limit: vi.fn((limit: number) => {
        data = data.slice(0, limit);
        return chain;
      }),
      single: vi.fn(() => {
        isSingle = true;
        if (data.length > 1) {
          error = { code: 'PGRST116', message: 'Multiple rows returned' };
        } else if (data.length === 0) {
           error = { code: 'PGRST116', message: 'No rows returned' };
        }
        return { then };
      }),
      maybeSingle: vi.fn(() => {
        isSingle = true;
         if (data.length > 1) {
          error = { code: 'PGRST116', message: 'Multiple rows returned' };
        }
        return { then };
      }),
      gte: vi.fn((column: string, value: any) => {
        data = data.filter(item => new Date(item[column]) >= new Date(value));
        return chain;
      }),
      lt: vi.fn((column: string, value: any) => {
        data = data.filter(item => new Date(item[column]) < new Date(value));
        return chain;
      }),
      not: vi.fn((column: string, operator: string, value: any) => {
        if (operator === 'is' && value === null) {
          data = data.filter(item => item[column] !== null);
        }
        return chain;
      }),
      then,
    };

    return chain;
  };

  const supabaseMock = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'test-user-id' } } }, error: null }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOtp: vi.fn(),
      verifyOtp: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
    from: vi.fn((tableName: string) => createChainableMock(tableName)),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'mock-path' }, error: null }),
        remove: vi.fn().mockResolvedValue({ data: {}, error: null }),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'mock-public-url' } })),
      })),
    },
  };

  return {
    supabase: supabaseMock,
    setMockData: (tableName: string, data: any[]) => {
      mockDataStore[tableName] = JSON.parse(JSON.stringify(data)); // Deep copy to prevent test interference
    },
    clearMockData: () => {
      for (const key in mockDataStore) {
        mockDataStore[key] = [];
      }
    },
  };
});

// Mock router
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: vi.fn(() => vi.fn()),
  useParams: vi.fn(() => ({ agentId: 'test-id' })),
  useLocation: vi.fn(() => ({ pathname: '/test', search: '' })),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
}));


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
