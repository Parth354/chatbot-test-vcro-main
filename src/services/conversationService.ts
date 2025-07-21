import { supabase } from "../integrations/supabase/client";
import type { ChatSession, ChatMessage, ConversationFilters, RawChatSessionData } from "@/types/agent";
import type { Profile } from "@/types/profile";

export const ConversationService = {
  async getChatSessions(agentId: string, filters: ConversationFilters = {}, includeDeleted: boolean = false, forChatbotWidget: boolean = false): Promise<ChatSession[]> {
    let query: any = supabase
      .from("chat_sessions")
      .select("*, messages:chat_messages(count), last_message:chat_messages(content, created_at)")
      .eq("agent_id", agentId)
      .order("last_message_at", { ascending: false });

    if (!includeDeleted && !forChatbotWidget) {
      query = query.eq("deleted_by_admin", false);
    }

    if (filters.dateFrom) {
      query = query.gte("created_at", filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte("created_at", filters.dateTo);
    }
    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.keyword) {
      query = query.or(`user_name.ilike.%${filters.keyword}%,user_email.ilike.%${filters.keyword}%`);
    }

    const { data: sessionsData, error: sessionsError } = await query;

    if (sessionsError) {
      console.error("Error fetching chat sessions:", sessionsError);
      throw new Error(sessionsError.message);
    }

    if (!sessionsData || sessionsData.length === 0) {
      return [];
    }

    // Identify and delete anonymous sessions with no messages
    const sessionsToDelete = sessionsData.filter(
      (session: any) => session.user_id === null && session.messages[0]?.count === 0
    );

    if (sessionsToDelete.length > 0) {
      
      const deletePromises = sessionsToDelete.map(session => this.hardDeleteChatSession(session.id));
      await Promise.all(deletePromises);
    }

    // Filter out the deleted sessions from the main list
    const finalSessions = sessionsData.filter(
      (session: any) => !sessionsToDelete.some(deletedSession => deletedSession.id === session.id)
    );

    const userIds = [...new Set(finalSessions.map(s => s.user_id).filter(id => id !== null))];

    let profilesMap = new Map();
    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      } else {
        profilesMap = new Map(profilesData.map(p => [p.user_id, p]));
      }
    }

    const sessionsWithProfileData = (sessionsData as any[]).map(session => {
      const profile = session.user_id ? profilesMap.get(session.user_id) : null;
      const last_message = Array.isArray(session.last_message) && session.last_message.length > 0
        ? session.last_message[0]
        : null;
      return {
        ...session,
        user_name: profile?.full_name,
        user_email: profile?.email,
        message_count: session.messages[0]?.count || 0,
        last_message_preview: last_message?.content,
        last_message_at: last_message?.created_at || session.last_message_at,
      };
    });

    return sessionsWithProfileData as ChatSession[];
  },

  async getChatMessages(sessionId: string, limit?: number, offset?: number): Promise<ChatMessage[]> {
    let query = supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (limit !== undefined) {
      query = query.limit(limit);
    }
    if (offset !== undefined) {
      query = query.range(offset, offset + (limit || 0) - 1); // range is inclusive
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching chat messages:", error);
      throw new Error(error.message);
    }
    return data as ChatMessage[];
  },

  async addMessage(sessionId: string, content: string, sender: "user" | "bot"): Promise<string> {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        session_id: sessionId,
        content: content,
        sender: sender,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error adding message:", error);
      throw new Error(error.message);
    }

    // Update the session's last_message_at and last_message_preview
    const { error: updateError } = await supabase
      .from("chat_sessions")
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: content.substring(0, 100), // Truncate for preview
        status: 'unread',
        deleted_by_admin: false, // Set to false when a new message is added by the user
      })
      .eq("id", sessionId);

    if (updateError) {
      console.error("Error updating session after adding message:", updateError);
      // Don't throw here, as the message was already added
    }

    return data.id;
  },

  async createOrUpdateSession(agentId: string, sessionId?: string, userId?: string, forChatbotWidget: boolean = false): Promise<string> {
    const storageKey = `chatbot_session_${agentId}`;
    const storedSessionId = localStorage.getItem(storageKey);
    let finalSessionId: string | undefined = undefined;

    

    if (userId) {
      // For authenticated users, try to find an existing session first
      const existingUserSession = await this.getLatestSessionForUserAndAgent(userId, agentId, forChatbotWidget);
      if (existingUserSession) {
        finalSessionId = existingUserSession.id;
        
      }
    }

    if (!finalSessionId && storedSessionId) {
      // If no user-specific session found, check for a stored anonymous session
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("id")
        .eq("id", storedSessionId)
        .single();

      if (error && error.code !== 'PGRST116') { // Ignore 'not found' error
        console.error("[createOrUpdateSession] Error checking for stored session:", error);
      } else if (data) {
        finalSessionId = data.id;
        
      }
    }

    if (finalSessionId) {
      // If a session ID is determined, ensure it's associated with the current user if logged in
      if (userId) {
        const { error: updateError } = await supabase
          .from("chat_sessions")
          .update({ user_id: userId } as Partial<ChatSession>)
          .eq("id", finalSessionId);
        if (updateError) {
          console.error("[createOrUpdateSession] Error updating user_id for session:", updateError);
        }
      }
      localStorage.setItem(storageKey, finalSessionId); // Ensure session ID is stored
      return finalSessionId;
    }

    // If no existing session found, create a new one
    
    const { data: newSession, error: newSessionError } = await supabase
      .from("chat_sessions")
      .insert({ agent_id: agentId, user_id: userId })
      .select("id")
      .single();

    if (newSessionError) {
      console.error("[createOrUpdateSession] Error creating new session:", newSessionError);
      throw new Error(newSessionError.message);
    }

    
    localStorage.setItem(storageKey, newSession.id); // Store the new session ID
    return newSession.id;
  },

  async getConversationDetails(sessionId: string, limit = 10): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching conversation details:", error);
      throw new Error(error.message);
    }
    return data.reverse() as ChatMessage[];
  },

  async getLatestSessionForUserAndAgent(userId: string, agentId: string, forChatbotWidget: boolean = false): Promise<ChatSession | null> {
    let query = supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("agent_id", agentId)
      .order("last_message_at", { ascending: false })
      .limit(1);

    if (forChatbotWidget) {
      // When called from chatbot widget, do not filter by deleted_by_admin
      // as the user should still see their history even if admin soft-deleted it.
    } else {
      // For admin views, only show non-deleted sessions by default
      query = query.eq("deleted_by_admin", false);
    }

    const { data, error } = await query.single();

    if (error && error.code !== "PGRST116") { // Ignore 'not found' error
      console.error("Error fetching latest session:", error);
      throw new Error(error.message);
    }
    return data as ChatSession | null;
  },

  async updateLinkedInProfile(userId: string, linkedInUrl: string): Promise<void> {
    const { error } = await supabase
      .from("profiles")
      .update({ linkedin_profile_url: linkedInUrl } as Partial<Profile>)
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating LinkedIn profile:", error);
      throw new Error(error.message);
    }
  },

  async softDeleteChatSession(sessionId: string): Promise<void> {
    
    const { data, error } = await supabase
      .from("chat_sessions")
      .update({ deleted_by_admin: true } as Partial<ChatSession>)
      .eq("id", sessionId);

    if (error) {
      console.error("[softDeleteChatSession] Supabase Error:", error);
      throw new Error(error.message);
    } else if (!data || (Array.isArray(data) && data.length === 0)) { // Handle null or empty array for data
      console.warn("[softDeleteChatSession] Supabase returned no data, but no error. Possible RLS or no matching row.", { data, error });
      // Optionally throw an error here if no rows were affected and it's unexpected
      // throw new Error("Soft delete failed: No matching session found or RLS denied.");
    } else {
      
    }
  },

  async hardDeleteChatSession(sessionId: string): Promise<void> {
    
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (user && user.user) {
      
    } else {
      
    }

    // First, check if the session is anonymous
    
    const { data: sessionData, error: sessionError } = await (supabase
      .from("chat_sessions")
      .select("user_id") as any)
      .eq("id", sessionId)
      .single();

    if (sessionError) {
      console.error("[hardDeleteChatSession] Supabase Error (fetch session):", sessionError);
      throw new Error(sessionError.message);
    }

    const session: { user_id: string | null } = sessionData;

    

    if (session.user_id === null) {
      
      // If anonymous, hard delete message feedback, then messages, and then the session

      
      const { error: sessionDeleteError, data: sessionDeleteData } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("id", sessionId);

      if (sessionDeleteError) {
        console.error("[hardDeleteChatSession] Supabase Error (session delete):", sessionDeleteError);
        throw new Error(sessionDeleteError.message);
        } else if (sessionDeleteData && sessionDeleteData.length === 0) { // No matching rows found, which is fine
        
        } else {
        
      }
    } else {
      
      // If not anonymous, perform a soft delete (update deleted_by_admin flag)
      await this.softDeleteChatSession(sessionId);
      
    }
  },

  async updateChatSessionStatus(sessionId: string, newStatus: string): Promise<void> {
    console.log(`[updateChatSessionStatus] Attempting to update session ${sessionId} status to ${newStatus}`);
    const { error } = await supabase
      .from("chat_sessions")
      .update({ status: newStatus })
      .eq("id", sessionId);

    if (error) {
      console.error("[updateChatSessionStatus] Supabase Error:", error);
      throw new Error(error.message);
    } else {
      console.log(`[updateChatSessionStatus] Successfully updated session ${sessionId} status to ${newStatus}.`);
    }
  },

  async incrementCtaButtonClick(sessionId: string, buttonIndex: number): Promise<void> {
    const columnToUpdate = `cta_button_${buttonIndex + 1}_clicks`;
    console.log(`[incrementCtaButtonClick] Incrementing ${columnToUpdate} for session ${sessionId}`);

    // Fetch current value to increment it
    const { data, error: fetchError } = await supabase
      .from("chat_sessions")
      .select(columnToUpdate)
      .eq("id", sessionId)
      .single();

    if (fetchError) {
      console.error("[incrementCtaButtonClick] Error fetching current CTA click count:", fetchError);
      throw new Error(fetchError.message);
    }

    const currentCount = data ? data[columnToUpdate] || 0 : 0;
    const newCount = currentCount + 1;

    const { error: updateError } = await supabase
      .from("chat_sessions")
      .update({ [columnToUpdate]: newCount })
      .eq("id", sessionId);

    if (updateError) {
      console.error("[incrementCtaButtonClick] Error updating CTA click count:", updateError);
      throw new Error(updateError.message);
    } else {
      console.log(`[incrementCtaButtonClick] Successfully incremented ${columnToUpdate} to ${newCount} for session ${sessionId}.`);
    }
  },
};