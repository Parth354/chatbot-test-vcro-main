import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AgentDashboard from '@/pages/AgentDashboard';
import { AgentService } from '@/services/agentService';
import { useToast } from '@/hooks/use-toast';

// Mock AgentService
vi.mock('@/services/agentService', () => ({
  AgentService: {
    getAgent: vi.fn(),
    getAgentMetrics: vi.fn(),
  },
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock child components rendered within tabs
vi.mock('@/components/QnATab', () => ({
  QnATab: vi.fn(() => <div data-testid="qna-tab-content">Mock Q&A Tab</div>),
}));

vi.mock('@/components/ConversationHistoryTab', () => ({
  ConversationHistoryTab: vi.fn(() => <div data-testid="conversation-history-tab-content">Mock Conversation History Tab</div>),
}));

vi.mock('@/components/FeedbackTab', () => ({
  FeedbackTab: vi.fn(() => <div data-testid="feedback-tab-content">Mock Feedback Tab</div>),
}));

vi.mock('@/components/DeployTab', () => ({
  default: vi.fn(() => <div data-testid="deploy-tab-content">Mock Deploy Tab</div>),
}));

describe('AgentDashboard', () => {
  const mockNavigate = vi.fn();
  const mockToast = vi.fn();

  const mockAgent = {
    id: 'agent-123',
    name: 'Test Agent',
    description: 'A test agent description',
    avatar_url: 'http://example.com/avatar.png',
    welcome_message: 'Hello!',
    cta_buttons: [],
    rotating_messages: [],
    colors: { primary: '#123456', bubble: '#7890AB', text: '#CDEF01' },
    status: 'active',
    lead_collection_enabled: false,
    lead_form_triggers: [],
    lead_backup_trigger: { enabled: false, message_count: 0 },
    lead_form_fields: [],
    lead_submit_text: '',
    lead_success_message: '',
    linkedin_url: '',
    linkedin_prompt_message_count: 0,
    ai_model_config: { model_name: 'gpt-3.5-turbo' },
    openai_api_key: '',
    ai_mode: 'chat_completion',
    openai_assistant_id: '',
  };

  const mockMetrics = {
    totalSessions: 100,
    totalMessages: 500,
    todayMessages: 20,
    yesterdayMessages: 15,
    leadsRequiringAttention: 5,
    averageResponseTime: '< 1 min',
    satisfactionRate: '85%',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue({ toast: mockToast });
    vi.mocked(AgentService.getAgent).mockResolvedValue(mockAgent);
    vi.mocked(AgentService.getAgentMetrics).mockResolvedValue(mockMetrics);

    vi.mock('react-router-dom', async (importOriginal) => {
      const actual = await importOriginal();
      return {
        ...actual,
        useNavigate: () => mockNavigate,
      };
    });
  });

  const renderAgentDashboard = (agentId = 'agent-123') => {
    render(
      <MemoryRouter initialEntries={[`/admin/agent/${agentId}`]}>
        <Routes>
          <Route path="/admin/agent/:agentId" element={<AgentDashboard />} />
          <Route path="/admin" element={<div>Admin Page</div>} />
          <Route path="/admin/agent/:agentId/customize" element={<div>Customize Page</div>} />
          <Route path="/admin/agent/:agentId/history" element={<div>History Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('should render loading state initially', () => {
    vi.mocked(AgentService.getAgent).mockReturnValueOnce(new Promise(() => {}));
    renderAgentDashboard();
    expect(screen.getByText('Loading agent...')).toBeInTheDocument();
  });

  it('should display agent details and metrics', async () => {
    renderAgentDashboard();

    await waitFor(() => {
      expect(screen.getByText('Test Agent')).toBeInTheDocument();
      expect(screen.getByText('A test agent description')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByAltText('Test Agent')).toBeInTheDocument();

      expect(screen.getByText('Today's Messages')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText('Total Messages')).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument();
      expect(screen.getByText('Conversations')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('Response Time')).toBeInTheDocument();
      expect(screen.getByText('< 1 min')).toBeInTheDocument();
    });
  });

  it('should navigate back to dashboard', async () => {
    renderAgentDashboard();
    await userEvent.click(screen.getByRole('button', { name: /Back to Dashboard/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/admin');
  });

  it('should navigate to customize page', async () => {
    renderAgentDashboard();
    await userEvent.click(screen.getByRole('button', { name: /Customize/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/agent/agent-123/customize');
  });

  it('should navigate to view analytics (history) page', async () => {
    renderAgentDashboard();
    await userEvent.click(screen.getByRole('button', { name: /View Analytics/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/agent/agent-123/history');
  });

  it('should display Q&A tab content when selected', async () => {
    renderAgentDashboard();
    await userEvent.click(screen.getByRole('tab', { name: /Q&A/i }));
    await waitFor(() => {
      expect(screen.getByTestId('qna-tab-content')).toBeInTheDocument();
    });
  });

  it('should display Conversations tab content when selected', async () => {
    renderAgentDashboard();
    await userEvent.click(screen.getByRole('tab', { name: /Conversations/i }));
    await waitFor(() => {
      expect(screen.getByTestId('conversation-history-tab-content')).toBeInTheDocument();
    });
  });

  it('should display Feedback tab content when selected', async () => {
    renderAgentDashboard();
    await userEvent.click(screen.getByRole('tab', { name: /Feedback/i }));
    await waitFor(() => {
      expect(screen.getByTestId('feedback-tab-content')).toBeInTheDocument();
    });
  });

  it('should display Deploy tab content when selected', async () => {
    renderAgentDashboard();
    await userEvent.click(screen.getByRole('tab', { name: /Deploy/i }));
    await waitFor(() => {
      expect(screen.getByTestId('deploy-tab-content')).toBeInTheDocument();
    });
  });

  it('should display error message if agent not found', async () => {
    vi.mocked(AgentService.getAgent).mockResolvedValue(null);
    renderAgentDashboard();

    await waitFor(() => {
      expect(screen.getByText('Agent not found')).toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  it('should display error toast if loading agent fails', async () => {
    vi.mocked(AgentService.getAgent).mockRejectedValue(new Error('API Error'));
    renderAgentDashboard();

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error',
        description: 'Failed to load agent. Please try again.',
        variant: 'destructive',
      }));
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  it('should display error toast if loading metrics fails', async () => {
    vi.mocked(AgentService.getAgentMetrics).mockRejectedValue(new Error('Metrics Error'));
    renderAgentDashboard();

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error',
        description: 'Failed to load metrics. Please try again.',
        variant: 'destructive',
      }));
    });
  });
});
