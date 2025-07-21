import { supabase } from "../integrations/supabase/client";
import type { ChatSession, ChatMessage, ConversationFilters, RawChatSessionData } from "@/types/agent";
import type { Profile } from "@/types/profile";

export const ConversationService = {
  async getChatSessions(agentId: string, filters: ConversationFilters = {}, includeDeleted: boolean = false): Promise<ChatSession[]> {
    let query: any = supabase
      .from("chat_sessions")
      .select("*, messages:chat_messages(count)")
      .eq("agent_id", agentId);

    if (!includeDeleted) {
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

    const { data: sessionsData, error: sessionsError } = await query
      .order("last_message_at", { ascending: false });

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
      console.log(`[getChatSessions] Found ${sessionsToDelete.length} anonymous, empty sessions to delete.`);
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
      return {
        ...session,
        user_name: profile?.full_name,
        user_email: profile?.email,
        message_count: session.messages[0]?.count || 0,
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
    return data.id;
  },

  async createOrUpdateSession(agentId: string, sessionId?: string, userId?: string): Promise<string> {
    const storageKey = `chatbot_session_${agentId}`;
    const storedSessionId = localStorage.getItem(storageKey);
    const currentSessionId = sessionId || storedSessionId;

    console.log(`[createOrUpdateSession] Attempting to create or update session. Provided sessionId: ${sessionId}, Stored sessionId: ${storedSessionId}, userId: ${userId}`);

    if (currentSessionId) {
      console.log(`[createOrUpdateSession] Checking for existing session with ID: ${currentSessionId}`);
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("id")
        .eq("id", currentSessionId)
        .single();

      if (error && error.code !== 'PGRST116') { // Ignore 'not found' error
        console.error("[createOrUpdateSession] Error checking for existing session:", error);
      } else if (data) {
        console.log(`[createOrUpdateSession] Existing session found: ${data.id}`);
        if (userId) {
          console.log(`[createOrUpdateSession] Updating user_id for session ${data.id} to ${userId}`);
          const { error: updateError } = await supabase
            .from("chat_sessions")
            .update({ user_id: userId } as Partial<ChatSession>)
            .eq("id", currentSessionId);
          if (updateError) {
            console.error("[createOrUpdateSession] Error updating session user_id:", updateError);
          }
        }
        localStorage.setItem(storageKey, data.id); // Ensure session ID is stored
        return data.id;
      }
    }

    console.log("[createOrUpdateSession] No valid existing session found or provided. Creating a new session.");
    const { data: newSession, error: newSessionError } = await supabase
      .from("chat_sessions")
      .insert({ agent_id: agentId, user_id: userId })
      .select("id")
      .single();

    if (newSessionError) {
      console.error("[createOrUpdateSession] Error creating new session:", newSessionError);
      throw new Error(newSessionError.message);
    }

    console.log(`[createOrUpdateSession] Successfully created new session: ${newSession.id}`);
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

  async getLatestSessionForUserAndAgent(userId: string, agentId: string): Promise<ChatSession | null> {
    const { data, error } = await (supabase
      .from("chat_sessions")
      .select("*") as any)
      .eq("user_id", userId)
      .eq("agent_id", agentId)
      .order("last_message_at", { ascending: false })
      .limit(1)
      .single();

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
    console.log(`[softDeleteChatSession] Attempting to soft-delete session: ${sessionId}`);
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
      console.log(`[softDeleteChatSession] Successfully soft-deleted session ${sessionId}. Supabase response:`, { data, error });
    }
  },

  async hardDeleteChatSession(sessionId: string): Promise<void> {
    console.log(`[hardDeleteChatSession] Attempting to hard-delete session: ${sessionId}`);
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (user && user.user) {
      console.log(`[hardDeleteChatSession] Current authenticated user ID: ${user.user.id}`);
    } else {
      console.log(`[hardDeleteChatSession] No authenticated user or error fetching user:`, userError);
    }

    // First, check if the session is anonymous
    console.log(`[hardDeleteChatSession] Fetching session details for ${sessionId} to check anonymity.`);
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

    console.log(`[hardDeleteChatSession] Session ${sessionId} user_id: ${session.user_id}`);

    if (session.user_id === null) {
      console.log(`[hardDeleteChatSession] Session ${sessionId} is anonymous. Performing hard delete.`);
      // If anonymous, hard delete message feedback, then messages, and then the session

      console.log(`[hardDeleteChatSession] Deleting chat session: ${sessionId} (cascading deletes for messages and feedback)`);
      const { error: sessionDeleteError, data: sessionDeleteData } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("id", sessionId);

      if (sessionDeleteError) {
        console.error("[hardDeleteChatSession] Supabase Error (session delete):", sessionDeleteError);
        throw new Error(sessionDeleteError.message);
        } else if (sessionDeleteData && sessionDeleteData.length === 0) { // No matching rows found, which is fine
        console.log(`[hardDeleteChatSession] No chat session found for session ${sessionId}.`);
        } else {
        console.log(`[hardDeleteChatSession] Session ${sessionId} hard deleted. Supabase response:`, { data: sessionDeleteData, error: sessionDeleteError });
      }
    } else {
      console.log(`[hardDeleteChatSession] Session ${sessionId} is not anonymous. Performing soft delete.`);
      // If not anonymous, perform a soft delete (update deleted_by_admin flag)
      await this.softDeleteChatSession(sessionId);
      console.log(`[hardDeleteChatSession] Soft delete initiated for session ${sessionId}.`);
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
};