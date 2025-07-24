import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, vi } from 'vitest';
import { AiSettingsTab } from '@/components/agent-customize/AiSettingsTab';
import { OpenAIService } from '@/services/openAIService';
import { useToast } from '@/hooks/use-toast';

// Mock OpenAIService
export const mockListModels = vi.fn();
export const mockListAssistants = vi.fn();

vi.mock('@/services/openAIService', () => {
  const mockListModels = vi.fn();
  const mockListAssistants = vi.fn();

  const MockOpenAIService = vi.fn(() => ({
    listModels: mockListModels,
    listAssistants: mockListAssistants,
  }));

  MockOpenAIService.prototype.listModels = mockListModels;
  MockOpenAIService.prototype.listAssistants = mockListAssistants;

  return {
    OpenAIService: MockOpenAIService,
  };
});

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

describe('AiSettingsTab', () => {
  const mockHandleInputChange = vi.fn();
  const mockToast = vi.fn();

  const defaultFormData = {
    name: '',
    description: '',
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
    vi.mocked(useToast).mockReturnValue({ toast: mockToast });
    // Reset OpenAIService mock instance for each test
    vi.mocked(OpenAIService).mockClear();
    mockListModels.mockResolvedValue([]);
    mockListAssistants.mockResolvedValue([]);
  });

  it('should render correctly with default chat completion mode', () => {
    render(
      <AiSettingsTab
        formData={defaultFormData}
        handleInputChange={mockHandleInputChange}
      />
    );

    expect(screen.getByLabelText('AI Mode')).toBeInTheDocument();
    expect(screen.getByText('Chat Completion')).toBeInTheDocument();
    expect(screen.getByLabelText('OpenAI API Key')).toBeInTheDocument();
    expect(screen.getByLabelText('AI Model')).toBeInTheDocument();
    expect(screen.queryByLabelText('OpenAI Assistant')).not.toBeInTheDocument();
  });

  it('should switch to OpenAI Assistant mode', async () => {
    render(
      <AiSettingsTab
        formData={defaultFormData}
        handleInputChange={mockHandleInputChange}
      />
    );

    await userEvent.click(screen.getByTestId('ai-mode-select'));
    await userEvent.click(screen.getByText('OpenAI Assistant'));

    expect(mockHandleInputChange).toHaveBeenCalledWith('ai_mode', 'assistant');
  });

  it('should display OpenAI Assistant fields when in assistant mode', () => {
    const formDataWithAssistantMode = { ...defaultFormData, ai_mode: 'assistant' as const };
    render(
      <AiSettingsTab
        formData={formDataWithAssistantMode}
        handleInputChange={mockHandleInputChange}
      />
    );

    expect(screen.getByLabelText('OpenAI Assistant')).toBeInTheDocument();
    expect(screen.queryByLabelText('AI Model')).not.toBeInTheDocument();
  });

  it('should fetch models when API key is provided and button is clicked', async () => {
    const mockApiKey = "test-api-key";
    const formDataWithKey = { ...defaultFormData, openai_api_key: mockApiKey };
    vi.mocked(OpenAIService.prototype.listModels).mockResolvedValueOnce([{ id: 'gpt-4', name: 'gpt-4' }]);

    render(
      <AiSettingsTab
        formData={formDataWithKey}
        handleInputChange={mockHandleInputChange}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /Fetch Resources/i }));

    await waitFor(() => {
      expect(OpenAIService).toHaveBeenCalledWith({ apiKey: mockApiKey, aiMode: 'chat_completion' });
      expect(OpenAIService.prototype.listModels).toHaveBeenCalled();
    });

    await userEvent.click(screen.getByLabelText('AI Model'));
    expect(await screen.findByText('gpt-4')).toBeInTheDocument();
  });

  it('should fetch assistants when API key is provided and button is clicked', async () => {
    const mockApiKey = "test-api-key";
    const formDataWithKey = { ...defaultFormData, openai_api_key: mockApiKey, ai_mode: 'assistant' as const };
    vi.mocked(OpenAIService.prototype.listAssistants).mockResolvedValueOnce([{ id: 'asst_123', name: 'My Assistant' }]);

    render(
      <AiSettingsTab
        formData={formDataWithKey}
        handleInputChange={mockHandleInputChange}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /Fetch Resources/i }));

    await waitFor(() => {
      expect(OpenAIService).toHaveBeenCalledWith({ apiKey: mockApiKey, aiMode: 'assistant', listOnly: true });
      expect(OpenAIService.prototype.listAssistants).toHaveBeenCalled();
    });

    await userEvent.click(screen.getByLabelText('OpenAI Assistant'));
    expect(await screen.findByText('My Assistant')).toBeInTheDocument();
  });

  it('should show toast error if API key is missing when fetching resources', async () => {
    render(
      <AiSettingsTab
        formData={defaultFormData}
        handleInputChange={mockHandleInputChange}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /Fetch Resources/i }));

    expect(mockToast).toHaveBeenCalledWith({
      title: 'OpenAI API Key Required',
      description: 'Please enter your OpenAI API key to fetch models and assistants.',
      variant: 'destructive',
    });
    expect(OpenAIService.prototype.listModels).not.toHaveBeenCalled();
    expect(OpenAIService.prototype.listAssistants).not.toHaveBeenCalled();
  });

  it('should show toast error if fetching resources fails', async () => {
    const mockApiKey = "test-api-key";
    const formDataWithKey = { ...defaultFormData, openai_api_key: mockApiKey };
    vi.mocked(OpenAIService.prototype.listModels).mockRejectedValue(new Error('Network error'));

    render(
      <AiSettingsTab
        formData={formDataWithKey}
        handleInputChange={mockHandleInputChange}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /Fetch Resources/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'OpenAI Connection Error',
        description: 'Could not fetch models or assistants. Check your API key and ensure it has the necessary permissions.',
        variant: 'destructive',
      });
    });
  });

  it('should display loading state when fetching resources', async () => {
    const mockApiKey = "test-api-key";
    const formDataWithKey = { ...defaultFormData, openai_api_key: mockApiKey };
    vi.mocked(OpenAIService.prototype.listModels).mockReturnValue(new Promise(() => {})); // Keep pending

    render(
      <AiSettingsTab
        formData={formDataWithKey}
        handleInputChange={mockHandleInputChange}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /Fetch Resources/i }));

    expect(screen.getByRole('button', { name: /Fetching.../i })).toBeInTheDocument();
  });

  it('should call handleInputChange when AI Model is selected', async () => {
    const mockApiKey = "test-api-key";
    const formDataWithKey = { ...defaultFormData, openai_api_key: mockApiKey };
    vi.mocked(OpenAIService.prototype.listModels).mockResolvedValueOnce([{ id: 'gpt-4', name: 'gpt-4' }]);

    render(
      <AiSettingsTab
        formData={formDataWithKey}
        handleInputChange={mockHandleInputChange}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /Fetch Resources/i }));
    await userEvent.click(screen.getByLabelText('AI Model'));
    await waitFor(() => {
      expect(screen.getByText('gpt-4')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByLabelText('AI Model'));
    await userEvent.click(screen.getByText('gpt-4'));

    expect(mockHandleInputChange).toHaveBeenCalledWith('ai_model_config', { ...defaultFormData.ai_model_config, model_name: 'gpt-4' });
  });

  it('should call handleInputChange when OpenAI Assistant is selected', async () => {
    const mockApiKey = "test-api-key";
    const formDataWithAssistantMode = { ...defaultFormData, ai_mode: 'assistant' as const, openai_api_key: mockApiKey };
    vi.mocked(OpenAIService.prototype.listAssistants).mockResolvedValueOnce([{ id: 'asst_123', name: 'My Assistant' }]);

    render(
      <AiSettingsTab
        formData={formDataWithAssistantMode}
        handleInputChange={mockHandleInputChange}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /Fetch Resources/i }));
    await userEvent.click(screen.getByLabelText('OpenAI Assistant'));
    await waitFor(() => {
      expect(screen.getByText('My Assistant')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByLabelText('OpenAI Assistant'));
    await userEvent.click(screen.getByText('My Assistant'));

    expect(mockHandleInputChange).toHaveBeenCalledWith('openai_assistant_id', 'asst_123');
  });
});
