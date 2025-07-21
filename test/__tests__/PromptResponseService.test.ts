import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PromptResponseService } from '@/services/promptResponseService';
import { supabase } from '@/integrations/supabase/client';

// Mock supabase client
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
    },
  };
});

describe('PromptResponseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.from).mockClear();
  });

  describe('getPromptResponses', () => {
    it('should fetch all prompt responses for a given agent', async () => {
      const mockAgentId = 'agent-123';
      const mockResponses = [
        { id: 'pr1', agent_id: mockAgentId, prompt: 'Hello', response: 'Hi there!', is_dynamic: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'pr2', agent_id: mockAgentId, prompt: 'Bye', response: 'Goodbye!', is_dynamic: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ];

      vi.mocked(supabase.from('prompt_responses').select().eq().order().then).mockResolvedValue({ data: mockResponses, error: null });

      const result = await PromptResponseService.getPromptResponses(mockAgentId);

      expect(result).toEqual(mockResponses);
      expect(supabase.from).toHaveBeenCalledWith('prompt_responses');
      expect(vi.mocked(supabase.from('prompt_responses').select().eq).mock.calls[0][0]).toBe('agent_id');
      expect(vi.mocked(supabase.from('prompt_responses').select().eq().order).mock.calls[0][0]).toBe('created_at');
    });

    it('should handle errors when fetching prompt responses', async () => {
      const mockError = new Error('Fetch error');
      vi.mocked(supabase.from('prompt_responses').select().eq().order().then).mockResolvedValue({ data: null, error: mockError });

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

      vi.mocked(supabase.from('prompt_responses').insert().select().single).mockResolvedValue({ data: mockCreatedResponse, error: null });

      const result = await PromptResponseService.createPromptResponse(newPromptData);

      expect(result).toEqual(mockCreatedResponse);
      expect(supabase.from).toHaveBeenCalledWith('prompt_responses');
      expect(vi.mocked(supabase.from('prompt_responses').insert).mock.calls[0][0]).toEqual(newPromptData);
    });

    it('should handle errors when creating a prompt response', async () => {
      const mockError = new Error('Create error');
      vi.mocked(supabase.from('prompt_responses').insert().select().single).mockResolvedValue({ data: null, error: mockError });

      await expect(PromptResponseService.createPromptResponse({ agent_id: 'agent-123', prompt: '', response: '' })).rejects.toThrow('Create error');
    });
  });

  describe('updatePromptResponse', () => {
    it('should update an existing prompt response', async () => {
      const mockId = 'existing-id';
      const updates = { response: 'Updated Answer' };
      const mockUpdatedResponse = { id: mockId, agent_id: 'agent-123', prompt: 'Question', response: 'Updated Answer', is_dynamic: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };

      vi.mocked(supabase.from('prompt_responses').update().eq().select().single).mockResolvedValue({ data: mockUpdatedResponse, error: null });

      const result = await PromptResponseService.updatePromptResponse(mockId, updates);

      expect(result).toEqual(mockUpdatedResponse);
      expect(supabase.from).toHaveBeenCalledWith('prompt_responses');
      expect(vi.mocked(supabase.from('prompt_responses').update).mock.calls[0][0]).toEqual(updates);
      expect(vi.mocked(supabase.from('prompt_responses').update().eq).mock.calls[0][0]).toBe('id');
    });

    it('should handle errors when updating a prompt response', async () => {
      const mockError = new Error('Update error');
      vi.mocked(supabase.from('prompt_responses').update().eq().select().single).mockResolvedValue({ data: null, error: mockError });

      await expect(PromptResponseService.updatePromptResponse('some-id', { response: '' })).rejects.toThrow('Update error');
    });
  });

  describe('deletePromptResponse', () => {
    it('should delete a prompt response', async () => {
      const mockId = 'delete-id';

      vi.mocked(supabase.from('prompt_responses').delete().eq).mockResolvedValue({ data: null, error: null });

      await PromptResponseService.deletePromptResponse(mockId);

      expect(supabase.from).toHaveBeenCalledWith('prompt_responses');
      expect(vi.mocked(supabase.from('prompt_responses').delete().eq).mock.calls[0][0]).toBe('id');
    });

    it('should handle errors when deleting a prompt response', async () => {
      const mockError = new Error('Delete error');
      vi.mocked(supabase.from('prompt_responses').delete().eq).mockResolvedValue({ data: null, error: mockError });

      await expect(PromptResponseService.deletePromptResponse('some-id')).rejects.toThrow('Delete error');
    });
  });

  describe('getDynamicPrompts', () => {
    it('should fetch only dynamic prompts for a given agent', async () => {
      const mockAgentId = 'agent-123';
      const mockDynamicResponses = [
        { prompt: 'Dynamic Q', response: 'Dynamic A', is_dynamic: true, keywords: ['dynamic'] },
      ];

      vi.mocked(supabase.from('prompt_responses').select().eq().eq().then).mockResolvedValue({ data: mockDynamicResponses, error: null });

      const result = await PromptResponseService.getDynamicPrompts(mockAgentId);

      expect(result).toEqual(mockDynamicResponses);
      expect(supabase.from).toHaveBeenCalledWith('prompt_responses');
      expect(vi.mocked(supabase.from('prompt_responses').select().eq).mock.calls[0][0]).toBe('agent_id');
      expect(vi.mocked(supabase.from('prompt_responses').select().eq().eq).mock.calls[0][0]).toBe('is_dynamic');
    });

    it('should return empty array and log error if fetching dynamic prompts fails', async () => {
      const mockError = new Error('Dynamic fetch error');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(supabase.from('prompt_responses').select().eq().eq().then).mockResolvedValue({ data: null, error: mockError });

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

      vi.mocked(supabase.from('prompt_responses').select().eq().then).mockResolvedValue({ data: mockResponses, error: null });

      const result = await PromptResponseService.findMatchingResponse(mockAgentId, 'Exact match');

      expect(result).toBe('This is an exact response');
    });

    it('should return keyword match for dynamic prompt if no exact match', async () => {
      const mockAgentId = 'agent-123';
      const mockResponses = [
        { prompt: 'No exact match', response: 'Should not match', is_dynamic: false },
        { prompt: 'keyword', response: 'This is a keyword response', is_dynamic: true, keywords: ['keyword', 'test'] },
      ];

      vi.mocked(supabase.from('prompt_responses').select().eq().then).mockResolvedValue({ data: mockResponses, error: null });

      const result = await PromptResponseService.findMatchingResponse(mockAgentId, 'This is a test message');

      expect(result).toBe('This is a keyword response');
    });

    it('should return null if no matching response found', async () => {
      const mockAgentId = 'agent-123';
      const mockResponses = [
        { prompt: 'No match', response: 'No match response', is_dynamic: false },
      ];

      vi.mocked(supabase.from('prompt_responses').select().eq().then).mockResolvedValue({ data: mockResponses, error: null });

      const result = await PromptResponseService.findMatchingResponse(mockAgentId, 'Completely different message');

      expect(result).toBeNull();
    });

    it('should handle errors when finding matching response', async () => {
      const mockError = new Error('Matching response error');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(supabase.from('prompt_responses').select().eq().then).mockResolvedValue({ data: null, error: mockError });

      const result = await PromptResponseService.findMatchingResponse('agent-123', 'test');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error finding matching response:', mockError);
      consoleErrorSpy.mockRestore();
    });
  });
});