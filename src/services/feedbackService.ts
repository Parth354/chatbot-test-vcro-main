import { supabase } from "../integrations/supabase/client";

import type { MessageFeedback } from "@/types/agent";
  interface MessageFeedback {
  id: string;
  session_id: string;
  message_id: string;
  feedback_type: 'up' | 'down';
  created_at: string;
  message?: {
    content: string;
    sender: string;
    created_at: string;
  };
  session?: {
    user_name?: string;
    user_email?: string;
  };
}

export class FeedbackService {
  static async createFeedback(sessionId: string, messageId: string, feedbackType: 'up' | 'down'): Promise<void> {
    return this.addFeedback(sessionId, messageId, feedbackType);
  }

  static async addFeedback(sessionId: string, messageId: string, feedbackType: 'up' | 'down'): Promise<void> {
    
    // Validate UUIDs before database operation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      console.error('FeedbackService - Invalid session ID format:', sessionId);
      throw new Error(`Invalid session ID format: ${sessionId}`);
    }
    if (!uuidRegex.test(messageId)) {
      console.error('FeedbackService - Invalid message ID format:', messageId);
      throw new Error(`Invalid message ID format: ${messageId}`);
    }

    // Check if feedback already exists for this message
    const { data: existing } = await supabase
      .from('message_feedback')
      .select('id')
      .eq('message_id', messageId)
      .maybeSingle();

    if (existing) {
      // Update existing feedback
      const { error } = await supabase
        .from('message_feedback')
        .update({ feedback_type: feedbackType })
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating feedback:', error);
        throw error;
      }
    } else {
      // Create new feedback
      const { error } = await supabase
        .from('message_feedback')
        .insert({
          session_id: sessionId,
          message_id: messageId,
          feedback_type: feedbackType
        });

      if (error) {
        console.error('Error adding feedback:', error);
        throw error;
      }
    }
  }

  static async getFeedbackForAgent(agentId: string, feedbackType?: 'up' | 'down'): Promise<MessageFeedback[]> {
    const { data: sessions } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('agent_id', agentId);

    if (!sessions || sessions.length === 0) {
      return [];
    }

    const sessionIds = sessions.map(s => s.id);

    let query = supabase
      .from('message_feedback')
      .select(`*`)
      .in('session_id', sessionIds)
      .order('created_at', { ascending: false });

    if (feedbackType) {
      query = query.eq('feedback_type', feedbackType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching feedback:', error);
      throw error;
    }

    // Fetch all relevant chat sessions in one go
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select('id, user_name, user_email')
      .in('id', sessionIds);

    if (sessionsError) {
      console.error('Error fetching chat sessions for feedback:', sessionsError);
      throw sessionsError;
    }

    const sessionsMap = new Map(sessionsData?.map(s => [s.id, s]));

    // Get message details separately to avoid foreign key issues
    const feedbackWithMessages = await Promise.all(
      (data || []).map(async (item) => {
        const { data: messageData } = await supabase
          .from('chat_messages')
          .select('content, sender, created_at')
          .eq('id', item.message_id)
          .maybeSingle();

        return {
          ...item,
          feedback_type: item.feedback_type as 'up' | 'down',
          message: messageData,
          session: sessionsMap.get(item.session_id) // Attach session data
        };
      })
    );

    return feedbackWithMessages;
  }

  static async getFeedbackStats(agentId: string): Promise<{ positive: number; negative: number; total: number }> {
    const { data: sessionIds } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('agent_id', agentId);

    if (!sessionIds || sessionIds.length === 0) {
      return { positive: 0, negative: 0, total: 0 };
    }

    const sessionIdsArray = sessionIds.map(s => s.id);

    const { data, error } = await supabase
      .from('message_feedback')
      .select('feedback_type')
      .in('session_id', sessionIdsArray);

    if (error) {
      console.error('Error fetching feedback stats:', error);
      throw error;
    }

    const stats = { positive: 0, negative: 0, total: 0 };
    
    data?.forEach(feedback => {
      stats.total++;
      if (feedback.feedback_type === 'up') {
        stats.positive++;
      } else {
        stats.negative++;
      }
    });

    return stats;
  }
}