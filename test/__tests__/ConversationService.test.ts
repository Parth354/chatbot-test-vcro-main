import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConversationService } from '@/services/conversationService';
import { supabase } from '@/integrations/supabase/client';

// Mock the entire supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

// Helper to create a mock query chain
const createMockQueryChain = (data: any, error: any = null, isSingle = false) => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn(),
  };

  if (isSingle) {
    chain.single.mockResolvedValue({ data, error });
  } else {
    // Mock `then` for non-single queries to simulate resolving with data/error
    (chain as any).then = (resolve: (value: { data: any; error: any; }) => void) => resolve({ data, error });
  }

  return chain;
};

const mockedSupabase = vi.mocked(supabase);

describe('ConversationService', () => {
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;

  beforeEach(() => {
    vi.resetAllMocks();
    // Default mock for supabase.auth.getUser
    mockedSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } as any },
      error: null,
    });
    // Suppress console logs
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('addMessage', () => {
    it('should add a message and update the session', async () => {
      const mockSessionId = 'session-123';
      const mockContent = 'Hello, bot!';
      const mockSender = 'user';
      const mockMessageId = 'message-456';

      const insertChain = createMockQueryChain({ id: mockMessageId }, null, true);
      const updateChain = createMockQueryChain([{ id: mockSessionId }], null); // Return data for update

      mockedSupabase.from.mockImplementation((tableName: string) => {
        if (tableName === 'chat_messages') {
          return insertChain as any;
        }
        if (tableName === 'chat_sessions') {
          return updateChain as any;
        }
        return createMockQueryChain(null, { message: 'Table not found' }) as any;
      });

      const result = await ConversationService.addMessage(mockSessionId, mockContent, mockSender);

      expect(result).toBe(mockMessageId);
      expect(mockedSupabase.from).toHaveBeenCalledWith('chat_messages');
      expect(insertChain.insert).toHaveBeenCalledWith({
        session_id: mockSessionId,
        content: mockContent,
        sender: mockSender,
      });
      expect(insertChain.select).toHaveBeenCalledWith('id');
      expect(insertChain.single).toHaveBeenCalled();

      expect(mockedSupabase.from).toHaveBeenCalledWith('chat_sessions');
      expect(updateChain.update).toHaveBeenCalledWith(expect.objectContaining({
        last_message_preview: mockContent.substring(0, 100),
        status: 'unread',
        deleted_by_admin: false,
      }));
      expect(updateChain.eq).toHaveBeenCalledWith('id', mockSessionId);
    });

    it('should handle error when adding message fails', async () => {
      const mockError = new Error('Insert failed');
      const insertChain = createMockQueryChain(null, mockError, true);
      mockedSupabase.from.mockReturnValue(insertChain as any);

      await expect(ConversationService.addMessage('sid', 'content', 'user')).rejects.toThrow(mockError.message);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error adding message:", mockError);
    });

    it('should not throw when session update fails', async () => {
      const mockMessageId = 'message-456';
      const updateError = new Error('Update failed');

      const insertChain = createMockQueryChain({ id: mockMessageId }, null, true);
      const updateChain = createMockQueryChain(null, updateError);

      mockedSupabase.from.mockImplementation((tableName: string) => {
        if (tableName === 'chat_messages') return insertChain as any;
        if (tableName === 'chat_sessions') return updateChain as any;
        return createMockQueryChain(null, { message: 'Table not found' }) as any;
      });

      const result = await ConversationService.addMessage('sid', 'content', 'user');

      expect(result).toBe(mockMessageId);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error updating session after adding message:',
        updateError
      );
    });
  });

  describe('softDeleteChatSession', () => {
    it('should call supabase update with deleted_by_admin: true', async () => {
      const mockSessionId = 'session-to-soft-delete';
      const updateChain = createMockQueryChain([{ id: mockSessionId }], null); // Return data to avoid warning
      mockedSupabase.from.mockReturnValue(updateChain as any);

      await ConversationService.softDeleteChatSession(mockSessionId);

      expect(mockedSupabase.from).toHaveBeenCalledWith('chat_sessions');
      expect(updateChain.update).toHaveBeenCalledWith({ deleted_by_admin: true });
      expect(updateChain.eq).toHaveBeenCalledWith('id', mockSessionId);
      expect(consoleWarnSpy).not.toHaveBeenCalled(); // Ensure no warning was logged
    });

    it('should throw an error if supabase update fails', async () => {
      const mockSessionId = 'session-to-soft-delete';
      const mockError = new Error('Supabase error');
      const updateChain = createMockQueryChain(null, mockError);
      mockedSupabase.from.mockReturnValue(updateChain as any);

      await expect(ConversationService.softDeleteChatSession(mockSessionId)).rejects.toThrow(mockError.message);
      expect(consoleErrorSpy).toHaveBeenCalledWith("[softDeleteChatSession] Supabase Error:", mockError);
    });
  });
});