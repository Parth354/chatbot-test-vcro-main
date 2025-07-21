import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAIService } from '@/services/openAIService';
import { OpenAI } from 'openai';

// Mock the entire openai module
vi.mock('openai', () => {
  const mockChatCompletionsCreate = vi.fn();
  const mockThreadsCreate = vi.fn();
  const mockThreadsMessagesCreate = vi.fn();
  const mockThreadsMessagesList = vi.fn();
  const mockThreadsRunsCreateAndPoll = vi.fn();
  const mockAssistantsList = vi.fn();
  const mockModelsList = vi.fn();

  const mockOpenAI = vi.fn(() => ({
    chat: {
      completions: {
        create: mockChatCompletionsCreate,
      },
    },
    beta: {
      threads: {
        create: mockThreadsCreate,
        messages: {
          create: mockThreadsMessagesCreate,
          list: mockThreadsMessagesList,
        },
        runs: {
          createAndPoll: mockThreadsRunsCreateAndPoll,
        },
      },
      assistants: {
        list: mockAssistantsList,
      },
    },
    models: {
      list: mockModelsList,
    },
  }));

  // Expose the mocked functions for vi.mocked calls
  mockOpenAI.prototype.chat = {
    completions: {
      create: mockChatCompletionsCreate,
    },
  };
  mockOpenAI.prototype.beta = {
    threads: {
      create: mockThreadsCreate,
      messages: {
        create: mockThreadsMessagesCreate,
        list: mockThreadsMessagesList,
      },
      runs: {
        createAndPoll: mockThreadsRunsCreateAndPoll,
      },
    },
    assistants: {
      list: mockAssistantsList,
    },
  };
  mockOpenAI.prototype.models = {
    list: mockModelsList,
  };

  return {
    OpenAI: mockOpenAI,
  };
});

describe('OpenAIService', () => {
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error if API key is not provided', () => {
    expect(() => new OpenAIService({ apiKey: '', aiMode: 'chat_completion' })).toThrow("OpenAI API Key is not provided.");
  });

  describe('getChatCompletion - chat_completion mode', () => {
    it('should call chat completions API and return response', async () => {
      const mockResponse = 'Bot response';
      vi.mocked(OpenAI.prototype.chat.completions.create).mockResolvedValue({
        choices: [{ message: { content: mockResponse } }],
      } as any);

      const service = new OpenAIService({ apiKey: mockApiKey, aiMode: 'chat_completion' });
      const result = await service.getChatCompletion('User message');

      expect(OpenAI.prototype.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'User message' },
        ],
      });
      expect(result).toEqual({ response: mockResponse });
    });

    it('should include persona data in system message', async () => {
      const mockResponse = 'Bot response';
      const mockPersona = { description: 'A friendly persona' };
      vi.mocked(OpenAI.prototype.chat.completions.create).mockResolvedValue({
        choices: [{ message: { content: mockResponse } }],
      } as any);

      const service = new OpenAIService({ apiKey: mockApiKey, aiMode: 'chat_completion' });
      await service.getChatCompletion('User message', mockPersona);

      expect(OpenAI.prototype.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'The user you are interacting with has the following persona: A friendly persona' },
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'User message' },
        ],
      });
    });

    it('should handle API errors', async () => {
      const mockError = new Error('API error');
      vi.mocked(OpenAI.prototype.chat.completions.create).mockRejectedValue(mockError);

      const service = new OpenAIService({ apiKey: mockApiKey, aiMode: 'chat_completion' });
      await expect(service.getChatCompletion('User message')).rejects.toThrow('API error');
    });
  });

  describe('getChatCompletion - assistant mode', () => {
    const mockAssistantId = 'asst_test';
    const mockThreadId = 'thread_test';
    const mockUserMessage = 'Hello assistant';
    const mockAssistantResponse = 'Response from assistant';

    it('should create a new thread if none provided', async () => {
      vi.mocked(OpenAI.prototype.beta.threads.create).mockResolvedValue({ id: mockThreadId } as any);
      vi.mocked(OpenAI.prototype.beta.threads.messages.create).mockResolvedValue({} as any);
      vi.mocked(OpenAI.prototype.beta.threads.runs.createAndPoll).mockResolvedValue({ status: 'completed' } as any);
      vi.mocked(OpenAI.prototype.beta.threads.messages.list).mockResolvedValue({
        data: [{ run_id: 'run_test', role: 'assistant', content: [{ type: 'text', text: { value: mockAssistantResponse } }] }],
      } as any);

      const service = new OpenAIService({ apiKey: mockApiKey, aiMode: 'assistant', assistantId: mockAssistantId });
      const result = await service.getChatCompletion(mockUserMessage);

      expect(OpenAI.prototype.beta.threads.create).toHaveBeenCalled();
      expect(OpenAI.prototype.beta.threads.messages.create).toHaveBeenCalledWith(mockThreadId, {
        role: 'user',
        content: mockUserMessage,
      });
      expect(OpenAI.prototype.beta.threads.runs.createAndPoll).toHaveBeenCalledWith(mockThreadId, {
        assistant_id: mockAssistantId,
      });
      expect(result).toEqual({ response: mockAssistantResponse, threadId: mockThreadId });
    });

    it('should use provided thread ID', async () => {
      vi.mocked(OpenAI.prototype.beta.threads.messages.create).mockResolvedValue({} as any);
      vi.mocked(OpenAI.prototype.beta.threads.runs.createAndPoll).mockResolvedValue({ status: 'completed' } as any);
      vi.mocked(OpenAI.prototype.beta.threads.messages.list).mockResolvedValue({
        data: [{ run_id: 'run_test', role: 'assistant', content: [{ type: 'text', text: { value: mockAssistantResponse } }] }],
      } as any);

      const service = new OpenAIService({ apiKey: mockApiKey, aiMode: 'assistant', assistantId: mockAssistantId });
      const result = await service.getChatCompletion(mockUserMessage, undefined, mockThreadId);

      expect(OpenAI.prototype.beta.threads.create).not.toHaveBeenCalled();
      expect(OpenAI.prototype.beta.threads.messages.create).toHaveBeenCalledWith(mockThreadId, {
        role: 'user',
        content: mockUserMessage,
      });
      expect(result).toEqual({ response: mockAssistantResponse, threadId: mockThreadId });
    });

    it('should throw error if assistant ID is missing', async () => {
      const service = new OpenAIService({ apiKey: mockApiKey, aiMode: 'assistant' });
      await expect(service.getChatCompletion(mockUserMessage)).rejects.toThrow("Assistant ID is required for assistant mode.");
    });

    it('should throw error if assistant run fails', async () => {
      vi.mocked(OpenAI.prototype.beta.threads.create).mockResolvedValue({ id: mockThreadId } as any);
      vi.mocked(OpenAI.prototype.beta.threads.messages.create).mockResolvedValue({} as any);
      vi.mocked(OpenAI.prototype.beta.threads.runs.createAndPoll).mockResolvedValue({ status: 'failed' } as any);

      const service = new OpenAIService({ apiKey: mockApiKey, aiMode: 'assistant', assistantId: mockAssistantId });
      await expect(service.getChatCompletion(mockUserMessage)).rejects.toThrow("Assistant run failed with status: failed");
    });
  });

  describe('listModels', () => {
    it('should list available models', async () => {
      const mockModels = [{ id: 'model-1' }, { id: 'model-2' }];
      vi.mocked(OpenAI.prototype.models.list).mockResolvedValue({ data: mockModels } as any);

      const service = new OpenAIService({ apiKey: mockApiKey, aiMode: 'chat_completion' });
      const result = await service.listModels();

      expect(OpenAI.prototype.models.list).toHaveBeenCalled();
      expect(result).toEqual(mockModels);
    });
  });

  describe('listAssistants', () => {
    it('should list available assistants', async () => {
      const mockAssistants = [{ id: 'asst-1', name: 'Assistant 1' }, { id: 'asst-2', name: 'Assistant 2' }];
      vi.mocked(OpenAI.prototype.beta.assistants.list).mockResolvedValue({ data: mockAssistants } as any);

      const service = new OpenAIService({ apiKey: mockApiKey, aiMode: 'assistant' });
      const result = await service.listAssistants();

      expect(OpenAI.prototype.beta.assistants.list).toHaveBeenCalled();
      expect(result).toEqual(mockAssistants);
    });
  });
});
