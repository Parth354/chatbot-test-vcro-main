import { render, screen, waitFor } from '@testing-library/react';
import { expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route, useParams, useLocation } from 'react-router-dom';
import Iframe from '@/pages/Iframe';
import { AgentService } from '@/services/agentService';
import ChatbotUI from '@/components/ChatbotUI';

// Mock AgentService
vi.mock('@/services/agentService', () => ({
  AgentService: {
    getAgent: vi.fn(),
  },
}));

// Mock ChatbotUI
vi.mock('@/components/ChatbotUI', () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="mock-chatbot-ui">Mock Chatbot UI</div>),
}));

// Mock react-router-dom explicitly
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    MemoryRouter: actual.MemoryRouter,
    Routes: actual.Routes,
    Route: actual.Route,
    useParams: vi.fn(),
    useLocation: vi.fn(),
  };
});

describe('Iframe Page', () => {
  const mockAgentData = {
    id: 'agent-123',
    name: 'Test Agent',
    description: 'A test agent',
    avatar_url: '',
    welcome_message: '',
    cta_buttons: [],
    rotating_messages: [],
    colors: { primary: '', bubble: '', text: '' },
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

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AgentService.getAgent).mockResolvedValue(mockAgentData);
    // Mock useParams and useLocation for each test
    vi.mocked(useParams).mockReturnValue({ agentId: 'agent-123' });
    vi.mocked(useLocation).mockReturnValue({ search: '' });
  });

  const renderIframePage = (agentId?: string, searchParams?: string) => {
    // Conditionally mock useParams based on agentId presence
    if (agentId === undefined) {
      vi.mocked(useParams).mockReturnValue({});
    } else {
      vi.mocked(useParams).mockReturnValue({ agentId });
    }

    // Mock useLocation to return the specified searchParams
    vi.mocked(useLocation).mockReturnValue({ search: searchParams || '' });

    const path = agentId ? `/iframe/${agentId}` : '/iframe/missing';
    render(
      <MemoryRouter initialEntries={[`${path}${searchParams || ''}`]}>
        <Routes>
          <Route path="/iframe/:agentId" element={<Iframe />} />
          <Route path="/iframe/missing" element={<Iframe />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('should render loading state initially', () => {
    vi.mocked(AgentService.getAgent).mockReturnValueOnce(new Promise(() => {}));
    renderIframePage('agent-123');
    expect(screen.getByRole('status')).toBeInTheDocument(); // Spinner
  });

  it('should display error if agent ID is missing', async () => {
    renderIframePage(undefined);
    await waitFor(() => {
      expect(screen.getByText('Error: Agent ID is missing.')).toBeInTheDocument();
    });
    expect(AgentService.getAgent).not.toHaveBeenCalled();
  });

  it('should display error if agent not found', async () => {
    vi.mocked(AgentService.getAgent).mockResolvedValue(null);
    renderIframePage('non-existent-agent');
    await waitFor(() => {
      expect(screen.getByText('Error: Agent not found.')).toBeInTheDocument();
    });
  });

  it('should display error if fetching agent data fails', async () => {
    vi.mocked(AgentService.getAgent).mockRejectedValue(new Error('Network error'));
    renderIframePage('agent-123');
    await waitFor(() => {
      expect(screen.getByText('Error: Failed to load agent. Please try again.')).toBeInTheDocument();
    });
  });

  it('should render ChatbotUI with default expanded mode and center alignment', async () => {
    renderIframePage('agent-123');
    await waitFor(() => {
      expect(screen.getByTestId('mock-chatbot-ui')).toBeInTheDocument();
      expect(ChatbotUI).toHaveBeenCalledWith(
        expect.objectContaining({
          chatbotData: mockAgentData,
          previewMode: 'expanded',
          isLivePreview: true,
          loadingChatbotData: false,
        }),
        {}
      );
      expect(screen.getByRole('main')).toHaveClass('justify-center');
      expect(screen.getByRole('main')).toHaveClass('items-center');
    });
  });

  it('should render ChatbotUI with collapsed mode if specified in query params', async () => {
    renderIframePage('agent-123', '?mode=collapsed');
    await waitFor(() => {
      expect(screen.getByTestId('mock-chatbot-ui')).toBeInTheDocument();
      expect(ChatbotUI).toHaveBeenCalledWith(
        expect.objectContaining({
          chatbotData: mockAgentData,
          previewMode: 'collapsed',
          isLivePreview: false, // Collapsed mode implies not live preview
          loadingChatbotData: false,
        }),
        {}
      );
    });
  });

  it('should apply left alignment if specified in query params', async () => {
    renderIframePage('agent-123', '?align=left');
    await waitFor(() => {
      expect(screen.getByRole('main')).toHaveClass('justify-start');
      expect(screen.getByRole('main')).toHaveClass('items-center');
    });
  });

  it('should apply right alignment if specified in query params', async () => {
    renderIframePage('agent-123', '?align=right');
    await waitFor(() => {
      expect(screen.getByRole('main')).toHaveClass('justify-end');
      expect(screen.getByRole('main')).toHaveClass('items-center');
    });
  });

  it('should apply top alignment if specified in query params', async () => {
    renderIframePage('agent-123', '?align=top');
    await waitFor(() => {
      expect(screen.getByRole('main')).toHaveClass('justify-center');
      expect(screen.getByRole('main')).toHaveClass('items-start');
    });
  });

  it('should apply bottom alignment if specified in query params', async () => {
    renderIframePage('agent-123', '?align=bottom');
    await waitFor(() => {
      expect(screen.getByRole('main')).toHaveClass('justify-center');
      expect(screen.getByRole('main')).toHaveClass('items-end');
    });
  });
});
