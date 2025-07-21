import { supabase } from "@/integrations/supabase/client";

export interface PromptResponse {
  id: string;
  agent_id: string;
  prompt: string;
  response: string;
  is_dynamic: boolean;
  keywords?: string[];
  created_at: string;
  updated_at: string;
}

export interface CreatePromptResponseData {
  agent_id: string;
  prompt: string;
  response: string;
  is_dynamic?: boolean;
  keywords?: string[];
}

export class PromptResponseService {
  static async getPromptResponses(agentId: string): Promise<PromptResponse[]> {
    const { data, error } = await supabase
      .from('prompt_responses')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching prompt responses:', error);
      throw error;
    }

    return data || [];
  }

  static async createPromptResponse(promptData: CreatePromptResponseData): Promise<PromptResponse> {
    const { data, error } = await supabase
      .from('prompt_responses')
      .insert(promptData)
      .select('*')
      .single();

    if (error) {
      console.error('Error creating prompt response:', error);
      throw error;
    }

    return data;
  }

  static async updatePromptResponse(id: string, updates: Partial<CreatePromptResponseData>): Promise<PromptResponse> {
    const { data, error } = await supabase
      .from('prompt_responses')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating prompt response:', error);
      throw error;
    }

    return data;
  }

  static async deletePromptResponse(id: string): Promise<void> {
    const { error } = await supabase
      .from('prompt_responses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting prompt response:', error);
      throw error;
    }
  }

  static async getDynamicPrompts(agentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("prompt_responses")
      .select("prompt, response")
      .eq("agent_id", agentId)
      .eq("is_dynamic", true);

    if (error) {
      console.error("Error fetching dynamic prompts:", error);
      return [];
    }
    return data || [];
  }

  static async findMatchingResponse(agentId: string, message: string): Promise<string | null> {
    const { data, error } = await supabase
      .from("prompt_responses")
      .select("prompt, response, is_dynamic, keywords")
      .eq("agent_id", agentId);

    if (error || !data) {
      console.error("Error finding matching response:", error);
      return null;
    }

    const lowerCaseMessage = message.toLowerCase();

    // First, check for an exact match on non-dynamic prompts
    for (const item of data) {
      if (!item.is_dynamic && item.prompt.toLowerCase() === lowerCaseMessage) {
        return item.response;
      }
    }

    // Then, check for keyword matches on dynamic prompts
    for (const item of data) {
      if (item.is_dynamic && item.keywords && item.keywords.some((keyword: string) => lowerCaseMessage.includes(keyword.toLowerCase()))) {
        return item.response;
      }
    }

    return null;
  }
}