import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Embed from '@/pages/Embed';
import { AgentService } from '@/services/agentService';
import { useChatbotLogic } from '@/hooks/useChatbotLogic';
import ChatbotUI from '@/components/ChatbotUI';

// Mock AgentService
vi.mock('@/services/agentService', () => ({
  AgentService: {
    getAgent: vi.fn(),
  },
}));

// Mock useChatbotLogic
vi.mock('@/hooks/useChatbotLogic', () => ({
  useChatbotLogic: vi.fn(() => ({
    internalChatbotData: null,
    messages: [],
    suggestedPrompts: [],
    currentMessageIndex: 0,
    isVisible: true,
    isExpanded: false,
    message: '',
    isTyping: false,
    suggestions: [],
    isBotTyping: false,
    hasChatHistory: false,
    chatHistory: [],
    feedbackMessage: '',
    showLoginModal: false,
    isLoggedIn: false,
    currentUser: null,
    sessionId: '',
    messageCount: 0,
    showLeadForm: false,
    leadFormSubmitted: false,
    showLinkedInPrompt: false,
    linkedinUrlInput: '',
    linkedInPrompted: false,
    threadId: undefined,
    scrollContainerRef: { current: null },
    handleBubbleClick: vi.fn(),
    handleClose: vi.fn(),
    getSmartSuggestions: vi.fn(),
    handlePromptClick: vi.fn(),
    handleSendMessage: vi.fn(),
    handleMessageChange: vi.fn(),
    handleVoiceNote: vi.fn(),
    handleAttachment: vi.fn(),
    handleCopyMessage: vi.fn(),
    handleFeedback: vi.fn(),
    handleLoginClick: vi.fn(),
    handleLoginSuccess: vi.fn(),
    handleSignOut: vi.fn(),
    handleLinkedInSubmit: vi.fn(),
    handleLeadFormSubmit: vi.fn(),
    handleLeadFormCancel: vi.fn(),
    setLinkedinUrlInput: vi.fn(),
  })),
}));

// Mock ChatbotUI
vi.mock('@/components/ChatbotUI', () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="mock-chatbot-ui">Mock Chatbot UI</div>),
}));

describe('Embed Page', () => {
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

  const renderEmbedPage = (agentId?: string) => {
    const path = agentId ? `/embed/${agentId}` : '/embed/missing';
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/embed/:agentId" element={<Embed />} />
          <Route path="/embed/missing" element={<Embed />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('should render loading state initially', () => {
    vi.mocked(AgentService.getAgent).mockReturnValueOnce(new Promise(() => {}));
    renderEmbedPage('agent-123');
    expect(screen.getByRole('status')).toBeInTheDocument(); // Spinner
  });

  it('should display error if agent ID is missing', async () => {
    renderEmbedPage(undefined);
    await waitFor(() => {
      expect(screen.getByText('Error: Agent ID is missing.')).toBeInTheDocument();
    });
    expect(AgentService.getAgent).not.toHaveBeenCalled();
  });

  it('should display error if agent not found', async () => {
    vi.mocked(AgentService.getAgent).mockResolvedValue(null);
    renderEmbedPage('non-existent-agent');
    await waitFor(() => {
      expect(screen.getByText('Error: Agent not found.')).toBeInTheDocument();
    });
  });

  it('should display error if fetching agent data fails', async () => {
    vi.mocked(AgentService.getAgent).mockRejectedValue(new Error('Network error'));
    renderEmbedPage('agent-123');
    await waitFor(() => {
      expect(screen.getByText('Error: Failed to load agent. Please try again.')).toBeInTheDocument();
    });
  });

  it('should render ChatbotUI with expanded mode', async () => {
    renderEmbedPage('agent-123');
    await waitFor(() => {
      expect(screen.getByTestId('mock-chatbot-ui')).toBeInTheDocument();
      expect(ChatbotUI).toHaveBeenCalledWith(
        expect.objectContaining({
          chatbotData: mockAgentData,
          previewMode: 'expanded',
          isLivePreview: false,
          loadingChatbotData: false,
        }),
        {}
      );
    });
  });
});
