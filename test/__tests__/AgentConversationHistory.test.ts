import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AgentConversationHistory from '@/pages/AgentConversationHistory';
import { ConversationService } from '@/services/conversationService';
import { useToast } from '@/hooks/use-toast';

// Mock ConversationService
vi.mock('@/services/conversationService', () => ({
  ConversationService: {
    getChatSessions: vi.fn(),
    getConversationDetails: vi.fn(),
    updateChatSessionStatus: vi.fn(),
    hardDeleteChatSession: vi.fn(),
    softDeleteChatSession: vi.fn(),
  },
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

describe('AgentConversationHistory', () => {
  const mockNavigate = vi.fn();
  const mockToast = vi.fn();
  const agentId = 'agent-123';

  const mockSessions = [
    { id: 's1', user_name: 'John Doe', user_email: 'john@example.com', status: 'unread', created_at: new Date().toISOString(), last_message_at: new Date().toISOString(), message_count: 5, user_id: 'user-1' },
    { id: 's2', user_name: 'Jane Smith', user_email: 'jane@example.com', status: 'read', created_at: new Date().toISOString(), last_message_at: new Date().toISOString(), message_count: 10, user_id: 'user-2' },
    { id: 's3', user_name: null, user_email: null, status: 'active', created_at: new Date().toISOString(), last_message_at: new Date().toISOString(), message_count: 2, user_id: null },
  ];

  const mockMessages = [
    { id: 'm1', session_id: 's1', content: 'User says hi', sender: 'user', created_at: new Date().toISOString() },
    { id: 'm2', session_id: 's1', content: 'Bot replies hello', sender: 'bot', created_at: new Date().toISOString() },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue({ toast: mockToast });
    vi.mocked(ConversationService.getChatSessions).mockResolvedValue(mockSessions);
    vi.mocked(ConversationService.getConversationDetails).mockResolvedValue(mockMessages);
    vi.mocked(ConversationService.updateChatSessionStatus).mockResolvedValue(undefined);
    vi.mocked(ConversationService.hardDeleteChatSession).mockResolvedValue(undefined);
    vi.mocked(ConversationService.softDeleteChatSession).mockResolvedValue(undefined);

    vi.mock('react-router-dom', async (importOriginal) => {
      const actual = await importOriginal();
      return {
        ...actual,
        useParams: () => ({ agentId }),
        useNavigate: () => mockNavigate,
      };
    });

    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  const renderComponent = () => {
    render(
      <MemoryRouter initialEntries={[`/admin/agent/${agentId}/history`]}>
        <Routes>
          <Route path="/admin/agent/:agentId/history" element={<AgentConversationHistory />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('should render loading state initially', () => {
    vi.mocked(ConversationService.getChatSessions).mockReturnValueOnce(new Promise(() => {}));
    renderComponent();
    expect(screen.getByText('Loading conversations...')).toBeInTheDocument();
  });

  it('should display list of chat sessions', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Anonymous')).toBeInTheDocument();
    });
  });

  it('should select a session and display its messages', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('John Doe'));

    await waitFor(() => {
      expect(screen.getByText('Conversation with John Doe')).toBeInTheDocument();
      expect(screen.getByText('User says hi')).toBeInTheDocument();
      expect(screen.getByText('Bot replies hello')).toBeInTheDocument();
      expect(ConversationService.getConversationDetails).toHaveBeenCalledWith('s1');
    });
  });

  it('should update session status to read when viewed', async () => {
    const unreadSession = { ...mockSessions[0], status: 'unread' };
    vi.mocked(ConversationService.getChatSessions).mockResolvedValueOnce([unreadSession]);

    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('John Doe'));

    await waitFor(() => {
      expect(ConversationService.updateChatSessionStatus).toHaveBeenCalledWith('s1', 'read');
      // Verify UI update (optimistic update)
      expect(screen.getByText(/Status: read/i)).toBeInTheDocument();
    });
  });

  it('should filter sessions by search term', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search sessions...');
    await userEvent.type(searchInput, 'Jane');

    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should delete an anonymous session permanently', async () => {
    vi.mocked(ConversationService.getChatSessions).mockResolvedValueOnce([mockSessions[2]]).mockResolvedValueOnce([]);

    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Anonymous')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Anonymous'));
    await userEvent.click(screen.getByRole('button', { name: /Delete Session/i }));

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to permanently delete this anonymous session and all its messages? This cannot be undone.');
    expect(ConversationService.hardDeleteChatSession).toHaveBeenCalledWith('s3');
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Session Permanently Deleted' }));
    await waitFor(() => {
      expect(screen.queryByText('Anonymous')).not.toBeInTheDocument();
    });
  });

  it('should soft delete an authenticated session', async () => {
    vi.mocked(ConversationService.getChatSessions).mockResolvedValueOnce([mockSessions[0]]).mockResolvedValueOnce([]);

    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('John Doe'));
    await userEvent.click(screen.getByRole('button', { name: /Delete Session/i }));

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to soft-delete this session? It will be hidden from this view but can be recovered by an admin.');
    expect(ConversationService.softDeleteChatSession).toHaveBeenCalledWith('s1');
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Session Soft-Deleted' }));
    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  it('should delete all sessions (mix of hard and soft)', async () => {
    vi.mocked(ConversationService.getChatSessions).mockResolvedValueOnce(mockSessions).mockResolvedValueOnce([]);

    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /Delete All/i }));

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete ALL conversations for this agent? Anonymous sessions will be permanently deleted, and authenticated sessions will be soft-deleted.');
    expect(ConversationService.hardDeleteChatSession).toHaveBeenCalledWith('s3'); // Anonymous
    expect(ConversationService.softDeleteChatSession).toHaveBeenCalledWith('s1'); // Authenticated
    expect(ConversationService.softDeleteChatSession).toHaveBeenCalledWith('s2'); // Authenticated
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Deletion Process Complete' }));
    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      expect(screen.queryByText('Anonymous')).not.toBeInTheDocument();
    });
  });

  it('should display error toast if loading sessions fails', async () => {
    vi.mocked(ConversationService.getChatSessions).mockRejectedValue(new Error('API Error'));
    renderComponent();
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error',
        description: 'Failed to load chat sessions. Please try again.',
        variant: 'destructive',
      }));
    });
  });

  it('should display error toast if loading messages fails', async () => {
    vi.mocked(ConversationService.getChatSessions).mockResolvedValueOnce([mockSessions[0]]);
    vi.mocked(ConversationService.getConversationDetails).mockRejectedValue(new Error('API Error'));

    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('John Doe'));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error',
        description: 'Failed to load messages for this session. Please try again.',
        variant: 'destructive',
      }));
    });
  });

  it('should navigate back when back button is clicked', async () => {
    renderComponent();
    await userEvent.click(screen.getByRole('button', { name: /ArrowLeft/i })); // Using accessible name for Lucide icon
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
