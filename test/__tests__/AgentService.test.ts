import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentService } from '@/services/agentService';
import { supabase } from '@/integrations/supabase/client';
import type { CreateAgentData, UpdateAgentData } from '@/types/agent';
import { ConversationService } from '@/services/conversationService';
import { FeedbackService } from '@/services/feedbackService';

// Mock external dependencies
vi.mock('@/integrations/supabase/client', () => {
  const mockChainable = () => {
    const obj: any = {};
    obj.eq = vi.fn(() => obj);
    obj.in = vi.fn(() => obj);
    obj.order = vi.fn(() => obj);
    obj.limit = vi.fn(() => obj);
    obj.range = vi.fn(() => obj);
    obj.single = vi.fn();
    obj.maybeSingle = vi.fn();
    obj.then = vi.fn(); // For direct promise resolution
    obj.gte = vi.fn(() => obj); // Add gte
    obj.lt = vi.fn(() => obj); // Add lt
    obj.or = vi.fn(() => obj); // Add or
    return obj;
  };

  const mockFrom = vi.fn((tableName) => {
    const chain = mockChainable();
    // Specific mocks for insert, update, delete which might not return chainable objects in the same way
    chain.insert = vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn() })) }));
    chain.update = vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn() })) })) }));
    chain.delete = vi.fn(() => ({ eq: vi.fn(() => ({ then: vi.fn() })) }));

    // Override select to return a chainable object
    chain.select = vi.fn(() => mockChainable());

    return chain;
  });

  return {
    supabase: {
      from: mockFrom,
      auth: {
        getUser: vi.fn(),
      },
    },
  };
});

vi.mock('@/services/conversationService', () => ({
  ConversationService: {
    getChatSessions: vi.fn(),
  },
}));

vi.mock('@/services/feedbackService', () => ({
  FeedbackService: {
    getFeedbackStats: vi.fn(),
  },
}));

describe('AgentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset supabase.from mock for each test
    vi.mocked(supabase.from).mockClear();
    vi.mocked(supabase.auth.getUser).mockClear();

    // Default mock for supabase.auth.getUser
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null }, error: null });

    // Default mock for supabase.from().select().eq().single()
    vi.mocked(supabase.from('agents').select().eq().single).mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    vi.mocked(supabase.from('profiles').select().eq().single).mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    vi.mocked(supabase.from('user_performance').select().eq().order().limit().single).mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
  });

  describe('CRUD Operations', () => {
    it('should create agent with valid data', async () => {
      const mockUser = {
        id: 'user-123',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00.000Z'
      };
      const mockAgent = {
        id: 'agent-123',
        user_id: 'user-123',
        name: 'Test Agent',
        description: 'Test Description',
        status: 'active',
        welcome_message: 'Hello!',
        cta_buttons: [],
        rotating_messages: [],
        colors: { primary: '#000000', bubble: '#FFFFFF', text: '#000000' },
        lead_collection_enabled: false,
        lead_form_triggers: [],
        lead_backup_trigger: { enabled: false, message_count: 5 },
        lead_form_fields: [],
        lead_submit_text: 'Submit',
        lead_success_message: 'Thank you!',
        linkedin_prompt_message_count: 0,
        ai_model_config: { model_name: 'gpt-3.5-turbo' },
        ai_mode: 'chat_completion',
        openai_assistant_id: null,
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      vi.mocked(supabase.from('agents').insert().select().single).mockResolvedValue({
        data: mockAgent,
        error: null
      });

      const agentData: CreateAgentData = {
        name: 'Test Agent',
        description: 'Test Description',
        welcome_message: 'Hello!',
        colors: { primary: '#000000', bubble: '#FFFFFF', text: '#000000' },
      };

      const result = await AgentService.createAgent(agentData);
      expect(result.name).toBe('Test Agent');
      expect(result.user_id).toBe('user-123');
    });

    it('should throw error if no authenticated user when creating agent', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null
      });

      const agentData: CreateAgentData = {
        name: 'Test Agent',
        welcome_message: 'Hello!',
        colors: { primary: '#000000', bubble: '#FFFFFF', text: '#000000' },
      };

      await expect(AgentService.createAgent(agentData)).rejects.toThrow('User must be authenticated to create agents');
    });

    it('should get agent by id', async () => {
      const mockAgent = {
        id: 'agent-123',
        name: 'Test Agent',
        colors: '{"primary": "#3B82F6"}',
        cta_buttons: '[]',
        lead_form_fields: '[]',
      };

      vi.mocked(supabase.from('agents').select().eq().single).mockResolvedValue({
        data: mockAgent,
        error: null
      });

      const result = await AgentService.getAgent('agent-123');
      expect(result?.name).toBe('Test Agent');
      expect(result?.colors).toEqual({ primary: '#3B82F6' });
    });

    it('should update agent', async () => {
      const mockAgent = {
        id: 'agent-123',
        name: 'Updated Agent',
        colors: '{"primary": "#3B82F6"}',
        cta_buttons: '[]',
        lead_form_fields: '[]',
      };

      vi.mocked(supabase.from('agents').update().eq().select().single).mockResolvedValue({
        data: mockAgent,
        error: null
      });

      const updateData: UpdateAgentData = {
        name: 'Updated Agent'
      };

      const result = await AgentService.updateAgent('agent-123', updateData);
      expect(result.name).toBe('Updated Agent');
    });

    it('should delete agent', async () => {
      vi.mocked(supabase.from('agents').delete().eq).mockResolvedValue({ error: null });

      await expect(AgentService.deleteAgent('agent-123')).resolves.not.toThrow();
    });
  });

  describe('Data Parsing', () => {
    it('should parse JSON strings correctly', async () => {
      const mockAgent = {
        id: 'agent-123',
        name: 'Test Agent',
        colors: '{"primary": "#3B82F6", "bubble": "#F3F4F6"}',
        cta_buttons: '[{"label": "Test", "url": "https://test.com"}]'
      };

      vi.mocked(supabase.from('agents').select().eq().single).mockResolvedValue({
        data: mockAgent,
        error: null
      });

      const result = await AgentService.getAgent('agent-123');
      expect(result?.colors).toEqual({ primary: "#3B82F6", bubble: "#F3F4F6" });
      expect(result?.cta_buttons).toEqual([{ label: "Test", url: "https://test.com" }]);
    });
  });

  describe('Error Handling', () => {
    it('should handle agent not found', async () => {
      vi.mocked(supabase.from('agents').select().eq().single).mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' }
      });

      const result = await AgentService.getAgent('nonexistent');
      expect(result).toBeNull();
    });

    it('should throw error for database failures', async () => {
      vi.mocked(supabase.from('agents').select().eq().single).mockResolvedValue({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' }
      });

      await expect(AgentService.getAgent('agent-123')).rejects.toThrow('Failed to fetch agent: Database error');
    });
  });

  describe('getAgents', () => {
    it('should fetch all agents for a user and include metrics', async () => {
      const mockUserId = 'user-123';
      const mockAgentsData = [
        { id: 'agent-1', name: 'Agent 1', user_id: mockUserId, colors: '{}', cta_buttons: '[]', lead_form_fields: '[]' },
        { id: 'agent-2', name: 'Agent 2', user_id: mockUserId, colors: '{}', cta_buttons: '[]', lead_form_fields: '[]' },
      ];

      vi.mocked(supabase.from('agents').select().eq().order().then).mockResolvedValue({ data: mockAgentsData, error: null });

      vi.spyOn(AgentService, 'getAgentMetrics').mockResolvedValueOnce({
        totalSessions: 10,
        totalMessages: 100,
        todayMessages: 5,
        yesterdayMessages: 2,
        leadsRequiringAttention: 1,
        averageResponseTime: '< 1 min',
        satisfactionRate: '90%',
      }).mockResolvedValueOnce({
        totalSessions: 5,
        totalMessages: 50,
        todayMessages: 1,
        yesterdayMessages: 0,
        leadsRequiringAttention: 0,
        averageResponseTime: '< 1 min',
        satisfactionRate: '80%',
      });

      const result = await AgentService.getAgents(mockUserId);

      expect(result).toHaveLength(2);
      expect(result[0].total_conversations).toBe(10);
      expect(result[0].total_messages).toBe(100);
      expect(result[1].total_conversations).toBe(5);
      expect(result[1].total_messages).toBe(50);
      expect(AgentService.getAgentMetrics).toHaveBeenCalledTimes(2);
    });

    it('should handle errors when fetching agents', async () => {
      const mockError = new Error('Fetch agents error');
      vi.mocked(supabase.from('agents').select().eq().order().then).mockResolvedValue({ data: null, error: mockError });

      await expect(AgentService.getAgents('user-123')).rejects.toThrow('Fetch agents error');
    });
  });

  describe('getAgentMetrics', () => {
    it('should return correct metrics for an agent', async () => {
      const mockAgentId = 'agent-123';
      const mockSessions = [{ id: 's1' }, { id: 's2' }];
      const mockMessages = [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }];
      const mockTodayMessages = [{ id: 'm1' }];
      const mockYesterdayMessages = [{ id: 'm2' }];
      const mockLeads = [{ id: 'l1' }];

      vi.mocked(supabase.from('chat_sessions').select().eq().then).mockResolvedValue({ data: mockSessions, error: null });
      vi.mocked(supabase.from('chat_messages').select().in().then).mockResolvedValue({ count: mockMessages.length, error: null });
      vi.mocked(supabase.from('chat_messages').select().in().gte().then).mockResolvedValue({ count: mockTodayMessages.length, error: null });
      vi.mocked(supabase.from('chat_messages').select().in().gte().lt().then).mockResolvedValue({ count: mockYesterdayMessages.length, error: null });
      vi.mocked(supabase.from('lead_submissions').select().eq().eq().then).mockResolvedValue({ count: mockLeads.length, error: null });

      vi.mocked(FeedbackService.getFeedbackStats).mockResolvedValue({
        positive: 8,
        negative: 2,
        total: 10,
      });

      const metrics = await AgentService.getAgentMetrics(mockAgentId);

      expect(metrics.totalSessions).toBe(mockSessions.length);
      expect(metrics.totalMessages).toBe(mockMessages.length);
      expect(metrics.todayMessages).toBe(mockTodayMessages.length);
      expect(metrics.yesterdayMessages).toBe(mockYesterdayMessages.length);
      expect(metrics.leadsRequiringAttention).toBe(mockLeads.length);
      expect(metrics.satisfactionRate).toBe('80%');
    });

    it('should return zeroed metrics if no sessions exist', async () => {
      vi.mocked(supabase.from('chat_sessions').select().eq().then).mockResolvedValue({ data: [], error: null });

      const metrics = await AgentService.getAgentMetrics('agent-123');

      expect(metrics).toEqual({
        totalSessions: 0,
        totalMessages: 0,
        todayMessages: 0,
        yesterdayMessages: 0,
        leadsRequiringAttention: 0,
        averageResponseTime: 'N/A',
        satisfactionRate: 'N/A',
      });
    });

    it('should handle errors during metric fetching', async () => {
      const mockError = new Error('Metrics fetch error');
      vi.mocked(supabase.from('chat_sessions').select().eq().then).mockResolvedValue({ data: null, error: mockError });

      await expect(AgentService.getAgentMetrics('agent-123')).rejects.toThrow('Metrics fetch error');
    });
  });

  describe('getAdminMetrics', () => {
    it('should return correct overall admin metrics', async () => {
      vi.mocked(supabase.from('chat_sessions').select().then).mockResolvedValue({ count: 50, error: null });
      vi.mocked(supabase.from('chat_messages').select().then).mockResolvedValue({ count: 500, error: null });
      vi.mocked(supabase.from('chat_messages').select().gte().then).mockResolvedValue({ count: 10, error: null });
      vi.mocked(supabase.from('lead_submissions').select().eq().then).mockResolvedValue({ count: 3, error: null });
      vi.mocked(supabase.from('chat_messages').select().not().then).mockResolvedValue({ data: [{ session_id: 's1' }, { session_id: 's2' }], error: null });

      const metrics = await AgentService.getAdminMetrics();

      expect(metrics.totalSessions).toBe(50);
      expect(metrics.totalMessages).toBe(500);
      expect(metrics.todayMessages).toBe(10);
      expect(metrics.leadsRequiringAttention).toBe(3);
      expect(metrics.satisfactionRate).toBe('4%'); // (2/50)*100
    });

    it('should handle errors when fetching admin metrics', async () => {
      const mockError = new Error('Admin metrics fetch error');
      vi.mocked(supabase.from('chat_sessions').select().then).mockResolvedValue({ data: null, error: mockError });

      await expect(AgentService.getAdminMetrics()).rejects.toThrow('Admin metrics fetch error');
    });
  });

  describe('getUserPerformanceData', () => {
    it('should fetch persona data for a user', async () => {
      const mockUserId = 'user-123';
      const mockPersonaData = { some: 'data' };

      vi.mocked(supabase.from('user_performance').select().eq().order().limit().single).mockResolvedValue({
        data: { enriched_data: mockPersonaData },
        error: null,
      });

      const result = await AgentService.getUserPerformanceData(mockUserId);

      expect(result).toEqual(mockPersonaData);
      expect(supabase.from).toHaveBeenCalledWith('user_performance');
      expect(vi.mocked(supabase.from('user_performance').select().eq).mock.calls[0][0]).toBe('user_id');
    });

    it('should return null if no persona data found', async () => {
      vi.mocked(supabase.from('user_performance').select().eq().order().limit().single).mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await AgentService.getUserPerformanceData('user-123');
      expect(result).toBeNull();
    });

    it('should handle errors when fetching persona data', async () => {
      const mockError = new Error('Persona fetch error');
      vi.mocked(supabase.from('user_performance').select().eq().order().limit().single).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(AgentService.getUserPerformanceData('user-123')).rejects.toThrow('Persona fetch error');
    });
  });

  describe('getUserPerformanceDataByLinkedIn', () => {
    it('should fetch persona data using linkedin URL', async () => {
      const mockLinkedInUrl = 'https://linkedin.com/in/test';
      const mockUserId = 'user-123';
      const mockPersonaData = { some: 'data' };

      vi.mocked(supabase.from('profiles').select().eq().single).mockResolvedValue({
        data: { user_id: mockUserId },
        error: null,
      });
      vi.mocked(supabase.from('user_performance').select().eq().order().limit().single).mockResolvedValue({
        data: { enriched_data: mockPersonaData },
        error: null,
      });

      const result = await AgentService.getUserPerformanceDataByLinkedIn(mockLinkedInUrl);

      expect(result).toEqual(mockPersonaData);
      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(vi.mocked(supabase.from('profiles').select().eq).mock.calls[0][0]).toBe('linkedin_profile_url');
      expect(supabase.from).toHaveBeenCalledWith('user_performance');
      expect(vi.mocked(supabase.from('user_performance').select().eq).mock.calls[0][0]).toBe('user_id');
    });

    it('should return null if no profile found for linkedin URL', async () => {
      vi.mocked(supabase.from('profiles').select().eq().single).mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await AgentService.getUserPerformanceDataByLinkedIn('https://linkedin.com/in/nonexistent');
      expect(result).toBeNull();
    });

    it('should handle errors when fetching profile by linkedin URL', async () => {
      const mockError = new Error('Profile fetch error');
      vi.mocked(supabase.from('profiles').select().eq().single).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(AgentService.getUserPerformanceDataByLinkedIn('https://linkedin.com/in/test')).rejects.toThrow('Profile fetch error');
    });

    it('should handle errors when fetching persona data after profile found', async () => {
      const mockLinkedInUrl = 'https://linkedin.com/in/test';
      const mockUserId = 'user-123';
      const mockError = new Error('Persona fetch error');

      vi.mocked(supabase.from('profiles').select().eq().single).mockResolvedValue({
        data: { user_id: mockUserId },
        error: null,
      });
      vi.mocked(supabase.from('user_performance').select().eq().order().limit().single).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(AgentService.getUserPerformanceDataByLinkedIn(mockLinkedInUrl)).rejects.toThrow('Persona fetch error');
    });
  });
});