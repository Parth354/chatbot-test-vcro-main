import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PromptResponseService } from '@/services/promptResponseService';
import { supabase } from '@/integrations/supabase/client';

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            then: vi.fn(),
          })),
          single: vi.fn(),
        })),
        order: vi.fn(),
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
  },
}));

describe('PromptResponseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPromptResponses', () => {
    it('should fetch all prompt responses for a given agent', async () => {
      const mockAgentId = 'agent-123';
      const mockResponses = [
        { id: 'pr1', agent_id: mockAgentId, prompt: 'Hello', response: 'Hi there!', is_dynamic: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'pr2', agent_id: mockAgentId, prompt: 'Bye', response: 'Goodbye!', is_dynamic: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockResponses, error: null }),
        }),
      } as any);

      const result = await PromptResponseService.getPromptResponses(mockAgentId);

      expect(result).toEqual(mockResponses);
      expect(supabase.from).toHaveBeenCalledWith('prompt_responses');
      expect(supabase.from('prompt_responses').select().eq).toHaveBeenCalledWith('agent_id', mockAgentId);
      expect(supabase.from('prompt_responses').select().eq().order).toHaveBeenCalledWith('created_at', { ascending: true });
    });

    it('should handle errors when fetching prompt responses', async () => {
      const mockError = new Error('Fetch error');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        }),
      } as any);

      await expect(PromptResponseService.getPromptResponses('agent-123')).rejects.toThrow('Fetch error');
    });
  });

  describe('createPromptResponse', () => {
    it('should create a new prompt response', async () => {
      const newPromptData = {
        agent_id: 'agent-123',
        prompt: 'New Question',
        response: 'New Answer',
        is_dynamic: false,
      };
      const mockCreatedResponse = { ...newPromptData, id: 'new-id', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockCreatedResponse, error: null }),
          }),
        }),
      } as any);

      const result = await PromptResponseService.createPromptResponse(newPromptData);

      expect(result).toEqual(mockCreatedResponse);
      expect(supabase.from).toHaveBeenCalledWith('prompt_responses');
      expect(supabase.from('prompt_responses').insert).toHaveBeenCalledWith(newPromptData);
    });

    it('should handle errors when creating a prompt response', async () => {
      const mockError = new Error('Create error');
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
          }),
        }),
      } as any);

      await expect(PromptResponseService.createPromptResponse({ agent_id: 'agent-123', prompt: '', response: '' })).rejects.toThrow('Create error');
    });
  });

  describe('updatePromptResponse', () => {
    it('should update an existing prompt response', async () => {
      const mockId = 'existing-id';
      const updates = { response: 'Updated Answer' };
      const mockUpdatedResponse = { id: mockId, agent_id: 'agent-123', prompt: 'Question', response: 'Updated Answer', is_dynamic: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockUpdatedResponse, error: null }),
            }),
          }),
        }),
      } as any);

      const result = await PromptResponseService.updatePromptResponse(mockId, updates);

      expect(result).toEqual(mockUpdatedResponse);
      expect(supabase.from).toHaveBeenCalledWith('prompt_responses');
      expect(supabase.from('prompt_responses').update).toHaveBeenCalledWith(updates);
      expect(supabase.from('prompt_responses').update().eq).toHaveBeenCalledWith('id', mockId);
    });

    it('should handle errors when updating a prompt response', async () => {
      const mockError = new Error('Update error');
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
            }),
          }),
        }),
      } as any);

      await expect(PromptResponseService.updatePromptResponse('some-id', { response: '' })).rejects.toThrow('Update error');
    });
  });

  describe('deletePromptResponse', () => {
    it('should delete a prompt response', async () => {
      const mockId = 'delete-id';

      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      } as any);

      await PromptResponseService.deletePromptResponse(mockId);

      expect(supabase.from).toHaveBeenCalledWith('prompt_responses');
      expect(supabase.from('prompt_responses').delete).toHaveBeenCalled();
      expect(supabase.from('prompt_responses').delete().eq).toHaveBeenCalledWith('id', mockId);
    });

    it('should handle errors when deleting a prompt response', async () => {
      const mockError = new Error('Delete error');
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        }),
      } as any);

      await expect(PromptResponseService.deletePromptResponse('some-id')).rejects.toThrow('Delete error');
    });
  });

  describe('getDynamicPrompts', () => {
    it('should fetch only dynamic prompts for a given agent', async () => {
      const mockAgentId = 'agent-123';
      const mockDynamicResponses = [
        { prompt: 'Dynamic Q', response: 'Dynamic A', is_dynamic: true, keywords: ['dynamic'] },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: mockDynamicResponses, error: null }),
        }),
      } as any);

      const result = await PromptResponseService.getDynamicPrompts(mockAgentId);

      expect(result).toEqual(mockDynamicResponses);
      expect(supabase.from).toHaveBeenCalledWith('prompt_responses');
      expect(supabase.from('prompt_responses').select().eq).toHaveBeenCalledWith('agent_id', mockAgentId);
      expect(supabase.from('prompt_responses').select().eq).toHaveBeenCalledWith('is_dynamic', true);
    });

    it('should return empty array and log error if fetching dynamic prompts fails', async () => {
      const mockError = new Error('Dynamic fetch error');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        }),
      } as any);

      const result = await PromptResponseService.getDynamicPrompts('agent-123');

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching dynamic prompts:', mockError);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('findMatchingResponse', () => {
    it('should return exact match for non-dynamic prompt', async () => {
      const mockAgentId = 'agent-123';
      const mockResponses = [
        { prompt: 'Exact match', response: 'This is an exact response', is_dynamic: false },
        { prompt: 'keyword', response: 'This is a keyword response', is_dynamic: true, keywords: ['keyword'] },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockResponses, error: null }),
        }),
      } as any);

      const result = await PromptResponseService.findMatchingResponse(mockAgentId, 'Exact match');

      expect(result).toBe('This is an exact response');
    });

    it('should return keyword match for dynamic prompt if no exact match', async () => {
      const mockAgentId = 'agent-123';
      const mockResponses = [
        { prompt: 'No exact match', response: 'Should not match', is_dynamic: false },
        { prompt: 'keyword', response: 'This is a keyword response', is_dynamic: true, keywords: ['keyword', 'test'] },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockResponses, error: null }),
        }),
      } as any);

      const result = await PromptResponseService.findMatchingResponse(mockAgentId, 'This is a test message');

      expect(result).toBe('This is a keyword response');
    });

    it('should return null if no matching response found', async () => {
      const mockAgentId = 'agent-123';
      const mockResponses = [
        { prompt: 'No match', response: 'No match response', is_dynamic: false },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockResponses, error: null }),
        }),
      } as any);

      const result = await PromptResponseService.findMatchingResponse(mockAgentId, 'Completely different message');

      expect(result).toBeNull();
    });

    it('should handle errors when finding matching response', async () => {
      const mockError = new Error('Matching response error');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        }),
      } as any);

      const result = await PromptResponseService.findMatchingResponse('agent-123', 'test');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error finding matching response:', mockError);
      consoleErrorSpy.mockRestore();
    });
  });
});
