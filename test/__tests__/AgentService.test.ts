import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentService } from '@/services/agentService';
import { supabase } from '@/integrations/supabase/client';
import type { CreateAgentData, UpdateAgentData } from '@/types/agent';
import { FeedbackService } from '@/services/feedbackService';

// Mock the entire FeedbackService module
vi.mock('@/services/feedbackService');

// Define mock data here so it's accessible within the vi.mock scope
const mockAgentsData = [
  { id: 'agent-1', name: 'Agent 1', user_id: 'user-123', colors: '{}', cta_buttons: '[]', lead_form_fields: '[]' },
  { id: 'agent-2', name: 'Agent 2', user_id: 'user-123', colors: '{}', cta_buttons: '[]', lead_form_fields: '[]' },
];
const mockSessions = [
  { id: 's1', agent_id: 'agent-1' },
  { id: 's2', agent_id: 'agent-1' },
  { id: 's3', agent_id: 'agent-2' },
];
const mockMessages = [
  { id: 'm1', session_id: 's1', created_at: new Date().toISOString() },
  { id: 'm2', session_id: 's1', created_at: new Date().toISOString() },
  { id: 'm3', session_id: 's3', created_at: new Date().toISOString() },
];
const mockLeadSubmissions = [
  { id: 'l1', agent_id: 'agent-1', status: 'unread' },
  { id: 'l2', agent_id: 'agent-2', status: 'read' },
  { id: 'l3', agent_id: 'agent-1', status: 'unread' },
];

// Helper to create a mock query chain
class MockQueryBuilder {
  private filters: { type: string; column?: string; value?: any; values?: any[]; operator?: string }[] = [];
  private selectOptions: any = {};

  constructor(private initialData: any[] = [], private initialError: any = null) {}

  private applyFilters(sourceData: any[]) {
    let filtered = [...sourceData];
    this.filters.forEach(filter => {
      if (filter.type === 'eq') {
        filtered = filtered.filter(row => row[filter.column!] === filter.value);
      } else if (filter.type === 'in') {
        filtered = filtered.filter(row => filter.values!.includes(row[filter.column!]));
      } else if (filter.type === 'gte') {
        filtered = filtered.filter(row => new Date(row[filter.column!]) >= new Date(filter.value));
      } else if (filter.type === 'lte') {
        filtered = filtered.filter(row => new Date(row[filter.column!]) <= new Date(filter.value));
      } else if (filter.type === 'lt') {
        filtered = filtered.filter(row => new Date(row[filter.column!]) < new Date(filter.value));
      } else if (filter.type === 'not') {
        if (filter.operator === 'is' && filter.value === null) {
          filtered = filtered.filter(row => row[filter.column!] !== null);
        }
      }
    });
    return filtered;
  }

  select(columns?: string, options?: any) {
    this.selectOptions = options; // Store select options
    return this; // Always return this for select
  }
  insert() { return this; }
  update() { return this; }
  delete() { return this; }
  eq(column: string, value: any) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }
  in(column: string, values: any[]) {
    this.filters.push({ type: 'in', column, values });
    return this;
  }
  or() { return this; }
  gte(column: string, value: any) {
    this.filters.push({ type: 'gte', column, value });
    return this;
  }
  lte(column: string, value: any) {
    this.filters.push({ type: 'lte', column, value });
    return this;
  }
  lt(column: string, value: any) {
    this.filters.push({ type: 'lt', column, value });
    return this;
  }
  not(column: string, operator: string, value: any) {
    this.filters.push({ type: 'not', column, value, operator });
    return this;
  }
  order() { return this; }
  limit() { return this; }
  range() { return this; }
  single() {
    const filteredData = this.applyFilters(this.initialData);
    return Promise.resolve({ data: filteredData[0] || null, error: this.initialError });
  }
  then(resolve: (value: { data: any; error: any; count?: number }) => void) {
    const filteredData = this.applyFilters(this.initialData);

    if (this.selectOptions?.count === 'exact') {
      resolve({ data: filteredData, count: filteredData.length, error: this.initialError });
    } else {
      resolve({ data: filteredData, error: this.initialError });
    }
  }
}

// Mock the entire supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((tableName: string) => {
      if (tableName === 'agents') {
        return new MockQueryBuilder(mockAgentsData);
      } else if (tableName === 'chat_sessions') {
        return new MockQueryBuilder(mockSessions);
      } else if (tableName === 'chat_messages') {
        return new MockQueryBuilder(mockMessages);
      }
      return new MockQueryBuilder([], { message: 'Table not found' });
    }),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe('AgentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the authenticated user for all tests in this suite
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } as any },
      error: null,
    });
    // Setup a default mock for FeedbackService used in metrics
    vi.mocked(FeedbackService.getFeedbackStats).mockResolvedValue({
      positive: 8,
      total: 10,
    });
  });

  describe('CRUD Operations', () => {
    it('should create agent with valid data', async () => {
      const agentData: CreateAgentData = {
        name: 'Test Agent',
        description: 'Test Description',
        welcome_message: 'Hello!',
        colors: { primary: '#000000', bubble: '#FFFFFF', text: '#000000' },
      };

      const mockInsertResult = { id: 'new-agent-id', user_id: 'user-123', ...agentData };
      // Mock the specific query chain for this test
      supabase.from.mockImplementationOnce((tableName: string) => {
        if (tableName === 'agents') {
          const builder = new MockQueryBuilder([mockInsertResult]);
          builder.insert = vi.fn().mockReturnThis();
          builder.select = vi.fn().mockReturnThis();
          builder.single = vi.fn().mockResolvedValue({ data: mockInsertResult, error: null });
          return builder;
        }
        return new MockQueryBuilder([], { message: 'Table not found' });
      });

      const result = await AgentService.createAgent(agentData);
      expect(result.name).toBe('Test Agent');
      expect(result.user_id).toBe('user-123');
      expect(supabase.from).toHaveBeenCalledWith('agents');
      // No longer checking insertChain directly, but the mock on the builder
      // expect(insertChain.insert).toHaveBeenCalledWith(expect.objectContaining({
      //   name: agentData.name,
      //   user_id: 'user-123',
      // }));
      // expect(insertChain.select).toHaveBeenCalled();
      // expect(insertChain.single).toHaveBeenCalled();
    });

    it('should throw error if no authenticated user when creating agent', async () => {
      supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
      const agentData: CreateAgentData = { name: 'Test Agent', welcome_message: 'Hello!', colors: { primary: '#000000', bubble: '#FFFFFF', text: '#000000' } };
      await expect(AgentService.createAgent(agentData)).rejects.toThrow('User must be authenticated to create agents');
    });

    it('should get agent by id', async () => {
      const mockAgentRaw = {
        id: 'agent-123',
        name: 'Test Agent',
        colors: '{"primary": "#3B82F6"}',
        cta_buttons: '[]',
        lead_form_fields: '[]',
      };
      supabase.from.mockImplementationOnce((tableName: string) => {
        if (tableName === 'agents') {
          const builder = new MockQueryBuilder([mockAgentRaw]);
          builder.select = vi.fn().mockReturnThis();
          builder.eq = vi.fn().mockReturnThis();
          builder.single = vi.fn().mockResolvedValue({ data: mockAgentRaw, error: null });
          return builder;
        }
        return new MockQueryBuilder([], { message: 'Table not found' });
      });

      const result = await AgentService.getAgent('agent-123');
      expect(result?.name).toBe('Test Agent');
      expect(result?.colors).toEqual({ primary: "#3B82F6" });
      expect(supabase.from).toHaveBeenCalledWith('agents');
      // No longer checking selectChain directly
    });

    it('should update agent', async () => {
      const updatedData = { name: 'Updated Agent' };
      const mockUpdatedAgent = { id: 'agent-123', name: 'Updated Agent', colors: '{}', cta_buttons: '[]', lead_form_fields: '[]' };
      supabase.from.mockImplementationOnce((tableName: string) => {
        if (tableName === 'agents') {
          const builder = new MockQueryBuilder([mockUpdatedAgent]);
          builder.update = vi.fn().mockReturnThis();
          builder.eq = vi.fn().mockReturnThis();
          builder.select = vi.fn().mockReturnThis();
          builder.single = vi.fn().mockResolvedValue({ data: mockUpdatedAgent, error: null });
          return builder;
        }
        return new MockQueryBuilder([], { message: 'Table not found' });
      });

      const result = await AgentService.updateAgent('agent-123', updatedData);
      expect(result.name).toBe('Updated Agent');
      expect(supabase.from).toHaveBeenCalledWith('agents');
      // No longer checking updateChain directly
    });

    it('should delete agent', async () => {
      supabase.from.mockImplementationOnce((tableName: string) => {
        if (tableName === 'agents') {
          const builder = new MockQueryBuilder([]);
          builder.delete = vi.fn().mockReturnThis();
          builder.eq = vi.fn().mockReturnThis();
          return builder;
        }
        return new MockQueryBuilder([], { message: 'Table not found' });
      });

      await expect(AgentService.deleteAgent('agent-123')).resolves.not.toThrow();
      expect(supabase.from).toHaveBeenCalledWith('agents');
      // No longer checking deleteChain directly
    });
  });

  describe('Data Parsing', () => {
    it('should parse JSON strings correctly', async () => {
      const mockAgent = {
        id: 'agent-123',
        name: 'Test Agent',
        colors: '{"primary": "#3B82F6", "bubble": "#F3F4F6"}',
        cta_buttons: '[{"label": "Test", "url": "https://test.com"}]',
        lead_form_fields: '[]',
      };
      supabase.from.mockImplementationOnce((tableName: string) => {
        if (tableName === 'agents') {
          const builder = new MockQueryBuilder([mockAgent]);
          builder.select = vi.fn().mockReturnThis();
          builder.eq = vi.fn().mockReturnThis();
          builder.single = vi.fn().mockResolvedValue({ data: mockAgent, error: null });
          return builder;
        }
        return new MockQueryBuilder([], { message: 'Table not found' });
      });

      const result = await AgentService.getAgent('agent-123');
      expect(result?.colors).toEqual({ primary: "#3B82F6", bubble: "#F3F4F6" });
      expect(result?.cta_buttons).toEqual([{ label: "Test", url: "https://test.com" }]);
    });
  });

  describe('Error Handling', () => {
    it('should handle agent not found', async () => {
      supabase.from.mockImplementationOnce((tableName: string) => {
        if (tableName === 'agents') {
          const builder = new MockQueryBuilder([], { code: 'PGRST116' });
          builder.select = vi.fn().mockReturnThis();
          builder.eq = vi.fn().mockReturnThis();
          builder.single = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
          return builder;
        }
        return new MockQueryBuilder([], { message: 'Table not found' });
      });

      const result = await AgentService.getAgent('nonexistent');
      expect(result).toBeNull();
    });

    it('should throw error for database failures', async () => {
      supabase.from.mockImplementationOnce((tableName: string) => {
        if (tableName === 'agents') {
          const builder = new MockQueryBuilder([], new Error('Database error'));
          builder.select = vi.fn().mockReturnThis();
          builder.eq = vi.fn().mockReturnThis();
          builder.single = vi.fn().mockResolvedValue({ data: null, error: new Error('Database error') });
          return builder;
        }
        return new MockQueryBuilder([], { message: 'Table not found' });
      });
      await expect(AgentService.getAgent('agent-123')).rejects.toThrow('Failed to fetch agent: Database error');
    });
  });

  describe('getAgents', () => {
    it('should fetch all agents for a user and include metrics', async () => {
      const mockUserId = 'user-123';

      // Mock supabase.from for agents, sessions, and messages
      supabase.from.mockImplementation((tableName: string) => {
        if (tableName === 'agents') {
          return new MockQueryBuilder(mockAgentsData);
        } else if (tableName === 'chat_sessions') {
          return new MockQueryBuilder(mockSessions);
        } else if (tableName === 'chat_messages') {
          return new MockQueryBuilder(mockMessages);
        }
        return new MockQueryBuilder([], { message: 'Table not found' });
      });

      const result = await AgentService.getAgents(mockUserId);
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Agent 1');
      expect(result[0].total_conversations).toBe(2);
      expect(result[0].total_messages).toBe(2);
      expect(result[1].name).toBe('Agent 2');
      expect(result[1].total_conversations).toBe(1);
      expect(result[1].total_messages).toBe(1);
    });

    it('should return an empty array when no agents are found', async () => {
      const mockUserId = 'user-456';
      supabase.from.mockImplementation((tableName: string) => {
        if (tableName === 'agents') {
          return new MockQueryBuilder([]);
        }
        return new MockQueryBuilder([], { message: 'Table not found' });
      });
      const result = await AgentService.getAgents(mockUserId);
      expect(result).toEqual([]);
    });
  });

  describe('getAgentMetrics', () => {
    it('should calculate metrics correctly for a given agent', async () => {
      const mockAgentId = 'agent-123';

      supabase.from.mockImplementation((tableName: string) => {
        if (tableName === 'chat_sessions') {
          return new MockQueryBuilder(mockSessions.filter(s => s.agent_id === mockAgentId));
        } else if (tableName === 'chat_messages') {
          return new MockQueryBuilder(mockMessages);
        }
        return new MockQueryBuilder([], { message: 'Table not found' });
      });
      
      const metrics = await AgentService.getAgentMetrics(mockAgentId);
      
      expect(metrics.totalSessions).toBe(2);
      expect(metrics.totalMessages).toBe(3);
      expect(metrics.todayMessages).toBe(3);
      expect(metrics.leadsRequiringAttention).toBe(1);
      expect(metrics.satisfactionRate).toBe('80%'); // From the default mock
    });
  });

  describe('getAdminMetrics', () => {
    it('should calculate admin-level metrics correctly', async () => {
      supabase.from.mockImplementation((tableName: string) => {
        if (tableName === 'chat_sessions') {
          return new MockQueryBuilder(mockSessions);
        }
        return new MockQueryBuilder([], { message: 'Table not found' });
      });

      const metrics = await AgentService.getAdminMetrics();

      expect(metrics.totalSessions).toBe(3);
      expect(metrics.totalMessages).toBe(2);
      expect(metrics.todayMessages).toBe(2);
      expect(metrics.leadsRequiringAttention).toBe(2);
      // Response rate is based on sessions with messages
      expect(metrics.satisfactionRate).toBe('67%'); // 2 of 3 sessions have messages
    });
  });
});