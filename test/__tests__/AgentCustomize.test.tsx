import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AgentCustomize from '@/pages/AgentCustomize';
import { BrowserRouter } from 'react-router-dom';
import { AgentService } from '@/services/agentService';

// Mock window.confirm
const confirmSpy = vi.spyOn(window, 'confirm');
confirmSpy.mockReturnValue(true);

// Mock components that are complex to test
import { useState, useEffect } from 'react';

vi.mock('@/components/ChatbotUI', () => ({
  default: ({ chatbotData }: any) => {
    const [internalChatbotData, setInternalChatbotData] = useState(chatbotData);

    useEffect(() => {
      setInternalChatbotData(chatbotData);
    }, [chatbotData]);

    return (
      <div data-testid="chatbot-preview">
        Preview: {internalChatbotData?.name || 'No name'}
      </div>
    );
  },
}));

// Mock AgentService
vi.mock('@/services/agentService', () => ({
  AgentService: {
    getAgent: vi.fn(() => Promise.resolve({
      id: '1',
      name: 'Test Agent',
      description: 'A test agent',
      avatar_url: '',
      welcome_message: 'Hello! How can I help you today?',
      cta_buttons: [],
      rotating_messages: [],
      messages: [],
      suggested_prompts: [],
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
      linkedin_url: '',
      linkedin_prompt_message_count: 0,
    })),
    createAgent: vi.fn(() => Promise.resolve({ id: 'new-agent-id' })),
    updateAgent: vi.fn(() => Promise.resolve()),
  },
}));

const renderAgentCustomize = async () => {
  const { container } = render(
    <BrowserRouter>
      <AgentCustomize />
    </BrowserRouter>
  );
  await waitFor(() => {
    expect(screen.queryByText("Loading agent...")).not.toBeInTheDocument();
  });
  return container;
};

describe('AgentCustomize - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update agent name and show in preview', async () => {
    const user = userEvent.setup();
    await renderAgentCustomize();

    const nameInput = await screen.findByLabelText(/Agent Name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'New Agent Name');

    expect(nameInput).toHaveValue('New Agent Name');

    await waitFor(() => {
      expect(screen.getByTestId('chatbot-preview')).toHaveTextContent('Preview: New Agent Name');
    });
  });

  it('should add new rotating message', async () => {
    const user = userEvent.setup();
    await renderAgentCustomize();

    const promptsTab = await screen.findByRole('tab', { name: /Rotating Messages/i });
    await act(async () => {
      await user.click(promptsTab);
    });
    await waitFor(() => expect(screen.getByTestId('prompts-tab-content')).toBeVisible());

    const messageInput = await screen.findByPlaceholderText(/Add a rotating message/i);
    const addButton = await screen.findByRole('button', { name: /Add rotating message/i });

    await act(async () => {
      await user.type(messageInput, 'This is a unique test message.');
      await user.click(addButton);
    });

    expect(screen.getByText('This is a unique test message.')).toBeInTheDocument();
    expect(messageInput).toHaveValue('');
  }, 10000);
    

  it('should enable lead collection and show options', async () => {
    const user = userEvent.setup();
    await renderAgentCustomize();

    const leadTab = await screen.findByRole('tab', { name: /Lead Collection/i });
    await waitFor(() => user.click(leadTab));

    const enableSwitch = screen.getByRole('switch', { name: /enable lead collection/i });
    await user.click(enableSwitch);

    expect(enableSwitch).toBeChecked();
    expect(screen.getByText(/Keyword Triggers/i)).toBeInTheDocument();
  });

  it('should add keyword trigger', async () => {
    const user = userEvent.setup();
    await renderAgentCustomize();

    const leadTab = await screen.findByRole('tab', { name: /Lead Collection/i });
    await waitFor(() => user.click(leadTab));

    const enableSwitch = screen.getByRole('switch', { name: /enable lead collection/i });
    await user.click(enableSwitch);

    const keywordsInput = await waitFor(() => screen.findByPlaceholderText(/linkedin, contact, follow/i));
    const addButton = await screen.findByRole('button', { name: /Add keyword trigger/i });

    await user.type(keywordsInput, 'pricing, quote, cost');
    await user.click(addButton);

    expect(screen.getByText('pricing, quote, cost')).toBeInTheDocument();
  });

  it('should update primary color', async () => {
    const user = userEvent.setup();
    await renderAgentCustomize();

    const styleTab = await screen.findByRole('tab', { name: /Style/i });
    await user.click(styleTab);

    const primaryColorInput = await screen.findByLabelText(/primary color/i);
    fireEvent.change(primaryColorInput, { target: { value: '#FF0000' } });
    // Expect the input value to reflect the change
    expect(primaryColorInput).toHaveValue('#ff0000');
  });

  it('should reset appearance to defaults', async () => {
    const user = userEvent.setup();
    await renderAgentCustomize();

    const styleTab = await screen.findByRole('tab', { name: /Style/i });
    await user.click(styleTab);

    const resetButton = screen.getByRole('button', { name: /reset appearance/i });
    await user.click(resetButton);

    // Confirm the action in the dialog
    const confirmButton = await screen.findByRole('button', { name: /confirm|reset/i });
    await user.click(confirmButton);

    // Check that colors are reset to defaults
    const primaryColorInput = screen.getByLabelText(/primary color/i);
    expect(primaryColorInput).toHaveValue('#3b82f6');
  });

  it('should show validation error for missing required fields on save', async () => {
    const user = userEvent.setup();
    await renderAgentCustomize();

    const nameInput = await screen.findByLabelText(/agent name/i);
    await user.clear(nameInput);

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/agent name is required/i)).toBeInTheDocument();
    });
  });

  it('should show unsaved changes indicator', async () => {
    const user = userEvent.setup();
    await renderAgentCustomize();

    const nameInput = await screen.findByLabelText(/agent name/i);
    await act(async () => {
      await user.type(nameInput, 'Modified Name');
    });

    await waitFor(() => {
      expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
    });
  });
});
