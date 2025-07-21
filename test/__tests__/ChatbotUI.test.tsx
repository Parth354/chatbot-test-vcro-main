import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, vi } from 'vitest';
import ChatbotUI from '@/components/ChatbotUI';
import { useChatbotLogic } from '@/hooks/useChatbotLogic';
import { ChatbotLoginModal } from '@/components/ChatbotLoginModal';
import { LeadCollectionForm } from '@/components/LeadCollectionForm';

// Mock the useChatbotLogic hook
vi.mock('@/hooks/useChatbotLogic', () => ({
  useChatbotLogic: vi.fn(),
}));

// Mock child components to simplify testing ChatbotUI itself
vi.mock('@/components/ChatbotLoginModal', () => ({
  default: vi.fn(() => null),
}));

vi.mock('@/components/LeadCollectionForm', () => ({
  default: vi.fn(() => null), // Render nothing by default
}));

describe('ChatbotUI', () => {
  const mockChatbotData = {
    id: 'agent-123',
    name: 'Test Bot',
    description: 'A friendly test bot',
    avatar_url: 'http://example.com/avatar.png',
    welcome_message: 'Welcome to Test Bot!',
    rotating_messages: ['Hi!', 'Hello!'],
    cta_buttons: [{ label: 'Visit Us', url: 'http://example.com' }],
    colors: { primary: '#123456', bubble: '#7890AB', text: '#CDEF01' },
    lead_collection_enabled: false,
    linkedin_prompt_message_count: 0,
  };

  const mockUseChatbotLogicReturn = {
    internalChatbotData: mockChatbotData,
    messages: mockChatbotData.rotating_messages,
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
    sessionId: 'mock-session-id',
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
    handleCtaButtonClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mock return value for useChatbotLogic
    vi.mocked(useChatbotLogic).mockReturnValue(mockUseChatbotLogicReturn);
    // Mock document.documentElement.style.setProperty
    vi.spyOn(document.documentElement.style, 'setProperty').mockImplementation(() => {});
  });

  it('should render loading spinner when loadingChatbotData is true', () => {
    render(<ChatbotUI chatbotData={null} loadingChatbotData={true} />);
    expect(screen.getByRole('status')).toBeInTheDocument(); // Spinner has role status
    expect(screen.queryByText('Test Bot')).not.toBeInTheDocument();
  });

  it('should render in collapsed mode initially', () => {
    render(<ChatbotUI chatbotData={mockChatbotData} loadingChatbotData={false} />);
    expect(screen.getByText('Hi!')).toBeInTheDocument();
    expect(screen.getByAltText('Test Bot - AI Agent')).toBeInTheDocument();
    expect(screen.queryByText('Welcome to Test Bot!')).not.toBeInTheDocument(); // Not in collapsed mode
  });

  it('should expand to chat view on bubble click', async () => {
    const handleBubbleClick = vi.fn();
    vi.mocked(useChatbotLogic).mockReturnValue({
      ...mockUseChatbotLogicReturn,
      handleBubbleClick,
    });

    render(<ChatbotUI chatbotData={mockChatbotData} loadingChatbotData={false} />);

    await userEvent.click(screen.getByText('Hi!'));
    expect(handleBubbleClick).toHaveBeenCalledTimes(1);
  });

  it('should render in expanded mode with header and welcome message', () => {
    vi.mocked(useChatbotLogic).mockReturnValue({
      ...mockUseChatbotLogicReturn,
      isExpanded: true,
    });

    render(<ChatbotUI chatbotData={mockChatbotData} loadingChatbotData={false} />);

    expect(screen.getByText('Test Bot')).toBeInTheDocument();
    expect(screen.getByText('A friendly test bot')).toBeInTheDocument();
    expect(screen.getByText('Welcome to Test Bot!')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
  });

  it('should display suggested prompts when chat history is empty', async () => {
    const mockSuggestedPrompts = ['Prompt 1', 'Prompt 2'];
    vi.mocked(useChatbotLogic).mockReturnValue({
      ...mockUseChatbotLogicReturn,
      isExpanded: true,
      chatHistory: [],
      suggestedPrompts: mockSuggestedPrompts,
    });

    render(<ChatbotUI chatbotData={mockChatbotData} loadingChatbotData={false} />);

    await waitFor(() => {
      expect(screen.getByText('Quick suggestions:')).toBeInTheDocument();
      expect(screen.getByText('Prompt 1')).toBeInTheDocument();
      expect(screen.getByText('Prompt 2')).toBeInTheDocument();
    });
  });

  it('should not display suggested prompts when chat history exists', async () => {
    const mockSuggestedPrompts = ['Prompt 1', 'Prompt 2'];
    const mockChatHistory = [
      { id: 'msg1', text: 'User message', sender: 'user', timestamp: new Date() },
    ];
    vi.mocked(useChatbotLogic).mockReturnValue({
      ...mockUseChatbotLogicReturn,
      isExpanded: true,
      chatHistory: mockChatHistory,
      suggestedPrompts: mockSuggestedPrompts,
      hasChatHistory: true,
    });

    render(<ChatbotUI chatbotData={mockChatbotData} loadingChatbotData={false} />);

    await waitFor(() => {
      expect(screen.queryByText('Quick suggestions:')).not.toBeInTheDocument();
      expect(screen.getByText('User message')).toBeInTheDocument();
    });
  });

  it('should call handleSendMessage on send button click', async () => {
    const handleSendMessage = vi.fn();
    vi.mocked(useChatbotLogic).mockReturnValue({
      ...mockUseChatbotLogicReturn,
      isExpanded: true,
      message: 'Hello bot',
      handleSendMessage,
    });

    render(<ChatbotUI chatbotData={mockChatbotData} loadingChatbotData={false} />);

    await userEvent.click(screen.getByRole('button', { name: /Send/i }));
    expect(handleSendMessage).toHaveBeenCalledTimes(1);
  });

  it('should call handleMessageChange on textarea input', async () => {
    const handleMessageChange = vi.fn();
    vi.mocked(useChatbotLogic).mockReturnValue({
      ...mockUseChatbotLogicReturn,
      isExpanded: true,
      handleMessageChange,
    });

    render(<ChatbotUI chatbotData={mockChatbotData} loadingChatbotData={false} />);

    await userEvent.type(screen.getByPlaceholderText('Type your message...'), 'Typing...');
    expect(handleMessageChange).toHaveBeenCalled();
  });

  it('should display bot typing indicator', () => {
    vi.mocked(useChatbotLogic).mockReturnValue({
      ...mockUseChatbotLogicReturn,
      isExpanded: true,
      isBotTyping: true,
    });

    render(<ChatbotUI chatbotData={mockChatbotData} loadingChatbotData={false} />);

    expect(screen.getByText('Typing')).toBeInTheDocument();
  });

  it('should display chat history messages', () => {
    const mockChatHistory = [
      { id: '1', text: 'Hi bot', sender: 'user', timestamp: new Date() },
      { id: '2', text: 'Hello user', sender: 'bot', timestamp: new Date() },
    ];
    vi.mocked(useChatbotLogic).mockReturnValue({
      ...mockUseChatbotLogicReturn,
      isExpanded: true,
      chatHistory: mockChatHistory,
      hasChatHistory: true,
    });

    render(<ChatbotUI chatbotData={mockChatbotData} loadingChatbotData={false} />);

    expect(screen.getByText('Hi bot')).toBeInTheDocument();
    expect(screen.getByText('Hello user')).toBeInTheDocument();
  });

  it('should call handleCopyMessage when copy button is clicked', async () => {
    const handleCopyMessage = vi.fn();
    const mockChatHistory = [
      { id: '1', text: 'Bot response to copy', sender: 'bot', timestamp: new Date() },
    ];
    vi.mocked(useChatbotLogic).mockReturnValue({
      ...mockUseChatbotLogicReturn,
      isExpanded: true,
      chatHistory: mockChatHistory,
      hasChatHistory: true,
      handleCopyMessage,
    });

    render(<ChatbotUI chatbotData={mockChatbotData} loadingChatbotData={false} />);

    await userEvent.click(screen.getByRole('button', { name: /Copy/i }));
    expect(handleCopyMessage).toHaveBeenCalledWith('Bot response to copy');
  });

  it('should call handleFeedback when feedback button is clicked', async () => {
    const handleFeedback = vi.fn();
    const mockChatHistory = [
      { id: '1', text: 'Bot response', sender: 'bot', timestamp: new Date() },
    ];
    vi.mocked(useChatbotLogic).mockReturnValue({
      ...mockUseChatbotLogicReturn,
      isExpanded: true,
      chatHistory: mockChatHistory,
      hasChatHistory: true,
      handleFeedback,
    });

    render(<ChatbotUI chatbotData={mockChatbotData} loadingChatbotData={false} />);

    await userEvent.click(screen.getByRole('button', { name: /Share your feedback/i, hidden: true })); // ThumbsUp button
    expect(handleFeedback).toHaveBeenCalledWith('up', '1');
  });

  it('should display login modal when showLoginModal is true', () => {
    vi.mocked(useChatbotLogic).mockReturnValue({
      ...mockUseChatbotLogicReturn,
      showLoginModal: true,
    });

    render(<ChatbotUI chatbotData={mockChatbotData} loadingChatbotData={false} />);

    expect(ChatbotLoginModal).toHaveBeenCalledWith(
      expect.objectContaining({ isOpen: true }),
      {}
    );
  });

  it('should display LeadCollectionForm when showLeadForm is true', () => {
    vi.mocked(useChatbotLogic).mockReturnValue({
      ...mockUseChatbotLogicReturn,
      isExpanded: true,
      showLeadForm: true,
      internalChatbotData: { ...mockChatbotData, lead_form_fields: [{ id: 'name', type: 'text', label: 'Name', required: true, order: 0 }] },
    });

    render(<ChatbotUI chatbotData={mockChatbotData} loadingChatbotData={false} />);

    expect(LeadCollectionForm).toHaveBeenCalledWith(
      expect.objectContaining({ fields: expect.any(Array) }),
      {}
    );
  });

  it('should display LinkedIn prompt when showLinkedInPrompt is true', () => {
    vi.mocked(useChatbotLogic).mockReturnValue({
      ...mockUseChatbotLogicReturn,
      isExpanded: true,
      showLinkedInPrompt: true,
    });

    render(<ChatbotUI chatbotData={mockChatbotData} loadingChatbotData={false} />);

    expect(screen.getByText('Would you like to share your LinkedIn profile?')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your LinkedIn URL')).toBeInTheDocument();
  });

  it('should call handleCtaButtonClick when CTA button is clicked', async () => {
    const handleCtaButtonClick = vi.fn();
    vi.mocked(useChatbotLogic).mockReturnValue({
      ...mockUseChatbotLogicReturn,
      isExpanded: true,
      internalChatbotData: { ...mockChatbotData, cta_buttons: [{ label: 'Test CTA', url: 'http://test.com' }] },
      handleCtaButtonClick,
    });

    render(<ChatbotUI chatbotData={mockChatbotData} loadingChatbotData={false} />);

    await userEvent.click(screen.getByRole('button', { name: /Test CTA/i }));
    expect(handleCtaButtonClick).toHaveBeenCalledWith(0, 'http://test.com');
  });

  it('should apply dynamic colors to document.documentElement.style', () => {
    render(<ChatbotUI chatbotData={mockChatbotData} loadingChatbotData={false} />);

    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--widget-primary', expect.any(String));
    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--widget-bubble', expect.any(String));
    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--widget-text', expect.any(String));
  });
});
