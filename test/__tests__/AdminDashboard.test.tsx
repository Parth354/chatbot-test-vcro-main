import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import AdminDashboard from '@/pages/AdminDashboard';
import { AgentService } from '@/services/agentService';
import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useToast } from '@/hooks/use-toast';

// Mock AgentService
vi.mock('@/services/agentService', () => ({
  AgentService: {
    getAgents: vi.fn(),
    getAgentMetrics: vi.fn(),
    getAdminMetrics: vi.fn(),
  },
}));

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));



// Mock useNavigate explicitly
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

describe('AdminDashboard', () => {
  const mockNavigate = vi.fn();
  const mockSignOut = vi.fn();
  const mockSignInWithGoogleForAdmin = vi.fn();

  const mockAdminUser = {
    id: 'admin-user-id',
    email: 'admin@example.com',
    user_metadata: { full_name: 'Admin User' },
  };

  const mockAdminProfile = {
    id: 'admin-profile-id',
    user_id: 'admin-user-id',
    email: 'admin@example.com',
    role: 'admin',
    created_at: '',
    updated_at: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock useNavigate before rendering
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    // Default mock for useAuth: logged in admin
    vi.mocked(useAuth).mockReturnValue({
      user: mockAdminUser,
      profile: mockAdminProfile,
      session: {} as any, // Mock a session object
      loading: false,
      signOut: mockSignOut,
      signInWithGoogle: vi.fn(),
      signInWithGoogleForAdmin: mockSignInWithGoogleForAdmin,
      signInWithPasswordForAdmin: vi.fn(),
      signUp: vi.fn(),
    });

    // Default mock for AgentService
    vi.mocked(AgentService.getAgents).mockResolvedValue([]);
    vi.mocked(AgentService.getAgentMetrics).mockResolvedValue({
      totalSessions: 0,
      totalMessages: 0,
      todayMessages: 0,
      yesterdayMessages: 0,
      leadsRequiringAttention: 0,
      averageResponseTime: 'N/A',
      satisfactionRate: 'N/A',
    });
    vi.mocked(AgentService.getAdminMetrics).mockResolvedValue({
      totalSessions: 0,
      totalMessages: 0,
      todayMessages: 0,
      yesterdayMessages: 0,
      leadsRequiringAttention: 0,
      averageResponseTime: 'N/A',
      satisfactionRate: 'N/A',
    });
  });

  const renderAdminDashboard = (initialEntries = ['/admin']) => {
    render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/auth" element={<div>Auth Page</div>} /> {/* Mock Auth page for redirection */}
          <Route path="/" element={<div>Home Page</div>} /> {/* Mock Home page for redirection */}
          <Route path="/admin/agent/new/customize" element={<div>Create Agent Page</div>} />
          <Route path="/admin/agent/:agentId/customize" element={<div>Customize Agent Page</div>} />
          <Route path="/admin/agent/:agentId/history" element={<div>Agent History Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('should render loading state initially', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      profile: null,
      session: null, // Added missing property
      loading: true,
      signOut: mockSignOut,
      signInWithGoogle: vi.fn(), // Added missing property
      signInWithGoogleForAdmin: mockSignInWithGoogleForAdmin,
      signInWithPasswordForAdmin: vi.fn(), // Added missing property
      signUp: vi.fn(), // Added missing property
    });
    renderAdminDashboard();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should redirect to login if not authenticated', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      signOut: mockSignOut,
      signInWithGoogleForAdmin: mockSignInWithGoogleForAdmin,
    });
    renderAdminDashboard();
    await waitFor(() => {
      expect(screen.getByText('Auth Page')).toBeInTheDocument();
    });
  });

  it('should display overall metrics and agent list', async () => {
    const mockAgents = [
      { id: 'agent-1', name: 'Agent Alpha', description: 'Desc A', status: 'active', avatar_url: '', welcome_message: '', cta_buttons: [], rotating_messages: [], colors: {primary:'', bubble:'', text:''}, lead_collection_enabled: false, lead_form_triggers: [], lead_backup_trigger: {enabled:false, message_count:0}, lead_form_fields: [], lead_submit_text: '', lead_success_message: '', total_messages: 100, total_conversations: 10 },
      { id: 'agent-2', name: 'Agent Beta', description: 'Desc B', status: 'inactive', avatar_url: '', welcome_message: '', cta_buttons: [], rotating_messages: [], colors: {primary:'', bubble:'', text:''}, lead_collection_enabled: false, lead_form_triggers: [], lead_backup_trigger: {enabled:false, message_count:0}, lead_form_fields: [], lead_submit_text: '', lead_success_message: '', total_messages: 50, total_conversations: 5 },
    ];
    vi.mocked(AgentService.getAgents).mockResolvedValue(mockAgents);
    vi.mocked(AgentService.getAgentMetrics).mockImplementation((agentId) => {
      if (agentId === 'agent-1') return Promise.resolve({ totalSessions: 10, totalMessages: 100, todayMessages: 5, yesterdayMessages: 2, leadsRequiringAttention: 1, averageResponseTime: '< 1 min', satisfactionRate: '90%' });
      if (agentId === 'agent-2') return Promise.resolve({ totalSessions: 5, totalMessages: 50, todayMessages: 1, yesterdayMessages: 0, leadsRequiringAttention: 0, averageResponseTime: '< 1 min', satisfactionRate: '80%' });
      return Promise.resolve({ totalSessions: 0, totalMessages: 0, todayMessages: 0, yesterdayMessages: 0, leadsRequiringAttention: 0, averageResponseTime: 'N/A', satisfactionRate: 'N/A' });
    });

    renderAdminDashboard();

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Welcome back, admin@example.com')).toBeInTheDocument();
      expect(screen.getByText('Total Agents')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Total Agents count
      expect(screen.getByText('Agent Alpha')).toBeInTheDocument();
      expect(screen.getByText('Agent Beta')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('inactive')).toBeInTheDocument();
    });
  });

  it('should navigate to create new agent page', async () => {
    renderAdminDashboard();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create New Agent/i })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('button', { name: /Create New Agent/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/agent/new/customize');
  });

  it('should navigate to customize agent page', async () => {
    const mockAgents = [
      { id: 'agent-1', name: 'Agent Alpha', description: 'Desc A', status: 'active', avatar_url: '', welcome_message: '', cta_buttons: [], rotating_messages: [], colors: {primary:'', bubble:'', text:''}, lead_collection_enabled: false, lead_form_triggers: [], lead_backup_trigger: {enabled:false, message_count:0}, lead_form_fields: [], lead_submit_text: '', lead_success_message: '', total_messages: 100, total_conversations: 10 },
    ];
    vi.mocked(AgentService.getAgents).mockResolvedValue(mockAgents);
    vi.mocked(AgentService.getAgentMetrics).mockResolvedValue({
      totalSessions: 0, totalMessages: 0, todayMessages: 0, yesterdayMessages: 0, leadsRequiringAttention: 0, averageResponseTime: 'N/A', satisfactionRate: 'N/A',
    });
    renderAdminDashboard();
    await waitFor(() => {
      expect(screen.getByText('Agent Alpha')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('button', { name: /Settings/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/agent/agent-1/customize');
  });

  it('should navigate to view history page', async () => {
    const mockAgents = [
      { id: 'agent-1', name: 'Agent Alpha', description: 'Desc A', status: 'active', avatar_url: '', welcome_message: '', cta_buttons: [], rotating_messages: [], colors: {primary:'', bubble:'', text:''}, lead_collection_enabled: false, lead_form_triggers: [], lead_backup_trigger: {enabled:false, message_count:0}, lead_form_fields: [], lead_submit_text: '', lead_success_message: '', total_messages: 100, total_conversations: 10 },
    ];
    vi.mocked(AgentService.getAgents).mockResolvedValue(mockAgents);
    vi.mocked(AgentService.getAgentMetrics).mockResolvedValue({
      totalSessions: 0, totalMessages: 0, todayMessages: 0, yesterdayMessages: 0, leadsRequiringAttention: 0, averageResponseTime: 'N/A', satisfactionRate: 'N/A',
    });
    renderAdminDashboard();
    await waitFor(() => {
      expect(screen.getByText('Agent Alpha')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('button', { name: /Chat History/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/agent/agent-1/history');
  });

  it('should call signOut when Sign Out button is clicked', async () => {
    renderAdminDashboard();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Sign Out/i })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('button', { name: /Sign Out/i }));
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('should display no agents message if no agents are found', async () => {
    vi.mocked(AgentService.getAgents).mockResolvedValue([]);
    renderAdminDashboard();
    await waitFor(() => {
      expect(screen.getByText('No agents yet')).toBeInTheDocument();
      expect(screen.getByText('Get started by creating your first AI chatbot agent')).toBeInTheDocument();
    });
  });

  it('should display error toast if loading agents fails', async () => {
    const mockToast = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      user: mockAdminUser,
      profile: mockAdminProfile,
      loading: false,
      signOut: mockSignOut,
      signInWithGoogleForAdmin: mockSignInWithGoogleForAdmin,
    });
    vi.mocked(AgentService.getAgents).mockRejectedValue(new Error('Failed to fetch'));
    vi.mocked(useToast).mockReturnValue({ toast: mockToast });

    renderAdminDashboard();

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error',
        description: 'Failed to load agents or metrics. Please try again.',
        variant: 'destructive',
      }));
    });
  });
});