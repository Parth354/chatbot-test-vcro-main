import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RotatingMessagesTab } from '@/components/agent-customize/RotatingMessagesTab';

describe('RotatingMessagesTab (Isolated)', () => {
  const mockFormData = {
    name: '',
    description: '',
    avatar_url: '',
    welcome_message: 'Hello!',
    cta_buttons: [],
    rotating_messages: [],
    colors: {
      primary: "#3B82F6",
      bubble: "#F3F4F6",
      text: "#1F2937"
    },
    status: 'active',
    lead_collection_enabled: false,
    lead_form_triggers: [],
    lead_backup_trigger: { enabled: false, message_count: 5 },
    lead_form_fields: [],
    lead_submit_text: 'Submit',
    lead_success_message: 'Thank you! We will get back to you soon.',
    ai_model_config: { model_name: "gpt-3.5-turbo" },
    openai_api_key: '',
    ai_mode: 'chat_completion',
    openai_assistant_id: '',
  };

  const mockHandleInputChange = vi.fn();
  const mockSetNewMessage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the input and add button', () => {
    render(
      <RotatingMessagesTab
        formData={mockFormData}
        handleInputChange={mockHandleInputChange}
        newMessage=""
        setNewMessage={mockSetNewMessage}
      />
    );

    expect(screen.getByPlaceholderText(/Add a rotating message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add rotating message/i })).toBeInTheDocument();
  });

  it('adds a new rotating message when button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <RotatingMessagesTab
        formData={mockFormData}
        handleInputChange={mockHandleInputChange}
        newMessage="Test Message"
        setNewMessage={mockSetNewMessage}
      />
    );

    const addButton = screen.getByRole('button', { name: /Add rotating message/i });
    await user.click(addButton);

    expect(mockHandleInputChange).toHaveBeenCalledWith(
      'rotating_messages',
      [ 'Test Message' ]
    );
    expect(mockSetNewMessage).toHaveBeenCalledWith('');
  });

  it('removes a rotating message when its remove button is clicked', async () => {
    const user = userEvent.setup();
    const formDataWithMessages = {
      ...mockFormData,
      rotating_messages: ['Message 1', 'Message 2'],
    };

    render(
      <RotatingMessagesTab
        formData={formDataWithMessages}
        handleInputChange={mockHandleInputChange}
        newMessage=""
        setNewMessage={mockSetNewMessage}
      />
    );

    const removeButton = screen.getAllByRole('button', { name: /Remove rotating message/i })[0];
    await user.click(removeButton);

    expect(mockHandleInputChange).toHaveBeenCalledWith(
      'rotating_messages',
      [ 'Message 2' ]
    );
  });
});
