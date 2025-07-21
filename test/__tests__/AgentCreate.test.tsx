import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AgentCreate from '@/pages/AgentCreate';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { AgentService } from '@/services/agentService';
import { validateAgentData } from '@/schemas/agentValidation';
import ChatbotUI from '@/components/ChatbotUI';

// Mock dependencies
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

vi.mock('@/services/agentService', () => ({
  AgentService: {
    createAgent: vi.fn(),
  },
}));

vi.mock('@/schemas/agentValidation', () => ({
  validateAgentData: vi.fn(),
}));

// Mock ChatbotUI to avoid rendering its complex internal logic
vi.mock('@/components/ChatbotUI', () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="mock-chatbot-ui">Mock Chatbot UI</div>),
}));

describe('AgentCreate', () => {
  const mockNavigate = vi.fn();
  const mockToast = vi.fn();
  const mockUser = { id: 'user-123', email: 'test@example.com' };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      profile: { role: 'admin' },
      loading: false,
    });
    vi.mocked(useToast).mockReturnValue({ toast: mockToast });
    vi.mocked(AgentService.createAgent).mockResolvedValue({ id: 'new-agent-id' } as any);
    vi.mocked(validateAgentData).mockReturnValue({ success: true, data: {}, errors: [] });

    vi.mock('react-router-dom', async (importOriginal) => {
      const actual = await importOriginal();
      return {
        ...actual,
        useNavigate: () => mockNavigate,
      };
    });
  });

  const renderAgentCreate = () => {
    render(
      <MemoryRouter initialEntries={['/admin/agent/new/customize']}>
        <Routes>
          <Route path="/admin/agent/new/customize" element={<AgentCreate />} />
          <Route path="/admin" element={<div>Admin Dashboard</div>} />
          <Route path="/admin/agent/:agentId/customize" element={<div>Customize Agent Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('should render the AgentCreate form', () => {
    renderAgentCreate();
    expect(screen.getByText('Create New Agent')).toBeInTheDocument();
    expect(screen.getByLabelText('Agent Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Welcome Message *')).toBeInTheDocument();
    expect(screen.getByText('Live Preview')).toBeInTheDocument();
    expect(screen.getByTestId('mock-chatbot-ui')).toBeInTheDocument();
  });

  it('should update form data on input change', async () => {
    renderAgentCreate();
    const agentNameInput = screen.getByLabelText('Agent Name *');
    await userEvent.type(agentNameInput, 'My New Agent');
    expect(agentNameInput).toHaveValue('My New Agent');

    const welcomeMessageInput = screen.getByLabelText('Welcome Message *');
    await userEvent.type(welcomeMessageInput, 'Welcome to my new agent!');
    expect(welcomeMessageInput).toHaveValue('Welcome to my new agent!');
  });

  it('should display validation errors', async () => {
    vi.mocked(validateAgentData).mockReturnValue({
      success: false,
      data: {},
      errors: [
        { field: 'name', message: 'Agent name is required' },
        { field: 'welcome_message', message: 'Welcome message is required' },
      ],
    });

    renderAgentCreate();
    await userEvent.click(screen.getByRole('button', { name: /Create Agent/i }));

    await waitFor(() => {
      expect(screen.getByText('Agent name is required')).toBeInTheDocument();
      expect(screen.getByText('Welcome message is required')).toBeInTheDocument();
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ description: 'Please fix the errors before saving.' }));
    });
  });

  it('should create agent and navigate on successful save', async () => {
    renderAgentCreate();

    await userEvent.type(screen.getByLabelText('Agent Name *'), 'Successful Agent');
    await userEvent.type(screen.getByLabelText('Welcome Message *'), 'Hello from successful agent!');

    await userEvent.click(screen.getByRole('button', { name: /Create Agent/i }));

    await waitFor(() => {
      expect(AgentService.createAgent).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Successful Agent',
        welcome_message: 'Hello from successful agent!',
        user_id: mockUser.id,
      }));
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success', description: 'Agent created successfully!' }));
      expect(mockNavigate).toHaveBeenCalledWith('/admin/agent/new-agent-id/customize');
    });
  });

  it('should display error toast if agent creation fails', async () => {
    vi.mocked(AgentService.createAgent).mockRejectedValue(new Error('API Error'));

    renderAgentCreate();

    await userEvent.type(screen.getByLabelText('Agent Name *'), 'Failing Agent');
    await userEvent.type(screen.getByLabelText('Welcome Message *'), 'Hello from failing agent!');

    await userEvent.click(screen.getByRole('button', { name: /Create Agent/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error',
        description: 'Failed to create agent. Please try again.',
        variant: 'destructive',
      }));
    });
  });

  it('should reset appearance to default values', async () => {
    renderAgentCreate();

    // Change some values first
    const agentNameInput = screen.getByLabelText('Agent Name *');
    await userEvent.type(agentNameInput, 'Changed Name');

    // Click reset button
    await userEvent.click(screen.getByRole('button', { name: /Reset Appearance/i }));

    // Confirm dialog
    fireEvent.click(screen.getByText('OK')); // Assuming a simple confirm dialog

    await waitFor(() => {
      // Check if values are reset (e.g., name is empty, welcome message is default)
      expect(agentNameInput).toHaveValue('Changed Name'); // Name is not reset by this function
      expect(screen.getByLabelText('Welcome Message *')).toHaveValue('Hello! How can I help you today?');
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Reset Complete' }));
    });
  });

  it('should show unsaved changes badge when form data changes', async () => {
    renderAgentCreate();
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();

    const agentNameInput = screen.getByLabelText('Agent Name *');
    await userEvent.type(agentNameInput, 'A');

    await waitFor(() => {
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });
  });

  it('should navigate back to admin dashboard', async () => {
    renderAgentCreate();
    await userEvent.click(screen.getByRole('button', { name: /Back/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/admin');
  });
});
