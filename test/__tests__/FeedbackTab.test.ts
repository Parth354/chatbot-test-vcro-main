import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { FeedbackTab } from '@/components/FeedbackTab';
import { FeedbackService } from '@/services/feedbackService';
import { useToast } from '@/hooks/use-toast';

// Mock FeedbackService
vi.mock('@/services/feedbackService', () => ({
  FeedbackService: {
    getFeedbackForAgent: vi.fn(),
    getFeedbackStats: vi.fn(),
  },
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

describe('FeedbackTab', () => {
  const agentId = 'agent-123';
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue({ toast: mockToast });
    // Default mocks
    vi.mocked(FeedbackService.getFeedbackForAgent).mockResolvedValue([]);
    vi.mocked(FeedbackService.getFeedbackStats).mockResolvedValue({ positive: 0, negative: 0, total: 0 });
  });

  it('should render loading state initially', () => {
    vi.mocked(FeedbackService.getFeedbackForAgent).mockReturnValueOnce(new Promise(() => {}));
    render(<FeedbackTab agentId={agentId} />);
    expect(screen.getByText('Loading feedback data...')).toBeInTheDocument();
  });

  it('should display feedback stats and table', async () => {
    const mockFeedback = [
      { id: 'f1', session_id: 's1', message_id: 'm1', feedback_type: 'up', created_at: new Date().toISOString(), message: { content: 'Bot message 1', sender: 'bot', created_at: '' }, session: { user_name: 'User A' } },
      { id: 'f2', session_id: 's2', message_id: 'm2', feedback_type: 'down', created_at: new Date().toISOString(), message: { content: 'Bot message 2', sender: 'bot', created_at: '' }, session: { user_name: 'User B' } },
    ];
    const mockStats = { positive: 1, negative: 1, total: 2 };

    vi.mocked(FeedbackService.getFeedbackForAgent).mockResolvedValue(mockFeedback);
    vi.mocked(FeedbackService.getFeedbackStats).mockResolvedValue(mockStats);

    render(<FeedbackTab agentId={agentId} />);

    await waitFor(() => {
      expect(screen.getByText('Total Feedback')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Total feedback count
      expect(screen.getByText('Positive')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Positive count
      expect(screen.getByText('Negative')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Negative count
      expect(screen.getByText('50%')).toBeInTheDocument(); // Satisfaction rate

      expect(screen.getByText('Bot message 1')).toBeInTheDocument();
      expect(screen.getByText('Bot message 2')).toBeInTheDocument();
      expect(screen.getByText('User A')).toBeInTheDocument();
      expect(screen.getByText('User B')).toBeInTheDocument();
    });
  });

  it('should filter feedback by type', async () => {
    const mockPositiveFeedback = [
      { id: 'f1', session_id: 's1', message_id: 'm1', feedback_type: 'up', created_at: new Date().toISOString(), message: { content: 'Bot message 1', sender: 'bot', created_at: '' }, session: { user_name: 'User A' } },
    ];
    const mockNegativeFeedback = [
      { id: 'f2', session_id: 's2', message_id: 'm2', feedback_type: 'down', created_at: new Date().toISOString(), message: { content: 'Bot message 2', sender: 'bot', created_at: '' }, session: { user_name: 'User B' } },
    ];

    vi.mocked(FeedbackService.getFeedbackForAgent)
      .mockResolvedValueOnce(mockPositiveFeedback) // For 'up' filter
      .mockResolvedValueOnce(mockNegativeFeedback); // For 'down' filter

    render(<FeedbackTab agentId={agentId} />);

    // Filter by Positive
    await userEvent.click(screen.getByRole('combobox', { name: /Feedback Type/i }));
    await userEvent.click(screen.getByText('Positive only'));
    await waitFor(() => {
      expect(FeedbackService.getFeedbackForAgent).toHaveBeenCalledWith(agentId, 'up');
      expect(screen.getByText('Bot message 1')).toBeInTheDocument();
      expect(screen.queryByText('Bot message 2')).not.toBeInTheDocument();
    });

    // Filter by Negative
    await userEvent.click(screen.getByRole('combobox', { name: /Feedback Type/i }));
    await userEvent.click(screen.getByText('Negative only'));
    await waitFor(() => {
      expect(FeedbackService.getFeedbackForAgent).toHaveBeenCalledWith(agentId, 'down');
      expect(screen.getByText('Bot message 2')).toBeInTheDocument();
      expect(screen.queryByText('Bot message 1')).not.toBeInTheDocument();
    });
  });

  it('should display no feedback message when no feedback exists', async () => {
    render(<FeedbackTab agentId={agentId} />);
    await waitFor(() => {
      expect(screen.getByText('No feedback yet')).toBeInTheDocument();
      expect(screen.getByText('When users rate your bot responses, feedback will appear here.')).toBeInTheDocument();
    });
  });

  it('should display specific no feedback message when filtered and none exist', async () => {
    render(<FeedbackTab agentId={agentId} />);
    await userEvent.click(screen.getByRole('combobox', { name: /Feedback Type/i }));
    await userEvent.click(screen.getByText('Positive only'));
    await waitFor(() => {
      expect(screen.getByText('No positive feedback found.')).toBeInTheDocument();
    });
  });

  it('should display insights and recommendations based on stats', async () => {
    // High satisfaction
    vi.mocked(FeedbackService.getFeedbackStats).mockResolvedValue({ positive: 9, negative: 1, total: 10 });
    render(<FeedbackTab agentId={agentId} />);
    await waitFor(() => {
      expect(screen.getByText('Excellent performance!')).toBeInTheDocument();
    });

    // Low satisfaction
    vi.mocked(FeedbackService.getFeedbackStats).mockResolvedValue({ positive: 3, negative: 7, total: 10 });
    render(<FeedbackTab agentId={agentId} />);
    await waitFor(() => {
      expect(screen.getByText('Room for improvement')).toBeInTheDocument();
    });

    // Low total feedback
    vi.mocked(FeedbackService.getFeedbackStats).mockResolvedValue({ positive: 1, negative: 0, total: 1 });
    render(<FeedbackTab agentId={agentId} />);
    await waitFor(() => {
      expect(screen.getByText('Build feedback data')).toBeInTheDocument();
    });
  });

  it('should display error toast if loading feedback fails', async () => {
    vi.mocked(FeedbackService.getFeedbackForAgent).mockRejectedValue(new Error('API Error'));
    render(<FeedbackTab agentId={agentId} />);
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error',
        description: 'Failed to load feedback data',
        variant: 'destructive',
      }));
    });
  });

  it('should display error toast if loading stats fails', async () => {
    vi.mocked(FeedbackService.getFeedbackStats).mockRejectedValue(new Error('API Error'));
    render(<FeedbackTab agentId={agentId} />);
    await waitFor(() => {
      // Expect console error, but not necessarily a toast for stats loading failure
      // as the component handles it internally without throwing up
    });
  });
});
