import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { PersonalizationTab } from '@/components/agent-customize/PersonalizationTab';

describe('PersonalizationTab', () => {
  const mockHandleInputChange = vi.fn();

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
  });

  it('should render LinkedIn Profile URL input', () => {
    render(
      <PersonalizationTab
        formData={defaultFormData}
        handleInputChange={mockHandleInputChange}
      />
    );
    expect(screen.getByLabelText('LinkedIn Profile URL')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('https://www.linkedin.com/in/your-profile')).toBeInTheDocument();
  });

  it('should render LinkedIn Prompt Message Count input', () => {
    render(
      <PersonalizationTab
        formData={defaultFormData}
        handleInputChange={mockHandleInputChange}
      />
    );
    expect(screen.getByLabelText('LinkedIn Prompt Message Count')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0')).toBeInTheDocument();
  });

  it('should call handleInputChange when LinkedIn Profile URL is changed', async () => {
    render(
      <PersonalizationTab
        formData={defaultFormData}
        handleInputChange={mockHandleInputChange}
      />
    );
    const input = screen.getByLabelText('LinkedIn Profile URL');
    await userEvent.type(input, 'https://www.linkedin.com/in/johndoe');
    expect(mockHandleInputChange).toHaveBeenCalledWith('linkedin_url', 'https://www.linkedin.com/in/johndoe');
  });

  it('should call handleInputChange when LinkedIn Prompt Message Count is changed', async () => {
    render(
      <PersonalizationTab
        formData={defaultFormData}
        handleInputChange={mockHandleInputChange}
      />
    );
    const input = screen.getByLabelText('LinkedIn Prompt Message Count');
    await userEvent.clear(input);
    await userEvent.type(input, '5');
    expect(mockHandleInputChange).toHaveBeenCalledWith('linkedin_prompt_message_count', 5);
  });

  it('should display current formData values', () => {
    const formDataWithValues = {
      ...defaultFormData,
      linkedin_url: 'https://www.linkedin.com/in/testuser',
      linkedin_prompt_message_count: 10,
    };
    render(
      <PersonalizationTab
        formData={formDataWithValues}
        handleInputChange={mockHandleInputChange}
      />
    );
    expect(screen.getByDisplayValue('https://www.linkedin.com/in/testuser')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
  });
});
