import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConversationService } from '@/services/conversationService';
import { supabase } from '@/integrations/supabase/client';
import { SessionManager } from '@/types/sessionManager';

// Mock SessionManager
vi.mock('@/types/sessionManager', () => ({
  SessionManager: {
    getSessionCookie: vi.fn(),
    setSessionCookie: vi.fn(),
    generateSessionId: vi.fn(() => 'generated-session-id'),
    clearSessionCookie: vi.fn(),
  },
}));

describe('ConversationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addMessage', () => {
    it('should add a message and update session with deleted_by_admin to false', async () => {
      const mockSessionId = 'session-123';
      const mockContent = 'Hello, bot!';
      const mockSender = 'user';
      const mockMessageId = 'message-456';

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: mockMessageId },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      } as any);

      const result = await ConversationService.addMessage(mockSessionId, mockContent, mockSender);

      expect(result).toBe(mockMessageId);
      expect(supabase.from).toHaveBeenCalledWith('chat_messages');
      expect(supabase.from).toHaveBeenCalledWith('chat_sessions');
      expect(supabase.from('chat_sessions').update).toHaveBeenCalledWith(
        expect.objectContaining({
          last_message_at: expect.any(String),
          last_message_preview: mockContent.substring(0, 100),
          status: 'unread',
          deleted_by_admin: false,
        })
      );
    });

    it('should handle error when adding message fails', async () => {
      const mockSessionId = 'session-123';
      const mockContent = 'Hello, bot!';
      const mockSender = 'user';
      const mockError = new Error('Failed to insert message');

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      } as any);

      await expect(ConversationService.addMessage(mockSessionId, mockContent, mockSender)).rejects.toThrow(
        mockError.message
      );
    });

    it('should handle error when updating session fails but message is added', async () => {
      const mockSessionId = 'session-123';
      const mockContent = 'Hello, bot!';
      const mockSender = 'user';
      const mockMessageId = 'message-456';
      const mockUpdateError = new Error('Failed to update session');

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: mockMessageId },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: mockUpdateError,
          }),
        }),
      } as any);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await ConversationService.addMessage(mockSessionId, mockContent, mockSender);

      expect(result).toBe(mockMessageId);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error updating session after adding message:",
        mockUpdateError
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getChatSessions', () => {
    it('should fetch chat sessions for a given agent', async () => {
      const mockAgentId = 'agent-123';
      const mockSessions = [
        { id: 's1', agent_id: mockAgentId, user_id: 'u1', last_message_at: new Date().toISOString(), messages: [{ count: 5 }] },
        { id: 's2', agent_id: mockAgentId, user_id: null, last_message_at: new Date().toISOString(), messages: [{ count: 2 }] },
      ];
      const mockProfiles = [
        { user_id: 'u1', full_name: 'User One', email: 'u1@example.com' },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          filter: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          then: vi.fn(async (resolve) => {
            if (vi.mocked(supabase.from).mock.calls[0][0] === 'chat_sessions') {
              return resolve({ data: mockSessions, error: null });
            } else if (vi.mocked(supabase.from).mock.calls[0][0] === 'profiles') {
              return resolve({ data: mockProfiles, error: null });
            }
            return resolve({ data: [], error: null });
          }),
        }),
        delete: vi.fn().mockReturnThis(),
      } as any);

      const sessions = await ConversationService.getChatSessions(mockAgentId);

      expect(sessions).toHaveLength(2);
      expect(sessions[0].user_name).toBe('User One');
      expect(sessions[1].user_name).toBeUndefined();
      expect(sessions[0].message_count).toBe(5);
    });

    it('should apply filters correctly', async () => {
      const mockAgentId = 'agent-123';
      const mockSessions = [
        { id: 's1', agent_id: mockAgentId, user_id: 'u1', status: 'read', last_message_at: new Date().toISOString(), created_at: new Date().toISOString(), messages: [{ count: 5 }] },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          filter: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          then: vi.fn(async (resolve) => resolve({ data: mockSessions, error: null })),
        }),
        delete: vi.fn().mockReturnThis(),
      } as any);

      const filters = { status: 'read', keyword: 'user', dateFrom: new Date().toISOString(), dateTo: new Date().toISOString() };
      await ConversationService.getChatSessions(mockAgentId, filters);

      expect(supabase.from).toHaveBeenCalledWith('chat_sessions');
      expect(supabase.from('chat_sessions').select).toHaveBeenCalledWith(
        '*, messages:chat_messages(count), last_message:chat_messages(content, created_at)'
      );
      expect(supabase.from('chat_sessions').select().eq).toHaveBeenCalledWith('agent_id', mockAgentId);
      expect(supabase.from('chat_sessions').select().eq).toHaveBeenCalledWith('deleted_by_admin', false);
      expect(supabase.from('chat_sessions').select().eq().order().gte).toHaveBeenCalled();
      expect(supabase.from('chat_sessions').select().eq().order().gte().lte).toHaveBeenCalled();
      expect(supabase.from('chat_sessions').select().eq().order().gte().lte().eq).toHaveBeenCalledWith('status', 'read');
      expect(supabase.from('chat_sessions').select().eq().order().gte().lte().eq().or).toHaveBeenCalledWith(
        `user_name.ilike.%user%,user_email.ilike.%user%`
      );
    });

    it('should handle errors when fetching chat sessions', async () => {
      const mockError = new Error('DB Error');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          then: vi.fn(async (resolve) => resolve({ data: null, error: mockError })),
        }),
        delete: vi.fn().mockReturnThis(),
      } as any);

      await expect(ConversationService.getChatSessions('agent-123')).rejects.toThrow('DB Error');
    });

    it('should hard-delete anonymous, empty sessions', async () => {
      const mockAgentId = 'agent-123';
      const mockSessions = [
        { id: 's1', agent_id: mockAgentId, user_id: null, messages: [{ count: 0 }] },
        { id: 's2', agent_id: mockAgentId, user_id: 'u1', messages: [{ count: 5 }] },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          then: vi.fn(async (resolve) => resolve({ data: mockSessions, error: null })),
        }),
        delete: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      const hardDeleteSpy = vi.spyOn(ConversationService, 'hardDeleteChatSession');

      const sessions = await ConversationService.getChatSessions(mockAgentId);

      expect(hardDeleteSpy).toHaveBeenCalledWith('s1');
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe('s2');
    });
  });

  describe('getChatMessages', () => {
    it('should fetch chat messages for a given session ID', async () => {
      const mockSessionId = 'session-123';
      const mockMessages = [
        { id: 'm1', session_id: mockSessionId, content: 'Hi', sender: 'user', created_at: new Date().toISOString() },
        { id: 'm2', session_id: mockSessionId, content: 'Hello', sender: 'bot', created_at: new Date().toISOString() },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
          then: vi.fn(async (resolve) => resolve({ data: mockMessages, error: null })),
        }),
      } as any);

      const messages = await ConversationService.getChatMessages(mockSessionId);

      expect(messages).toHaveLength(2);
      expect(messages[0].content).toBe('Hi');
    });

    it('should apply limit and offset for pagination', async () => {
      const mockSessionId = 'session-123';
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
          then: vi.fn(async (resolve) => resolve({ data: [], error: null })),
        }),
      } as any);

      await ConversationService.getChatMessages(mockSessionId, 10, 0);

      expect(supabase.from('chat_messages').select().eq().order().limit).toHaveBeenCalledWith(10);
      expect(supabase.from('chat_messages').select().eq().order().limit().range).toHaveBeenCalledWith(0, 9);
    });

    it('should handle errors when fetching chat messages', async () => {
      const mockError = new Error('DB Error');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          then: vi.fn(async (resolve) => resolve({ data: null, error: mockError })),
        }),
      } as any);

      await expect(ConversationService.getChatMessages('session-123')).rejects.toThrow('DB Error');
    });
  });

  describe('createOrUpdateSession', () => {
    it('should create a new session if no existing session or user ID', async () => {
      vi.mocked(SessionManager.getSessionCookie).mockReturnValue(null);
      vi.mocked(ConversationService.getLatestSessionForUserAndAgent).mockResolvedValue(null);

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'new-session-id' },
              error: null,
            }),
          }),
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        }),
      } as any);

      const sessionId = await ConversationService.createOrUpdateSession('agent-123');

      expect(sessionId).toBe('new-session-id');
      expect(SessionManager.setSessionCookie).toHaveBeenCalledWith('new-session-id');
    });

    it('should use existing session for authenticated user', async () => {
      const mockUserId = 'user-456';
      const mockAgentId = 'agent-123';
      const mockExistingSessionId = 'existing-session-id';

      vi.mocked(ConversationService.getLatestSessionForUserAndAgent).mockResolvedValue({
        id: mockExistingSessionId,
        agent_id: mockAgentId,
        user_id: mockUserId,
        status: 'active',
        priority: 'medium',
        tags: [],
        last_message_at: '',
        created_at: '',
        updated_at: '',
        cta_button_1_clicks: 0,
        cta_button_2_clicks: 0,
        session_cookie: null,
        linkedin_prompt_message_count: 0,
        deleted_by_admin: false,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      const sessionId = await ConversationService.createOrUpdateSession(mockAgentId, undefined, mockUserId);

      expect(sessionId).toBe(mockExistingSessionId);
      expect(SessionManager.setSessionCookie).toHaveBeenCalledWith(mockExistingSessionId);
    });

    it('should use stored anonymous session if available and valid', async () => {
      const mockStoredSessionId = 'stored-session-id';
      vi.mocked(SessionManager.getSessionCookie).mockReturnValue(mockStoredSessionId);
      vi.mocked(ConversationService.getLatestSessionForUserAndAgent).mockResolvedValue(null);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: mockStoredSessionId }, error: null }),
        }),
        insert: vi.fn().mockReturnThis(),
      } as any);

      const sessionId = await ConversationService.createOrUpdateSession('agent-123');

      expect(sessionId).toBe(mockStoredSessionId);
      expect(SessionManager.setSessionCookie).toHaveBeenCalledWith(mockStoredSessionId);
    });

    it('should handle errors during session creation', async () => {
      vi.mocked(SessionManager.getSessionCookie).mockReturnValue(null);
      vi.mocked(ConversationService.getLatestSessionForUserAndAgent).mockResolvedValue(null);

      const mockError = new Error('Creation Error');
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
          }),
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        }),
      } as any);

      await expect(ConversationService.createOrUpdateSession('agent-123')).rejects.toThrow('Creation Error');
    });
  });

  describe('getLatestSessionForUserAndAgent', () => {
    it('should fetch the latest session for a user and agent', async () => {
      const mockUserId = 'user-123';
      const mockAgentId = 'agent-456';
      const mockSession = { id: 's1', user_id: mockUserId, agent_id: mockAgentId, last_message_at: new Date().toISOString() };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockSession, error: null }),
        }),
      } as any);

      const session = await ConversationService.getLatestSessionForUserAndAgent(mockUserId, mockAgentId);

      expect(session).toEqual(mockSession);
      expect(supabase.from('chat_sessions').select().eq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(supabase.from('chat_sessions').select().eq).toHaveBeenCalledWith('agent_id', mockAgentId);
      expect(supabase.from('chat_sessions').select().eq().order().limit().single).toHaveBeenCalled();
    });

    it('should return null if no session found', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        }),
      } as any);

      const session = await ConversationService.getLatestSessionForUserAndAgent('user-123', 'agent-456');

      expect(session).toBeNull();
    });

    it('should not filter by deleted_by_admin when forChatbotWidget is true', async () => {
      const mockUserId = 'user-123';
      const mockAgentId = 'agent-456';
      const mockSession = { id: 's1', user_id: mockUserId, agent_id: mockAgentId, last_message_at: new Date().toISOString() };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockSession, error: null }),
        }),
      } as any);

      await ConversationService.getLatestSessionForUserAndAgent(mockUserId, mockAgentId, true);

      // Ensure deleted_by_admin filter was NOT applied
      const calls = vi.mocked(supabase.from('chat_sessions').select().eq).mock.calls;
      const hasDeletedByAdminFilter = calls.some(call => call[0] === 'deleted_by_admin');
      expect(hasDeletedByAdminFilter).toBe(false);
    });

    it('should filter by deleted_by_admin when forChatbotWidget is false', async () => {
      const mockUserId = 'user-123';
      const mockAgentId = 'agent-456';
      const mockSession = { id: 's1', user_id: mockUserId, agent_id: mockAgentId, last_message_at: new Date().toISOString() };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockSession, error: null }),
        }),
      } as any);

      await ConversationService.getLatestSessionForUserAndAgent(mockUserId, mockAgentId, false);

      // Ensure deleted_by_admin filter WAS applied
      expect(supabase.from('chat_sessions').select().eq).toHaveBeenCalledWith('deleted_by_admin', false);
    });
  });

  describe('softDeleteChatSession', () => {
    it('should set deleted_by_admin to true for a session', async () => {
      const mockSessionId = 'session-to-soft-delete';

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      await ConversationService.softDeleteChatSession(mockSessionId);

      expect(supabase.from).toHaveBeenCalledWith('chat_sessions');
      expect(supabase.from('chat_sessions').update).toHaveBeenCalledWith({
        deleted_by_admin: true,
      });
      expect(supabase.from('chat_sessions').update().eq).toHaveBeenCalledWith('id', mockSessionId);
    });

    it('should throw an error if soft delete fails', async () => {
      const mockError = new Error('Soft delete failed');
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      } as any);

      await expect(ConversationService.softDeleteChatSession('session-to-soft-delete')).rejects.toThrow('Soft delete failed');
    });
  });

  describe('hardDeleteChatSession', () => {
    beforeEach(() => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null }, error: null });
    });

    it('should permanently delete anonymous sessions', async () => {
      const mockSessionId = 'anonymous-session';
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { user_id: null }, error: null }),
        }),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      await ConversationService.hardDeleteChatSession(mockSessionId);

      expect(supabase.from('chat_sessions').delete).toHaveBeenCalled();
      expect(supabase.from('chat_sessions').delete().eq).toHaveBeenCalledWith('id', mockSessionId);
    });

    it('should soft-delete authenticated sessions', async () => {
      const mockSessionId = 'authenticated-session';
      const mockUserId = 'user-123';

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { user_id: mockUserId }, error: null }),
        }),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      const softDeleteSpy = vi.spyOn(ConversationService, 'softDeleteChatSession');

      await ConversationService.hardDeleteChatSession(mockSessionId);

      expect(softDeleteSpy).toHaveBeenCalledWith(mockSessionId);
      expect(supabase.from('chat_sessions').delete).not.toHaveBeenCalled();
    });

    it('should handle errors during session fetch for hard delete', async () => {
      const mockError = new Error('Fetch Error');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        }),
      } as any);

      await expect(ConversationService.hardDeleteChatSession('session-id')).rejects.toThrow('Fetch Error');
    });

    it('should handle errors during hard delete', async () => {
      const mockError = new Error('Delete Error');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { user_id: null }, error: null }),
        }),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      } as any);

      await expect(ConversationService.hardDeleteChatSession('session-id')).rejects.toThrow('Delete Error');
    });
  });

  describe('updateChatSessionStatus', () => {
    it('should update the status of a chat session', async () => {
      const mockSessionId = 'session-123';
      const newStatus = 'read';

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      await ConversationService.updateChatSessionStatus(mockSessionId, newStatus);

      expect(supabase.from).toHaveBeenCalledWith('chat_sessions');
      expect(supabase.from('chat_sessions').update).toHaveBeenCalledWith({
        status: newStatus,
      });
      expect(supabase.from('chat_sessions').update().eq).toHaveBeenCalledWith('id', mockSessionId);
    });

    it('should throw an error if status update fails', async () => {
      const mockError = new Error('Status update failed');
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      } as any);

      await expect(ConversationService.updateChatSessionStatus('session-123', 'read')).rejects.toThrow('Status update failed');
    });
  });

  describe('incrementCtaButtonClick', () => {
    it('should increment the click count for a specific CTA button', async () => {
      const mockSessionId = 'session-123';
      const buttonIndex = 0; // Corresponds to cta_button_1_clicks
      const currentCount = 5;

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { cta_button_1_clicks: currentCount }, error: null }),
        }),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      await ConversationService.incrementCtaButtonClick(mockSessionId, buttonIndex);

      expect(supabase.from).toHaveBeenCalledWith('chat_sessions');
      expect(supabase.from('chat_sessions').select).toHaveBeenCalledWith('cta_button_1_clicks');
      expect(supabase.from('chat_sessions').update).toHaveBeenCalledWith({
        cta_button_1_clicks: currentCount + 1,
      });
      expect(supabase.from('chat_sessions').update().eq).toHaveBeenCalledWith('id', mockSessionId);
    });

    it('should handle error when fetching current count fails', async () => {
      const mockError = new Error('Fetch count failed');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        }),
      } as any);

      await expect(ConversationService.incrementCtaButtonClick('session-123', 0)).rejects.toThrow('Fetch count failed');
    });

    it('should handle error when updating click count fails', async () => {
      const currentCount = 5;
      const mockError = new Error('Update count failed');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { cta_button_1_clicks: currentCount }, error: null }),
        }),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      } as any);

      await expect(ConversationService.incrementCtaButtonClick('session-123', 0)).rejects.toThrow('Update count failed');
    });
  });
});