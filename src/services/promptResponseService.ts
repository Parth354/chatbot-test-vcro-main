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

  static async findMatchingResponse(agentId: string, userMessage: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('prompt_responses')
      .select('prompt, response, is_dynamic, keywords')
      .eq('agent_id', agentId);

    if (error || !data) {
      console.error('Error finding matching response:', error);
      return null;
    }

    const userMessageLower = userMessage.toLowerCase();

    // First, check for exact prompt matches
    for (const item of data) {
      if (!item.is_dynamic && item.prompt.toLowerCase() === userMessageLower) {
        return item.response;
      }
    }

    // Then, check for dynamic keyword matches
    for (const item of data) {
      if (item.is_dynamic && item.keywords) {
        const hasMatchingKeyword = item.keywords.some(keyword => 
          userMessageLower.includes(keyword.toLowerCase())
        );
        if (hasMatchingKeyword) {
          return item.response;
        }
      }
    }

    return null;
  }
}