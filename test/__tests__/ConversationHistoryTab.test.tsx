import { render, screen, waitFor } from '@testing-library/react';
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

  const mockSessions = [
    { id: 's1', user_name: 'John Doe', user_email: 'john@example.com', status: 'unread', created_at: new Date().toISOString(), last_message_at: new Date().toISOString(), message_count: 5, last_message_preview: 'Hello there!', user_id: 'user-1' },
    { id: 's2', user_name: 'Jane Smith', user_email: 'jane@example.com', status: 'read', created_at: new Date().toISOString(), last_message_at: new Date().toISOString(), message_count: 10, last_message_preview: 'How are you?', user_id: 'user-2' },
    { id: 's3', user_name: null, user_email: null, status: 'active', created_at: new Date().toISOString(), last_message_at: new Date().toISOString(), message_count: 2, last_message_preview: 'Anonymous chat', user_id: null },
  ];

  const mockMessages = [
    { id: 'm1', session_id: 's1', content: 'User message', sender: 'user', created_at: new Date().toISOString() },
    { id: 'm2', session_id: 's1', content: 'Bot message', sender: 'bot', created_at: new Date().toISOString() },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue({ toast: mockToast });
    // Default mocks
    vi.mocked(ConversationService.getChatSessions).mockResolvedValue(mockSessions);
    vi.mocked(ConversationService.getConversationDetails).mockResolvedValue(mockMessages);
    vi.mocked(ConversationService.updateChatSessionStatus).mockResolvedValue(undefined);
    vi.mocked(ConversationService.hardDeleteChatSession).mockResolvedValue(undefined);
    vi.mocked(ConversationService.softDeleteChatSession).mockResolvedValue(undefined);

    // Mock confirm dialog
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('should render loading state initially', () => {
    vi.mocked(ConversationService.getChatSessions).mockReturnValueOnce(new Promise(() => {})); // Pending promise
    render(<ConversationHistoryTab agentId={agentId} />);
    expect(screen.getByText('Loading conversation history...')).toBeInTheDocument();
  });

  it('should display no conversations message when none exist', async () => {
    vi.mocked(ConversationService.getChatSessions).mockResolvedValue([]);
    render(<ConversationHistoryTab agentId={agentId} />);
    await waitFor(() => {
      expect(screen.getByText('No conversations yet')).toBeInTheDocument();
    });
  });

  it('should load and display chat sessions', async () => {
    render(<ConversationHistoryTab agentId={agentId} />);
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Unread')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Read')).toBeInTheDocument();
    });
  });

  it('should apply filters and reload conversations', async () => {
    render(<ConversationHistoryTab agentId={agentId} />);
    await waitFor(() => expect(screen.getByText('Filters & Search')).toBeInTheDocument());

    await userEvent.type(screen.getByPlaceholderText('Search in messages...'), 'Filtered');
    await userEvent.click(screen.getByRole('button', { name: /Apply Filters/i }));

    await waitFor(() => {
      expect(ConversationService.getChatSessions).toHaveBeenCalledWith(
        agentId,
        expect.objectContaining({ keyword: 'Filtered' }),
        true
      );
    });
  });

  it('should clear filters and reload conversations', async () => {
    render(<ConversationHistoryTab agentId={agentId} />);
    await waitFor(() => expect(screen.getByText('Filters & Search')).toBeInTheDocument());

    await userEvent.type(screen.getByPlaceholderText('Search in messages...'), 'test');
    await userEvent.click(screen.getByRole('button', { name: /Apply Filters/i }));
    await userEvent.click(screen.getByRole('button', { name: /Clear Filters/i }));

    await waitFor(() => {
      expect(ConversationService.getChatSessions).toHaveBeenCalledWith(agentId, {}, true);
    });
  });

  it('should export conversations to CSV', async () => {
    render(<ConversationHistoryTab agentId={agentId} />);
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /Export CSV/i }));

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success' }));
  });

  it('should view conversation details and update status to read', async () => {
    render(<ConversationHistoryTab agentId={agentId} />);
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

    await userEvent.click(screen.getAllByRole('button', { name: /View/i })[0]);

    await waitFor(() => {
      expect(ConversationService.updateChatSessionStatus).toHaveBeenCalledWith('s1', 'read');
    });
  });

  it('should delete an anonymous conversation permanently', async () => {
    render(<ConversationHistoryTab agentId={agentId} />);
    await waitFor(() => expect(screen.getByText('Anonymous')).toBeInTheDocument());

    await userEvent.click(screen.getAllByRole('button', { name: /View/i })[2]);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /Delete Conversation/i }));

    await waitFor(() => {
      expect(ConversationService.hardDeleteChatSession).toHaveBeenCalledWith('s3');
    });
  });

  it('should soft delete an authenticated conversation', async () => {
    render(<ConversationHistoryTab agentId={agentId} />);
    await waitFor(() => expect(screen.getByText('Jane Smith')).toBeInTheDocument());
  
    // Find the "View" button in the same row as "Jane Smith"
    const janeSmithRow = screen.getByText('Jane Smith').closest('tr');
    const viewButton = janeSmithRow.querySelector('button');
    await userEvent.click(viewButton);
  
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    
    await userEvent.click(screen.getByRole('button', { name: /Delete Conversation/i }));
  
    await waitFor(() => {
      expect(ConversationService.softDeleteChatSession).toHaveBeenCalledWith('s2');
    });
  });

  it('should delete all conversations', async () => {
    render(<ConversationHistoryTab agentId={agentId} />);
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /Delete All/i }));

    await waitFor(() => {
      expect(ConversationService.hardDeleteChatSession).toHaveBeenCalledWith('s3');
      expect(ConversationService.softDeleteChatSession).toHaveBeenCalledWith('s1');
      expect(ConversationService.softDeleteChatSession).toHaveBeenCalledWith('s2');
    });
  });
});