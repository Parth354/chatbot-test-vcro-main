import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentService } from '@/services/agentService';
import { supabase } from '@/integrations/supabase/client';
import type { CreateAgentData, UpdateAgentData } from '@/types/agent';
import { ConversationService } from '@/services/conversationService';
import { FeedbackService } from '@/services/feedbackService';

// Mock external dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(() => ({
            then: vi.fn(),
          })),
        })),
        order: vi.fn(() => ({
          then: vi.fn(),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(),
            })),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(),
        })),
      })),
    })),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

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

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAgent,
              error: null
            })
          })
        })
      } as any);

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
        colors: JSON.stringify({ primary: '#3B82F6' }),
        cta_buttons: JSON.stringify([]),
        lead_form_fields: JSON.stringify([]),
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAgent,
              error: null
            })
          })
        })
      } as any);

      const result = await AgentService.getAgent('agent-123');
      expect(result?.name).toBe('Test Agent');
      expect(result?.colors).toEqual({ primary: '#3B82F6' });
    });

    it('should update agent', async () => {
      const mockAgent = {
        id: 'agent-123',
        name: 'Updated Agent',
        colors: JSON.stringify({ primary: '#3B82F6' }),
        cta_buttons: JSON.stringify([]),
        lead_form_fields: JSON.stringify([]),
      };

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockAgent,
                error: null
              })
            })
          })
        })
      } as any);

      const updateData: UpdateAgentData = {
        name: 'Updated Agent'
      };

      const result = await AgentService.updateAgent('agent-123', updateData);
      expect(result.name).toBe('Updated Agent');
    });

    it('should delete agent', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      } as any);

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

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAgent,
              error: null
            })
          })
        })
      } as any);

      const result = await AgentService.getAgent('agent-123');
      expect(result?.colors).toEqual({ primary: "#3B82F6", bubble: "#F3F4F6" });
      expect(result?.cta_buttons).toEqual([{ label: "Test", url: "https://test.com" }]);
    });
  });

  describe('Error Handling', () => {
    it('should handle agent not found', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows found' }
            })
          })
        })
      } as any);

      const result = await AgentService.getAgent('nonexistent');
      expect(result).toBeNull();
    });

    it('should throw error for database failures', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'DB_ERROR', message: 'Database error' }
            })
          })
        })
      } as any);

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

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockAgentsData, error: null }),
        }),
      } as any);

      vi.spyOn(AgentService, 'getAgentMetrics').mockResolvedValueOnce({
        totalSessions: 10,
        totalMessages: 100,
        todayMessages: 10,
        yesterdayMessages: 5,
        leadsRequiringAttention: 2,
        averageResponseTime: '< 1 min',
        satisfactionRate: '80%',
      }).mockResolvedValueOnce({
        totalSessions: 5,
        totalMessages: 50,
        todayMessages: 5,
        yesterdayMessages: 2,
        leadsRequiringAttention: 1,
        averageResponseTime: '< 1 min',
        satisfactionRate: '90%',
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
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        }),
      } as any);

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

      vi.mocked(supabase.from).mockImplementation((tableName) => {
        if (tableName === 'chat_sessions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                then: vi.fn().mockResolvedValue({ data: mockSessions, error: null }),
              })),
            })),
          } as any;
        } else if (tableName === 'chat_messages') {
          return {
            select: vi.fn((_select, options) => {
              if (options?.count === 'exact') {
                if (options?.gte && options.lt) {
                  return { then: vi.fn().mockResolvedValue({ count: mockYesterdayMessages.length, error: null }) };
                } else if (options?.gte) {
                  return { then: vi.fn().mockResolvedValue({ count: mockTodayMessages.length, error: null }) };
                } else {
                  return { then: vi.fn().mockResolvedValue({ count: mockMessages.length, error: null }) };
                }
              }
              return { then: vi.fn().mockResolvedValue({ data: [], error: null }) };
            }),
          } as any;
        } else if (tableName === 'lead_submissions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  then: vi.fn().mockResolvedValue({ count: mockLeads.length, error: null }),
                })),
              })),
            })),
          } as any;
        }
        return {} as any;
      });

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
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            then: vi.fn().mockResolvedValue({ data: [], error: null }),
          })),
        })),
      } as any);

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
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            then: vi.fn().mockResolvedValue({ data: null, error: mockError }),
          })),
        })),
      } as any);

      await expect(AgentService.getAgentMetrics('agent-123')).rejects.toThrow('Metrics fetch error');
    });
  });

  describe('getAdminMetrics', () => {
    it('should return correct overall admin metrics', async () => {
      vi.mocked(supabase.from).mockImplementation((tableName) => {
        if (tableName === 'chat_sessions') {
          return {
            select: vi.fn((_select, options) => {
              if (options?.count === 'exact') {
                return { then: vi.fn().mockResolvedValue({ count: 50, error: null }) };
              }
              return { then: vi.fn().mockResolvedValue({ data: [{ session_id: 's1' }, { session_id: 's2' }], error: null }) };
            }),
          } as any;
        } else if (tableName === 'chat_messages') {
          return {
            select: vi.fn((_select, options) => {
              if (options?.count === 'exact') {
                if (options?.gte) {
                  return { then: vi.fn().mockResolvedValue({ count: 10, error: null }) }; // todayMessagesCount
                }
                return { then: vi.fn().mockResolvedValue({ count: 500, error: null }) }; // totalMessagesCount
              }
              return { then: vi.fn().mockResolvedValue({ data: [], error: null }) };
            }),
          } as any;
        } else if (tableName === 'lead_submissions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                then: vi.fn().mockResolvedValue({ count: 3, error: null }),
              })),
            })),
          } as any;
        }
        return {} as any;
      });

      const metrics = await AgentService.getAdminMetrics();

      expect(metrics.totalSessions).toBe(50);
      expect(metrics.totalMessages).toBe(500);
      expect(metrics.todayMessages).toBe(10);
      expect(metrics.leadsRequiringAttention).toBe(3);
      expect(metrics.satisfactionRate).toBe('4%'); // (2/50)*100
    });

    it('should handle errors when fetching admin metrics', async () => {
      const mockError = new Error('Admin metrics fetch error');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          then: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        })),
      } as any);

      await expect(AgentService.getAdminMetrics()).rejects.toThrow('Admin metrics fetch error');
    });
  });

  describe('getUserPerformanceData', () => {
    it('should fetch persona data for a user', async () => {
      const mockUserId = 'user-123';
      const mockPersonaData = { some: 'data' };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { enriched_data: mockPersonaData }, error: null }),
          }),
        }),
      } as any);

      const result = await AgentService.getUserPerformanceData(mockUserId);

      expect(result).toEqual(mockPersonaData);
      expect(supabase.from).toHaveBeenCalledWith('user_performance');
      expect(supabase.from('user_performance').select().eq).toHaveBeenCalledWith('user_id', mockUserId);
    });

    it('should return null if no persona data found', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
      } as any);

      const result = await AgentService.getUserPerformanceData('user-123');
      expect(result).toBeNull();
    });

    it('should handle errors when fetching persona data', async () => {
      const mockError = new Error('Persona fetch error');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
          }),
        }),
      } as any);

      await expect(AgentService.getUserPerformanceData('user-123')).rejects.toThrow('Persona fetch error');
    });
  });

  describe('getUserPerformanceDataByLinkedIn', () => {
    it('should fetch persona data using linkedin URL', async () => {
      const mockLinkedInUrl = 'https://linkedin.com/in/test';
      const mockUserId = 'user-123';
      const mockPersonaData = { some: 'data' };

      vi.mocked(supabase.from).mockImplementation((tableName) => {
        if (tableName === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: { user_id: mockUserId }, error: null }),
              })),
            })),
          } as any;
        } else if (tableName === 'user_performance') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({ data: { enriched_data: mockPersonaData }, error: null }),
                  })),
                })),
              })),
            })),
          } as any;
        }
        return {} as any;
      });

      const result = await AgentService.getUserPerformanceDataByLinkedIn(mockLinkedInUrl);

      expect(result).toEqual(mockPersonaData);
      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(supabase.from('profiles').select().eq).toHaveBeenCalledWith('linkedin_profile_url', mockLinkedInUrl);
      expect(supabase.from).toHaveBeenCalledWith('user_performance');
      expect(supabase.from('user_performance').select().eq).toHaveBeenCalledWith('user_id', mockUserId);
    });

    it('should return null if no profile found for linkedin URL', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          })),
        })),
      } as any);

      const result = await AgentService.getUserPerformanceDataByLinkedIn('https://linkedin.com/in/nonexistent');
      expect(result).toBeNull();
    });

    it('should handle errors when fetching profile by linkedin URL', async () => {
      const mockError = new Error('Profile fetch error');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
          })),
        })),
      } as any);

      await expect(AgentService.getUserPerformanceDataByLinkedIn('https://linkedin.com/in/test')).rejects.toThrow('Profile fetch error');
    });

    it('should handle errors when fetching persona data after profile found', async () => {
      const mockLinkedInUrl = 'https://linkedin.com/in/test';
      const mockUserId = 'user-123';
      const mockError = new Error('Persona fetch error');

      vi.mocked(supabase.from).mockImplementation((tableName) => {
        if (tableName === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: { user_id: mockUserId }, error: null }),
              })),
            })),
          } as any;
        } else if (tableName === 'user_performance') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
                  })),
                })),
              })),
            })),
          } as any;
        }
        return {} as any;
      });

      await expect(AgentService.getUserPerformanceDataByLinkedIn(mockLinkedInUrl)).rejects.toThrow('Persona fetch error');
    });
  });
});
