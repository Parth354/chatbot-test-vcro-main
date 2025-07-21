import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, vi } from 'vitest';
import { ConversationHistoryTab } from '@/components/ConversationHistoryTab';
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

// Mock date-fns format to avoid issues with locale/timezone in tests
vi.mock('date-fns', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    format: vi.fn((date, formatStr) => {
      if (formatStr === 'yyyy-MM-dd HH:mm:ss') return '2023-01-01 10:00:00';
      if (formatStr === 'PPP') return 'Jan 1, 2023';
      if (formatStr === 'MMM dd, yyyy HH:mm') return 'Jan 01, 2023 10:00';
      if (formatStr === 'HH:mm') return '10:00';
      return date.toISOString();
    }),
  };
});

describe('ConversationHistoryTab', () => {
  const agentId = 'agent-123';
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue({ toast: mockToast });
    // Default mocks
    vi.mocked(ConversationService.getChatSessions).mockResolvedValue([]);
    vi.mocked(ConversationService.getConversationDetails).mockResolvedValue([]);
    vi.mocked(ConversationService.updateChatSessionStatus).mockResolvedValue(undefined);
    vi.mocked(ConversationService.hardDeleteChatSession).mockResolvedValue(undefined);
    vi.mocked(ConversationService.softDeleteChatSession).mockResolvedValue(undefined);

    // Mock confirm dialog
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('should render loading state initially', () => {
    vi.mocked(ConversationService.getChatSessions).mockReturnValueOnce(new Promise(() => {})); // Pending promise
    render(<ConversationHistoryTab agentId={agentId} />);
    expect(screen.getByText('Loading conversation history...')).toBeInTheDocument();
  });

  it('should display no conversations message when none exist', async () => {
    render(<ConversationHistoryTab agentId={agentId} />);
    await waitFor(() => {
      expect(screen.getByText('No conversations yet')).toBeInTheDocument();
      expect(screen.getByText('When users start chatting with your agent, their conversations will appear here.')).toBeInTheDocument();
    });
  });

  it('should load and display chat sessions', async () => {
    const mockSessions = [
      { id: 's1', user_name: 'John Doe', user_email: 'john@example.com', status: 'unread', created_at: new Date().toISOString(), last_message_at: new Date().toISOString(), message_count: 5, cta_button_1_clicks: 1, cta_button_2_clicks: 0, last_message_preview: 'Hello there!' },
      { id: 's2', user_name: 'Jane Smith', user_email: 'jane@example.com', status: 'read', created_at: new Date().toISOString(), last_message_at: new Date().toISOString(), message_count: 10, cta_button_1_clicks: 0, cta_button_2_clicks: 2, last_message_preview: 'How are you?', user_id: 'user-jane' },
      { id: 's3', user_name: null, user_email: null, status: 'active', created_at: new Date().toISOString(), last_message_at: new Date().toISOString(), message_count: 2, cta_button_1_clicks: 0, cta_button_2_clicks: 0, last_message_preview: 'Anonymous chat', user_id: null },
    ];
    vi.mocked(ConversationService.getChatSessions).mockResolvedValue(mockSessions);

    render(<ConversationHistoryTab agentId={agentId} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('unread')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('read')).toBeInTheDocument();
      expect(screen.getByText('Anonymous')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('Hello there!')).toBeInTheDocument();
      expect(screen.getByText('How are you?')).toBeInTheDocument();
      expect(screen.getByText('Anonymous chat')).toBeInTheDocument();
    });
  });

  it('should apply filters and reload conversations', async () => {
    const mockSessions = [
      { id: 's1', user_name: 'Filtered User', user_email: 'filtered@example.com', status: 'read', created_at: new Date().toISOString(), last_message_at: new Date().toISOString(), message_count: 1, cta_button_1_clicks: 0, cta_button_2_clicks: 0, last_message_preview: 'Filtered message' },
    ];
    vi.mocked(ConversationService.getChatSessions).mockResolvedValueOnce([]).mockResolvedValue(mockSessions);

    render(<ConversationHistoryTab agentId={agentId} />);

    // Set keyword
    await userEvent.type(screen.getByPlaceholderText('Search in messages...'), 'Filtered');
    // Set status
    await userEvent.click(screen.getByRole('combobox', { name: /Status/i }));
    await userEvent.click(screen.getByText('Read'));
    // Set date from (mocked format)
    await userEvent.click(screen.getByRole('button', { name: /From Date/i }));
    await userEvent.click(screen.getByRole('button', { name: /Jan 1, 2023/i })); // Assuming a date is selectable

    await userEvent.click(screen.getByRole('button', { name: /Apply Filters/i }));

    await waitFor(() => {
      expect(ConversationService.getChatSessions).toHaveBeenCalledWith(
        agentId,
        expect.objectContaining({
          keyword: 'Filtered',
          status: 'read',
          dateFrom: expect.any(String),
        }),
        true // includeDeleted should be true for admin view
      );
      expect(screen.getByText('Filtered User')).toBeInTheDocument();
    });
  });

  it('should clear filters and reload conversations', async () => {
    const mockSessions = [
      { id: 's1', user_name: 'User A', user_email: 'a@example.com', status: 'read', created_at: new Date().toISOString(), last_message_at: new Date().toISOString(), message_count: 1, cta_button_1_clicks: 0, cta_button_2_clicks: 0, last_message_preview: 'Msg A' },
    ];
    vi.mocked(ConversationService.getChatSessions).mockResolvedValueOnce(mockSessions).mockResolvedValue(mockSessions);

    render(<ConversationHistoryTab agentId={agentId} />);
    await waitFor(() => expect(screen.getByText('User A')).toBeInTheDocument());

    // Apply some filters first
    await userEvent.type(screen.getByPlaceholderText('Search in messages...'), 'User A');
    await userEvent.click(screen.getByRole('button', { name: /Apply Filters/i }));

    // Clear filters
    await userEvent.click(screen.getByRole('button', { name: /Clear Filters/i }));

    await waitFor(() => {
      expect(ConversationService.getChatSessions).toHaveBeenCalledWith(agentId, {}, true);
      expect(screen.getByPlaceholderText('Search in messages...')).toHaveValue('');
      expect(screen.getByText('All statuses')).toBeInTheDocument(); // Select should reset
    });
  });

  it('should export conversations to CSV', async () => {
    const mockSessions = [
      { id: 's1', user_name: 'John Doe', user_email: 'john@example.com', linkedin_profile: 'linkedin.com/in/john', status: 'read', created_at: new Date('2023-01-01T10:00:00Z').toISOString(), last_message_at: new Date('2023-01-01T10:05:00Z').toISOString(), message_count: 5, cta_button_1_clicks: 1, cta_button_2_clicks: 0, last_message_preview: 'Hello there!' },
    ];
    vi.mocked(ConversationService.getChatSessions).mockResolvedValue(mockSessions);

    render(<ConversationHistoryTab agentId={agentId} />);
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

    const downloadSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mockurl');
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');

    await userEvent.click(screen.getByRole('button', { name: /Export CSV/i }));

    expect(downloadSpy).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mockurl');
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success', description: 'Conversation history exported successfully' }));
  });

  it('should view conversation details and update status to read', async () => {
    const mockSession = { id: 's1', user_name: 'John Doe', user_email: 'john@example.com', status: 'unread', created_at: new Date().toISOString(), last_message_at: new Date().toISOString(), message_count: 5, cta_button_1_clicks: 1, cta_button_2_clicks: 0, last_message_preview: 'Hello there!' };
    const mockMessages = [
      { id: 'm1', session_id: 's1', content: 'User message', sender: 'user', created_at: new Date().toISOString() },
      { id: 'm2', session_id: 's1', content: 'Bot message', sender: 'bot', created_at: new Date().toISOString() },
    ];
    vi.mocked(ConversationService.getChatSessions).mockResolvedValueOnce([mockSession]).mockResolvedValueOnce([{ ...mockSession, status: 'read' }]);
    vi.mocked(ConversationService.getConversationDetails).mockResolvedValue(mockMessages);

    render(<ConversationHistoryTab agentId={agentId} />);
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /View/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Conversation with John Doe/i })).toBeInTheDocument();
      expect(screen.getByText('User message')).toBeInTheDocument();
      expect(screen.getByText('Bot message')).toBeInTheDocument();
      expect(ConversationService.getConversationDetails).toHaveBeenCalledWith('s1');
      expect(ConversationService.updateChatSessionStatus).toHaveBeenCalledWith('s1', 'read');
    });
  });

  it('should delete an anonymous conversation permanently', async () => {
    const mockSession = { id: 's3', user_name: null, user_email: null, status: 'active', created_at: new Date().toISOString(), last_message_at: new Date().toISOString(), message_count: 2, cta_button_1_clicks: 0, cta_button_2_clicks: 0, last_message_preview: 'Anonymous chat', user_id: null };
    vi.mocked(ConversationService.getChatSessions).mockResolvedValueOnce([mockSession]).mockResolvedValueOnce([]);

    render(<ConversationHistoryTab agentId={agentId} />);
    await waitFor(() => expect(screen.getByText('Anonymous')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /View/i }));
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Conversation with Anonymous/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /Delete Conversation/i }));

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this conversation? This action cannot be undone.');
    expect(ConversationService.hardDeleteChatSession).toHaveBeenCalledWith('s3');
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success', description: 'Conversation deleted successfully.' }));
    await waitFor(() => {
      expect(screen.queryByText('Anonymous chat')).not.toBeInTheDocument();
    });
  });

  it('should soft delete an authenticated conversation', async () => {
    const mockSession = { id: 's2', user_name: 'Jane Smith', user_email: 'jane@example.com', status: 'read', created_at: new Date().toISOString(), last_message_at: new Date().toISOString(), message_count: 10, cta_button_1_clicks: 0, cta_button_2_clicks: 2, last_message_preview: 'How are you?', user_id: 'user-jane' };
    vi.mocked(ConversationService.getChatSessions).mockResolvedValueOnce([mockSession]).mockResolvedValueOnce([]);

    render(<ConversationHistoryTab agentId={agentId} />);
    await waitFor(() => expect(screen.getByText('Jane Smith')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /View/i }));
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Conversation with Jane Smith/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /Delete Conversation/i }));

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this conversation? This action cannot be undone.');
    expect(ConversationService.softDeleteChatSession).toHaveBeenCalledWith('s2');
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success', description: 'Conversation deleted successfully.' }));
    await waitFor(() => {
      expect(screen.queryByText('How are you?')).not.toBeInTheDocument();
    });
  });

  it('should delete all conversations', async () => {
    const mockSessions = [
      { id: 's1', user_id: null, status: 'active', created_at: new Date().toISOString(), last_message_at: new Date().toISOString(), message_count: 1, cta_button_1_clicks: 0, cta_button_2_clicks: 0, last_message_preview: 'Anon chat' },
      { id: 's2', user_id: 'user-jane', status: 'read', created_at: new Date().toISOString(), last_message_at: new Date().toISOString(), message_count: 1, cta_button_1_clicks: 0, cta_button_2_clicks: 0, last_message_preview: 'Auth chat' },
    ];
    vi.mocked(ConversationService.getChatSessions).mockResolvedValueOnce(mockSessions).mockResolvedValueOnce([]);

    render(<ConversationHistoryTab agentId={agentId} />);
    await waitFor(() => expect(screen.getByText('Anon chat')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /Delete All/i }));

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete ALL conversations for this agent? Anonymous sessions will be permanently deleted, and authenticated sessions will be soft-deleted.');
    expect(ConversationService.hardDeleteChatSession).toHaveBeenCalledWith('s1');
    expect(ConversationService.softDeleteChatSession).toHaveBeenCalledWith('s2');
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Deletion Process Complete' }));
    await waitFor(() => {
      expect(screen.queryByText('Anon chat')).not.toBeInTheDocument();
      expect(screen.queryByText('Auth chat')).not.toBeInTheDocument();
    });
  });

  it('should display error toast if loading conversations fails', async () => {
    vi.mocked(ConversationService.getChatSessions).mockRejectedValue(new Error('API Error'));
    render(<ConversationHistoryTab agentId={agentId} />);
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error',
        description: 'Failed to load conversation history',
        variant: 'destructive',
      }));
    });
  });

  it('should display error toast if viewing conversation details fails', async () => {
    const mockSession = { id: 's1', user_name: 'John Doe', user_email: 'john@example.com', status: 'unread', created_at: new Date().toISOString(), last_message_at: new Date().toISOString(), message_count: 5, cta_button_1_clicks: 1, cta_button_2_clicks: 0, last_message_preview: 'Hello there!' };
    vi.mocked(ConversationService.getChatSessions).mockResolvedValueOnce([mockSession]);
    vi.mocked(ConversationService.getConversationDetails).mockRejectedValue(new Error('API Error'));

    render(<ConversationHistoryTab agentId={agentId} />);
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /View/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error',
        description: 'Failed to load conversation details',
        variant: 'destructive',
      }));
    });
  });

  it('should display error toast if deleting conversation fails', async () => {
    const mockSession = { id: 's1', user_name: 'John Doe', user_email: 'john@example.com', status: 'unread', created_at: new Date().toISOString(), last_message_at: new Date().toISOString(), message_count: 5, cta_button_1_clicks: 1, cta_button_2_clicks: 0, last_message_preview: 'Hello there!', user_id: null };
    vi.mocked(ConversationService.getChatSessions).mockResolvedValueOnce([mockSession]);
    vi.mocked(ConversationService.hardDeleteChatSession).mockRejectedValue(new Error('API Error'));

    render(<ConversationHistoryTab agentId={agentId} />);
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /View/i }));
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Conversation with John Doe/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /Delete Conversation/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error',
        description: 'Failed to delete conversation.',
        variant: 'destructive',
      }));
    });
  });
});
