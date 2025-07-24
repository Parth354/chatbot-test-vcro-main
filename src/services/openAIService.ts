import { OpenAI } from "openai";

interface OpenAIConfig {
  apiKey: string;
  model?: string;
  aiMode: 'chat_completion' | 'assistant';
  assistantId?: string;
  listOnly?: boolean;
}

export class OpenAIService {
  private openai: OpenAI;
  private model?: string;
  private aiMode: 'chat_completion' | 'assistant';
  private assistantId?: string;

  constructor(config: OpenAIConfig) {
    if (!config.apiKey) {
      throw new Error("OpenAI API Key is not provided.");
    }
    if (config.aiMode === 'assistant') {
      this.openai = new OpenAI({
        apiKey: config.apiKey,
        defaultHeaders: {
          'OpenAI-Beta': 'assistants=v2'
        },
        dangerouslyAllowBrowser: true,
      });
    } else {
      this.openai = new OpenAI({
        apiKey: config.apiKey,
        dangerouslyAllowBrowser: true,
      });
    }
    this.aiMode = config.aiMode;
    this.model = config.model;
    this.assistantId = config.assistantId;
  }

  async getChatCompletion(prompt: string, persona?: any, threadId?: string): Promise<{ response: string; threadId?: string }> {
    if (this.aiMode === 'assistant') {
      return this.getAssistantResponse(prompt, threadId);
    } else {
      const chatResponse = await this.getChatCompletionResponse(prompt, persona);
      return { response: chatResponse };
    }
  }

  private async getChatCompletionResponse(prompt: string, persona?: any): Promise<string> {
    const messages: any[] = [
        { role: "system", content: "You are a helpful assistant. Please format your responses using Markdown, especially for code blocks, bold text, and lists." },
        { role: "user", content: prompt },
    ];

    if (persona) {
        let personaContent = "";
        if (typeof persona === 'string') {
            personaContent = persona;
        } else if (typeof persona === 'object' && persona !== null) {
            // Attempt to extract relevant fields or summarize
            if (persona.description) {
                personaContent = persona.description;
            } else if (persona.summary) {
                personaContent = persona.summary;
            } else {
                // Fallback to stringifying if no specific fields are found
                personaContent = JSON.stringify(persona);
            }
            // Remove unwanted characters from personaContent
            personaContent = personaContent.replace(/[\n,\[\]{}]/g, '').replace(/"/g, '').trim();
        }

        if (personaContent) {
            messages.unshift({
                role: "system",
                content: `Respond to the user query given below, based on their persona.
Query:
Persona: ${personaContent}`,
            });
        }
    }

    const completion = await this.openai.chat.completions.create({
        model: this.model || "gpt-3.5-turbo",
        messages,
    });
    return completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.";
  }

  private async getAssistantResponse(userMessage: string, threadId?: string): Promise<{ response: string; threadId: string }> {
    if (!this.assistantId) {
      throw new Error("Assistant ID is required for assistant mode.");
    }

    let currentThreadId = threadId;

    // 1. Create a new thread if one doesn't exist
    if (!currentThreadId) {
      const thread = await this.openai.beta.threads.create();
      currentThreadId = thread.id;
    }

    // 2. Add the user's message to the thread
    await this.openai.beta.threads.messages.create(currentThreadId, {
      role: "user",
      content: userMessage,
    });

    // 3. Create a run and poll for completion
    const run = await this.openai.beta.threads.runs.createAndPoll(currentThreadId, {
      assistant_id: this.assistantId,
    });

    // 4. Handle the completed run
    if (run.status === "completed") {
      const messages = await this.openai.beta.threads.messages.list(currentThreadId);
      const lastMessageForAssistant = messages.data
        .filter((message) => message.run_id === run.id && message.role === "assistant")
        .pop();

      if (lastMessageForAssistant && lastMessageForAssistant.content[0]?.type === "text") {
        return {
          response: lastMessageForAssistant.content[0].text.value,
          threadId: currentThreadId,
        };
      }
      return {
        response: "No valid response from assistant.",
        threadId: currentThreadId,
      };
    } else {
      throw new Error(`Assistant run failed with status: ${run.status}`);
    }
  }

  async listModels() {
    const models = await this.openai.models.list();
    return models.data;
  }

  async listAssistants() {
    const assistants = await this.openai.beta.assistants.list();
    return assistants.data;
  }
}
