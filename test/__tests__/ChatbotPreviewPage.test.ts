import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ChatbotPreviewPage from '@/pages/ChatbotPreviewPage';
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

describe('ChatbotPreviewPage', () => {
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
  });

  const renderChatbotPreviewPage = (agentId?: string, mode?: string) => {
    const path = agentId ? `/chatbot-preview/${agentId}` : '/chatbot-preview/missing';
    const search = mode ? `?mode=${mode}` : '';
    render(
      <MemoryRouter initialEntries={[
        { pathname: path, search: search }
      ]}>
        <Routes>
          <Route path="/chatbot-preview/:agentId" element={<ChatbotPreviewPage />} />
          <Route path="/chatbot-preview/missing" element={<ChatbotPreviewPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('should render loading state initially', () => {
    vi.mocked(AgentService.getAgent).mockReturnValueOnce(new Promise(() => {}));
    renderChatbotPreviewPage('agent-123');
    expect(screen.getByText('Loading chatbot preview...')).toBeInTheDocument();
  });

  it('should display error if agent ID is missing', async () => {
    renderChatbotPreviewPage(undefined);
    await waitFor(() => {
      expect(screen.getByText('Error: Agent ID is missing.')).toBeInTheDocument();
    });
    expect(AgentService.getAgent).not.toHaveBeenCalled();
  });

  it('should display error if agent not found', async () => {
    vi.mocked(AgentService.getAgent).mockResolvedValue(null);
    renderChatbotPreviewPage('non-existent-agent');
    await waitFor(() => {
      expect(screen.getByText('Error: Agent not found.')).toBeInTheDocument();
    });
  });

  it('should display error if fetching agent data fails', async () => {
    vi.mocked(AgentService.getAgent).mockRejectedValue(new Error('Network error'));
    renderChatbotPreviewPage('agent-123');
    await waitFor(() => {
      expect(screen.getByText('Error: Failed to load chatbot preview.')).toBeInTheDocument();
    });
  });

  it('should render ChatbotUI with expanded mode by default', async () => {
    renderChatbotPreviewPage('agent-123');
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
    });
  });

  it('should render ChatbotUI with collapsed mode if specified in query params', async () => {
    renderChatbotPreviewPage('agent-123', 'collapsed');
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
});
