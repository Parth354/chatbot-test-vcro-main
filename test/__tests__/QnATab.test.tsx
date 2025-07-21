import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi ,expect } from 'vitest';
import { QnATab } from '@/components/QnATab';
import { PromptResponseService } from '@/services/promptResponseService';
import { useToast } from '@/hooks/use-toast';

// Mock PromptResponseService
vi.mock('@/services/promptResponseService', () => ({
  PromptResponseService: {
    getPromptResponses: vi.fn(),
    createPromptResponse: vi.fn(),
    updatePromptResponse: vi.fn(),
    deletePromptResponse: vi.fn(),
  },
}));



describe('QnATab', () => {
  const agentId = 'agent-123';

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for getPromptResponses to return empty array
    vi.mocked(PromptResponseService.getPromptResponses).mockResolvedValue([]);
  });

  it('should render loading state initially', () => {
    vi.mocked(PromptResponseService.getPromptResponses).mockReturnValueOnce(new Promise(() => {})); // Pending promise
    render(<QnATab agentId={agentId} />);
    expect(screen.getByText('Loading Q&A pairs...')).toBeInTheDocument();
  });

  it('should display no suggested prompts message when none exist', async () => {
    render(<QnATab agentId={agentId} />);
    await waitFor(() => {
      expect(screen.getByText('No suggested prompts yet. Create your first Q&A pair above.')).toBeInTheDocument();
    });
  });

  it('should display no dynamic prompts message when none exist', async () => {
    render(<QnATab agentId={agentId} />);
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Dynamic Prompts/i })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('tab', { name: /Dynamic Prompts/i }));
    await waitFor(() => {
      expect(screen.getByText('No dynamic prompts yet. Create keyword-based responses above.')).toBeInTheDocument();
    });
  });

  it('should load and display existing suggested prompts', async () => {
    const mockSuggested = [
      { id: 's1', agent_id: agentId, prompt: 'What is your name?', response: 'I am a chatbot.', is_dynamic: false, created_at: '', updated_at: '' },
    ];
    vi.mocked(PromptResponseService.getPromptResponses).mockResolvedValue(mockSuggested);

    render(<QnATab agentId={agentId} />);
    await waitFor(() => {
      expect(screen.getByText('What is your name?')).toBeInTheDocument();
      expect(screen.getByText('I am a chatbot.')).toBeInTheDocument();
    });
  });

  it('should load and display existing dynamic prompts', async () => {
    const mockDynamic = [
      { id: 'd1', agent_id: agentId, prompt: 'Pricing', response: 'Our pricing is...', is_dynamic: true, keywords: ['price', 'cost'], created_at: '', updated_at: '' },
    ];
    vi.mocked(PromptResponseService.getPromptResponses).mockResolvedValue(mockDynamic);

    render(<QnATab agentId={agentId} />);
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Dynamic Prompts/i })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('tab', { name: /Dynamic Prompts/i }));
    await waitFor(() => {
      expect(screen.getByText('Pricing')).toBeInTheDocument();
      expect(screen.getByText('Our pricing is...')).toBeInTheDocument();
      expect(screen.getByText('price')).toBeInTheDocument();
      expect(screen.getByText('cost')).toBeInTheDocument();
    });
  });

  it('should open and close the add/edit Q&A pair dialog', async () => {
    render(<QnATab agentId={agentId} />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Q&A Pair/i })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('button', { name: /Add Q&A Pair/i }));
    expect(screen.getByRole('dialog', { name: /Add New Q&A Pair/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should create a new suggested Q&A pair', async () => {
    const newPrompt = 'New Suggested Question';
    const newResponse = 'New Suggested Answer';
    vi.mocked(PromptResponseService.createPromptResponse).mockResolvedValue({} as any);
    vi.mocked(PromptResponseService.getPromptResponses).mockResolvedValueOnce([]).mockResolvedValueOnce([
      { id: 'new-id', agent_id: agentId, prompt: newPrompt, response: newResponse, is_dynamic: false, created_at: '', updated_at: '' },
    ]);

    render(<QnATab agentId={agentId} />);
    const addButton = await screen.findByRole('button', { name: /Add Q&A Pair/i });
    await userEvent.click(addButton);

    const dialog = await screen.findByRole('dialog', { name: /Add New Q&A Pair/i });
    await userEvent.type(within(dialog).getByLabelText(/Prompt/), newPrompt);
    await userEvent.type(within(dialog).getByLabelText(/Response/), newResponse);
    await userEvent.click(within(dialog).getByRole('button', { name: /Create Q&A Pair/i }));

    await waitFor(() => {
      expect(PromptResponseService.createPromptResponse).toHaveBeenCalledWith({
        agent_id: agentId,
        prompt: newPrompt,
        response: newResponse,
        is_dynamic: false,
        keywords: undefined,
      });
    });
    await waitFor(() => {
      expect(vi.mocked(useToast)().toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success' }));
    });
  });

  it('should create a new dynamic Q&A pair with keywords', async () => {
    const newPrompt = 'Dynamic Question';
    const newResponse = 'Dynamic Answer';
    const keywords = 'key1, key2';
    vi.mocked(PromptResponseService.createPromptResponse).mockResolvedValue({} as any);
    vi.mocked(PromptResponseService.getPromptResponses).mockResolvedValueOnce([]).mockResolvedValueOnce([
      { id: 'new-id', agent_id: agentId, prompt: newPrompt, response: newResponse, is_dynamic: true, keywords: ['key1', 'key2'], created_at: '', updated_at: '' },
    ]);

    render(<QnATab agentId={agentId} />);
    const addButton = await screen.findByRole('button', { name: /Add Q&A Pair/i });
    await userEvent.click(addButton);

    const dialog = await screen.findByRole('dialog', { name: /Add New Q&A Pair/i });
    await userEvent.type(within(dialog).getByLabelText(/Prompt/), newPrompt);
    await userEvent.type(within(dialog).getByLabelText(/Response/), newResponse);
    await userEvent.click(within(dialog).getByLabelText(/Dynamic prompt/i)); // Toggle switch
    await userEvent.type(within(dialog).getByLabelText(/Keywords/), keywords);
    await userEvent.click(within(dialog).getByRole('button', { name: /Create Q&A Pair/i }));

    await waitFor(() => {
      expect(PromptResponseService.createPromptResponse).toHaveBeenCalledWith({
        agent_id: agentId,
        prompt: newPrompt,
        response: newResponse,
        is_dynamic: true,
        keywords: ['key1', 'key2'],
      });
      expect(vi.mocked(useToast)().toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success' }));
    });
  });

  it('should edit an existing Q&A pair', async () => {
    const existingPrompt = { id: 'e1', agent_id: agentId, prompt: 'Old Question', response: 'Old Answer', is_dynamic: false, created_at: '', updated_at: '' };
    const updatedResponse = 'Updated Answer';
    vi.mocked(PromptResponseService.getPromptResponses).mockResolvedValue([existingPrompt]);
    vi.mocked(PromptResponseService.updatePromptResponse).mockResolvedValue({} as any);

    render(<QnATab agentId={agentId} />);
    
    const editButton = await screen.findByRole('button', { name: /Edit Old Question/i });
    await userEvent.click(editButton);

    const dialog = await screen.findByRole('dialog', { name: /Edit Q&A Pair/i });
    await userEvent.clear(within(dialog).getByLabelText(/Response/));
    await userEvent.type(within(dialog).getByLabelText(/Response/), updatedResponse);
    await userEvent.click(within(dialog).getByRole('button', { name: /Update Q&A Pair/i }));

    await waitFor(() => {
      expect(PromptResponseService.updatePromptResponse).toHaveBeenCalledWith(existingPrompt.id, {
        agent_id: agentId,
        prompt: existingPrompt.prompt,
        response: updatedResponse,
        is_dynamic: existingPrompt.is_dynamic,
        keywords: undefined,
      });
      expect(vi.mocked(useToast)().toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success' }));
    });
  });

  it('should delete a Q&A pair', async () => {
    const existingPrompt = { id: 'd1', agent_id: agentId, prompt: 'Question to Delete', response: 'Answer to Delete', is_dynamic: false, created_at: '', updated_at: '' };
    vi.mocked(PromptResponseService.getPromptResponses).mockResolvedValue([existingPrompt]);
    vi.mocked(PromptResponseService.deletePromptResponse).mockResolvedValue({} as any);

    render(<QnATab agentId={agentId} />);
    const deleteButton = await screen.findByRole('button', { name: /Delete Question to Delete/i });
    await userEvent.click(deleteButton);

    await waitFor(() => {
      expect(PromptResponseService.deletePromptResponse).toHaveBeenCalledWith(existingPrompt.id);
      expect(vi.mocked(useToast)().toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success' }));
    });
  });

  it('should display error toast if prompt or response is empty on submit', async () => {
    render(<QnATab agentId={agentId} />);
    const addButton = await screen.findByRole('button', { name: /Add Q&A Pair/i });
    await userEvent.click(addButton);

    const dialog = await screen.findByRole('dialog', { name: /Add New Q&A Pair/i });
    await userEvent.click(within(dialog).getByRole('button', { name: /Create Q&A Pair/i }));

    await waitFor(() => {
      expect(vi.mocked(useToast)().toast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Validation Error',
        description: 'Both prompt and response are required',
        variant: 'destructive',
      }));
    });
    expect(PromptResponseService.createPromptResponse).not.toHaveBeenCalled();
  });

  it('should display error toast if creating Q&A pair fails', async () => {
    vi.mocked(PromptResponseService.createPromptResponse).mockRejectedValue(new Error('API Error'));
    vi.mocked(PromptResponseService.getPromptResponses).mockResolvedValueOnce([]);

    render(<QnATab agentId={agentId} />);
    const addButton = await screen.findByRole('button', { name: /Add Q&A Pair/i });
    await userEvent.click(addButton);

    const dialog = await screen.findByRole('dialog', { name: /Add New Q&A Pair/i });
    await userEvent.type(within(dialog).getByLabelText(/Prompt/), 'Test');
    await userEvent.type(within(dialog).getByLabelText(/Response/), 'Test');
    await userEvent.click(within(dialog).getByRole('button', { name: /Create Q&A Pair/i }));

    await waitFor(() => {
      expect(vi.mocked(useToast)().toast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error',
        description: 'Failed to save Q&A pair',
        variant: 'destructive',
      }));
    });
  });
});
