import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeedbackService } from '@/services/feedbackService';
import { supabase } from '@/integrations/supabase/client';



// Mock supabase client
vi.mock('@/integrations/supabase/client', () => {
  const mockFrom = vi.fn().mockImplementation(() => {
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: {}, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: {}, error: null }),
    };
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



describe('FeedbackService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset supabase.from mock for each test
    vi.mocked(supabase.from).mockClear();
  });

  describe('createFeedback / addFeedback', () => {
    it('should add new feedback if it does not exist', async () => {
      const mockSessionId = '123e4567-e89b-12d3-a456-426614174000'; // Valid UUID
      const mockMessageId = '234e5678-f90c-34e5-b567-537725285111'; // Valid UUID
      const mockFeedbackType = 'up';

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockReturnThis(),
      } as any);

      await FeedbackService.createFeedback(mockSessionId, mockMessageId, mockFeedbackType);

      expect(supabase.from).toHaveBeenCalledWith('message_feedback');
      expect(vi.mocked(supabase.from('message_feedback').insert).mock.calls[0][0]).toEqual({
        session_id: mockSessionId,
        message_id: mockMessageId,
        feedback_type: mockFeedbackType,
      });
    });

    it('should update existing feedback if it already exists', async () => {
      const mockSessionId = '123e4567-e89b-12d3-a456-426614174000'; // Valid UUID
      const mockMessageId = '234e5678-f90c-34e5-b567-537725285111'; // Valid UUID
      const mockFeedbackType = 'down';
      const mockExistingFeedbackId = 'existing-feedback-id';

      const eq = vi.fn().mockReturnThis();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: mockExistingFeedbackId }, error: null }),
        update: vi.fn(() => ({
          eq,
        })),
      } as any);

      await FeedbackService.createFeedback(mockSessionId, mockMessageId, mockFeedbackType);

      expect(supabase.from).toHaveBeenCalledWith('message_feedback');
      expect(vi.mocked(supabase.from('message_feedback').update).mock.calls[0][0]).toEqual({
        feedback_type: mockFeedbackType,
      });
      expect(eq).toHaveBeenCalledWith('id', mockExistingFeedbackId);
    });

    it('should throw an error for invalid session ID format', async () => {
      const invalidSessionId = 'invalid-uuid';
      const mockMessageId = '234e5678-f90c-34e5-b567-537725285111';
      const mockFeedbackType = 'up';

      await expect(FeedbackService.createFeedback(invalidSessionId, mockMessageId, mockFeedbackType)).rejects.toThrow(
        `Invalid session ID format: ${invalidSessionId}`
      );
    });

    it('should throw an error for invalid message ID format', async () => {
      const mockSessionId = '123e4567-e89b-12d3-a456-426614174000';
      const invalidMessageId = 'invalid-uuid';
      const mockFeedbackType = 'up';

      await expect(FeedbackService.createFeedback(mockSessionId, invalidMessageId, mockFeedbackType)).rejects.toThrow(
        `Invalid message ID format: ${invalidMessageId}`
      );
    });

    it('should throw an error if insert fails', async () => {
      const mockSessionId = '123e4567-e89b-12d3-a456-426614174000';
      const mockMessageId = '234e5678-f90c-34e5-b567-537725285111';
      const mockFeedbackType = 'up';
      const mockError = new Error('Insert failed');

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockResolvedValue({ error: mockError }),
      } as any);

      await expect(FeedbackService.createFeedback(mockSessionId, mockMessageId, mockFeedbackType)).rejects.toThrow(
        mockError
      );
    });

    it('should throw an error if update fails', async () => {
      const mockSessionId = '123e4567-e89b-12d3-a456-426614174000';
      const mockMessageId = '234e5678-f90c-34e5-b567-537725285111';
      const mockFeedbackType = 'down';
      const mockExistingFeedbackId = 'existing-feedback-id';
      const mockError = new Error('Update failed');

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: mockExistingFeedbackId }, error: null }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        }),
      } as any);

      await expect(FeedbackService.createFeedback(mockSessionId, mockMessageId, mockFeedbackType)).rejects.toThrow(
        mockError.message
      );
    });
  });

  describe('getFeedbackForAgent', () => {
    it('should fetch feedback for a given agent', async () => {
      const mockAgentId = 'agent-123';
      const mockSessions = [{ id: 's1', user_id: 'u1' }, { id: 's2', user_id: null }];
      const mockProfiles = [{ user_id: 'u1', full_name: 'User One', email: 'u1@example.com' }];
      const mockFeedbackData = [
        { id: 'f1', session_id: 's1', message_id: 'm1', feedback_type: 'up', created_at: new Date().toISOString() },
        { id: 'f2', session_id: 's2', message_id: 'm2', feedback_type: 'down', created_at: new Date().toISOString() },
      ];
      const mockMessages = [
        { id: 'm1', content: 'Bot message 1', sender: 'bot', created_at: new Date().toISOString() },
        { id: 'm2', content: 'Bot message 2', sender: 'bot', created_at: new Date().toISOString() },
      ];

      vi.mocked(supabase.from).mockImplementation((tableName: string) => {
        if (tableName === 'chat_sessions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockSessions, error: null }),
            in: vi.fn().mockResolvedValue({ data: mockSessions, error: null }),
          } as any;
        }
        if (tableName === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
          } as any;
        }
        if (tableName === 'message_feedback') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockFeedbackData, error: null }),
          } as any;
        }
        if (tableName === 'chat_messages') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation((column, value) => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: mockMessages.find(m => m.id === value), error: null }),
            })),
          } as any;
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any;
      });

      const feedback = await FeedbackService.getFeedbackForAgent(mockAgentId);

      expect(feedback).toHaveLength(2);
      expect(feedback[0].feedback_type).toBe('up');
      expect(feedback[0].message?.content).toBe('Bot message 1');
      expect(feedback[0].session?.user_name).toBe('User One');
      expect(feedback[1].feedback_type).toBe('down');
      expect(feedback[1].message?.content).toBe('Bot message 2');
      expect(feedback[1].session?.user_name).toBeUndefined();
    });

    it('should filter feedback by type', async () => {
      const mockAgentId = 'agent-123';
      const mockSessions = [{ id: 's1', user_id: 'u1' }];
      const mockFeedbackData = [
        { id: 'f1', session_id: 's1', message_id: 'm1', feedback_type: 'up', created_at: new Date().toISOString() },
      ];
      const mockMessages = [
        { id: 'm1', content: 'Bot message 1', sender: 'bot', created_at: new Date().toISOString() },
      ];
      const mockProfiles = [{ user_id: 'u1', full_name: 'User One', email: 'u1@example.com' }];

      const eq = vi.fn().mockReturnThis();
      const order = vi.fn().mockResolvedValue({ data: mockFeedbackData, error: null });
      vi.mocked(supabase.from).mockImplementation((tableName: string) => {
        if (tableName === 'chat_sessions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockSessions, error: null }),
            in: vi.fn().mockResolvedValue({ data: mockSessions, error: null }),
          } as any;
        }
        if (tableName === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
          } as any;
        }
        if (tableName === 'message_feedback') {
          const query: any = {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
          };
          query.eq = vi.fn(() => query);
          query.then = vi.fn((resolve) => resolve({ data: mockFeedbackData, error: null }));
          return query;
        }
        if (tableName === 'chat_messages') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation((column, value) => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: mockMessages.find(m => m.id === value), error: null }),
            })),
          } as any;
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
        } as any;
      });

      const feedback = await FeedbackService.getFeedbackForAgent(mockAgentId, 'up');

      expect(feedback).toHaveLength(1);
      expect(feedback[0].feedback_type).toBe('up');
    });

    it('should return empty array if no sessions found', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      const feedback = await FeedbackService.getFeedbackForAgent('agent-123');
      expect(feedback).toHaveLength(0);
    });

    it('should handle errors when fetching feedback', async () => {
      const mockError = new Error('Feedback fetch error');
      vi.mocked(supabase.from).mockImplementation((tableName: string) => {
        if (tableName === 'chat_sessions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [{ id: 's1' }], error: null }),
          } as any;
        }
        if (tableName === 'message_feedback') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
          } as any;
        }
        return {
          select: vi.fn().mockReturnThis(),
        } as any;
      });


      await expect(FeedbackService.getFeedbackForAgent('agent-123')).rejects.toThrow('Feedback fetch error');
    });
  });

  describe('getFeedbackStats', () => {
    it('should return correct feedback statistics', async () => {
      const mockAgentId = 'agent-123';
      const mockSessions = [{ id: 's1' }, { id: 's2' }];
      const mockFeedbackData = [
        { feedback_type: 'up' },
        { feedback_type: 'up' },
        { feedback_type: 'down' },
      ];

      vi.mocked(supabase.from).mockImplementation((tableName: string) => {
        if (tableName === 'chat_sessions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockSessions, error: null }),
          } as any;
        }
        if (tableName === 'message_feedback') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ data: mockFeedbackData, error: null }),
          } as any;
        }
        return {
          select: vi.fn().mockReturnThis(),
        } as any;
      });

      const stats = await FeedbackService.getFeedbackStats(mockAgentId);

      expect(stats).toEqual({
        positive: 2,
        negative: 1,
        total: 3,
      });
    });

    it('should return zero stats if no sessions found', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      const stats = await FeedbackService.getFeedbackStats('agent-123');
      expect(stats).toEqual({
        positive: 0,
        negative: 0,
        total: 0,
      });
    });

    it('should handle errors when fetching feedback stats', async () => {
      const mockError = new Error('Stats fetch error');
      vi.mocked(supabase.from).mockImplementation((tableName: string) => {
        if (tableName === 'chat_sessions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [{ id: 's1' }], error: null }),
          } as any;
        }
        if (tableName === 'message_feedback') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ data: null, error: mockError }),
          } as any;
        }
        return {
          select: vi.fn().mockReturnThis(),
        } as any;
      });

      await expect(FeedbackService.getFeedbackStats('agent-123')).rejects.toThrow('Stats fetch error');
    });
  });
});
