import { supabase } from "@/integrations/supabase/client";
import type { Agent, CreateAgentData, UpdateAgentData } from "@/types/agent";
import { FeedbackService } from "./feedbackService"; // Import FeedbackService

export class AgentService {
  // Helper function to parse agent data from Supabase
  private static parseAgentData(rawData: any): Agent {
    return {
      ...rawData,
      cta_buttons: typeof rawData.cta_buttons === 'string' 
        ? JSON.parse(rawData.cta_buttons) 
        : rawData.cta_buttons || [],
      colors: typeof rawData.colors === 'string'
        ? JSON.parse(rawData.colors)
        : rawData.colors || { primary: "#3B82F6", bubble: "#F3F4F6", text: "#1F2937" },
      lead_form_fields: typeof rawData.lead_form_fields === 'string'
        ? JSON.parse(rawData.lead_form_fields)
        : rawData.lead_form_fields || [],
      lead_form_triggers: rawData.lead_form_triggers || [],
      openai_api_key: rawData.openai_api_key || null,
    }
  }

  static async getAgents(userId: string): Promise<Agent[]> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch agents: ${error.message}`);
    }

    const agentsWithMetrics: Agent[] = [];
    for (const rawAgent of data || []) {
      const agent = this.parseAgentData(rawAgent);
      const metrics = await this.getAgentMetrics(agent.id); // Call getAgentMetrics for each agent
      agentsWithMetrics.push({
        ...agent,
        total_conversations: metrics.totalSessions,
        total_messages: metrics.totalMessages,
      });
    }
    return agentsWithMetrics;
  }

  static async getAgent(id: string, client = supabase): Promise<Agent | null> {
    const { data, error } = await client
      .from('agents')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Agent not found
      }
      throw new Error(`Failed to fetch agent: ${error.message}`)
    }

    return this.parseAgentData(data)
  }

  static async createAgent(agentData: CreateAgentData): Promise<Agent> {
    console.log("AgentService: Attempting to get user session...");
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("AgentService: Error getting user session:", userError);
      throw new Error(`Failed to get user session: ${userError.message}`);
    }
    if (!user) {
      console.error("AgentService: No authenticated user found.");
      throw new Error('User must be authenticated to create agents');
    }
    console.log("AgentService: User session obtained. User ID:", user.id);

    const insertData: any = {
      user_id: user.id,
      name: agentData.name,
      description: agentData.description || null,
      avatar_url: agentData.avatar_url || null,
      welcome_message: agentData.welcome_message || 'Hello! How can I help you today?',
      cta_buttons: agentData.cta_buttons || [],
      rotating_messages: agentData.rotating_messages || [],
      
      colors: agentData.colors || {
        primary: "#3B82F6",
        bubble: "#F3F4F6", 
        text: "#1F2937"
      },
      status: agentData.status || 'active',
      lead_collection_enabled: agentData.lead_collection_enabled || false,
      lead_form_triggers: agentData.lead_form_triggers || [],
      lead_backup_trigger: agentData.lead_backup_trigger || { enabled: false, message_count: 5 },
      lead_form_fields: agentData.lead_form_fields || [],
      lead_submit_text: agentData.lead_submit_text || 'Submit',
      lead_success_message: agentData.lead_success_message || 'Thank you! We will get back to you soon.',
      linkedin_url: agentData.linkedin_url || null,
      linkedin_prompt_message_count: agentData.linkedin_prompt_message_count || 0,
      ai_model_config: agentData.ai_model_config || { model_name: "gpt-3.5-turbo", api_key: "" },
      openai_api_key: agentData.openai_api_key || null,
      ai_mode: agentData.ai_mode || 'chat_completion',
      openai_assistant_id: agentData.openai_assistant_id || null,
    }

    console.log("AgentService: Prepared insert data:", insertData);
    console.log("AgentService: Attempting to insert new agent into 'agents' table...");
    const { data, error } = await supabase
      .from('agents')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("AgentService: Supabase insert error:", error);
      throw new Error(`Failed to create agent: ${error.message}`);
    }
    console.log("AgentService: Agent created successfully:", data);

    return this.parseAgentData(data)
  }

  static async updateAgent(id: string, agentData: UpdateAgentData): Promise<Agent> {
    // Convert the update data to match Supabase schema
    const updateData: any = {}
    
    if (agentData.name !== undefined) updateData.name = agentData.name
    if (agentData.description !== undefined) updateData.description = agentData.description
    if (agentData.avatar_url !== undefined) updateData.avatar_url = agentData.avatar_url
    if (agentData.welcome_message !== undefined) updateData.welcome_message = agentData.welcome_message
    if (agentData.cta_buttons !== undefined) updateData.cta_buttons = agentData.cta_buttons
    if (agentData.rotating_messages !== undefined) updateData.rotating_messages = agentData.rotating_messages
    
    if (agentData.colors !== undefined) updateData.colors = agentData.colors
    if (agentData.status !== undefined) updateData.status = agentData.status
    if (agentData.lead_collection_enabled !== undefined) updateData.lead_collection_enabled = agentData.lead_collection_enabled
    if (agentData.lead_form_triggers !== undefined) updateData.lead_form_triggers = agentData.lead_form_triggers
    if (agentData.lead_backup_trigger !== undefined) updateData.lead_backup_trigger = agentData.lead_backup_trigger
    if (agentData.lead_form_fields !== undefined) updateData.lead_form_fields = agentData.lead_form_fields
    if (agentData.lead_submit_text !== undefined) updateData.lead_submit_text = agentData.lead_submit_text
    if (agentData.lead_success_message !== undefined) updateData.lead_success_message = agentData.lead_success_message
    if (agentData.linkedin_url !== undefined) updateData.linkedin_url = agentData.linkedin_url
    if (agentData.linkedin_prompt_message_count !== undefined) updateData.linkedin_prompt_message_count = agentData.linkedin_prompt_message_count
    if (agentData.ai_model_config !== undefined) updateData.ai_model_config = agentData.ai_model_config
    if (agentData.openai_api_key !== undefined) updateData.openai_api_key = agentData.openai_api_key
    if (agentData.ai_mode !== undefined) updateData.ai_mode = agentData.ai_mode
    if (agentData.openai_assistant_id !== undefined) updateData.openai_assistant_id = agentData.openai_assistant_id

    console.log("Attempting to update agent data for ID:", id, "with data:", updateData);
    const { data, error } = await supabase
      .from('agents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Error updating agent:", error);
      throw new Error(`Failed to update agent: ${error.message}`);
    }
    console.log("Agent updated successfully:", data);

    return this.parseAgentData(data)
  }

  static async deleteAgent(id: string): Promise<void> {
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete agent: ${error.message}`)
    }
  }

  static async getAgentMetrics(agentId: string) {
    // Step 1: Get all session IDs for the given agent
    const { data: sessions, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('agent_id', agentId);

    if (sessionsError) {
      throw new Error(`Failed to fetch sessions: ${sessionsError.message}`);
    }

    const sessionIds = sessions.map(s => s.id);

    // If there are no sessions, return zeroed metrics
    if (sessionIds.length === 0) {
      return {
        totalSessions: 0,
        totalMessages: 0,
        todayMessages: 0,
        leadsRequiringAttention: 0,
        averageResponseTime: "N/A",
        satisfactionRate: "N/A"
      };
    }

    // Step 2: Get metrics using the fetched session IDs
    const { count: messagesCount, error: messagesError } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact' })
      .in('session_id', sessionIds);

    if (messagesError) {
      throw new Error(`Failed to fetch messages: ${messagesError.message}`);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: todayMessagesCount, error: todayError } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact' })
      .in('session_id', sessionIds)
      .gte('created_at', today.toISOString());

    if (todayError) {
      throw new Error(`Failed to fetch today's messages: ${todayError.message}`);
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const { count: yesterdayMessagesCount, error: yesterdayError } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact' })
      .in('session_id', sessionIds)
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', today.toISOString());

    if (yesterdayError) {
      throw new Error(`Failed to fetch yesterday's messages: ${yesterdayError.message}`);
    }

    let { count: leadsRequiringAttention, error: leadsError } = await (supabase
      .from('lead_submissions')
      .select('id', { count: 'exact' })
      .eq('agent_id', agentId)
      .eq('status', 'unread') as any);

    if (leadsError) {
      console.warn('Could not fetch leads requiring attention:', leadsError.message);
    }

    const { positive, total } = await FeedbackService.getFeedbackStats(agentId);
    const satisfactionRate = total > 0 ? `${Math.round((positive / total) * 100)}%` : "N/A";

    return {
      totalSessions: sessions.length,
      totalMessages: messagesCount || 0,
      todayMessages: todayMessagesCount || 0,
      yesterdayMessages: yesterdayMessagesCount || 0,
      leadsRequiringAttention: leadsRequiringAttention || 0,
      averageResponseTime: "< 1 min", // Placeholder
      satisfactionRate: satisfactionRate
    };
  }

  static async getAdminMetrics() {
    // Get chat sessions count
    const { count: sessionsCount, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select('id', { count: 'exact' })

    if (sessionsError) {
      throw new Error(`Failed to fetch sessions: ${sessionsError.message}`);
    }

    // Get messages count
    const { count: messagesCount, error: messagesError } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact' })

    if (messagesError) {
      throw new Error(`Failed to fetch messages: ${messagesError.message}`);
    }

    // Get today's messages
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: todayMessagesCount, error: todayError } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact' })
      .gte('created_at', today.toISOString());

    if (todayError) {
      throw new Error(`Failed to fetch today's messages: ${todayError.message}`);
    }

    // Get leads requiring attention (e.g., unread lead submissions)
    let { count: leadsRequiringAttention, error: leadsError } = await supabase
      .from('lead_submissions')
      .select('id', { count: 'exact' })
      .eq('status', 'unread'); // Assuming a 'status' column in lead_submissions

    if (leadsError) {
      console.warn('Could not fetch leads requiring attention (status column might be missing):', leadsError.message);
      leadsRequiringAttention = 0; // Set to 0 if column is missing or error occurs
    }

    // Calculate responded sessions for "Response Rate"
    const { data: respondedSessionsData, error: respondedSessionsError } = await supabase
      .from('chat_messages')
      .select('session_id', { distinct: true })
      .not('session_id', 'is', null);

    let respondedSessionsCount = 0;
    if (respondedSessionsError) {
      console.warn('Could not fetch responded sessions data:', respondedSessionsError.message);
    } else {
      respondedSessionsCount = respondedSessionsData?.length || 0;
    }

    let satisfactionRate = "N/A";
    if (sessionsCount > 0) {
      satisfactionRate = `${(((respondedSessionsCount || 0) / sessionsCount) * 100).toFixed(0)}%`;
    }

    return {
      totalSessions: sessionsCount || 0,
      totalMessages: messagesCount || 0,
      todayMessages: todayMessagesCount || 0,
      leadsRequiringAttention: leadsRequiringAttention || 0,
      averageResponseTime: "N/A (requires message type/timestamps)", // Updated placeholder
      satisfactionRate: satisfactionRate
    };
  }

  static async getUserPerformanceData(userId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('user_performance')
      .select('enriched_data')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log("No persona data found for user:", userId); // Log if no data
        return null; // No persona data found
      }
      console.error("Error fetching user performance data:", error);
      throw new Error(`Failed to fetch user performance data: ${error.message}`);
    }

    console.log("Fetched persona data from user_performance:", data?.enriched_data); // Log the fetched data
    return data?.enriched_data || null;
  }

  static async getUserPerformanceDataByLinkedIn(linkedinUrl: string): Promise<any | null> {
    // Step 1: Find the user_id from the profiles table using the linkedin_profile_url
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('linkedin_profile_url', linkedinUrl)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        console.log(`No profile found with LinkedIn URL: ${linkedinUrl}`);
        return null;
      }
      console.error("Error fetching profile by LinkedIn URL:", profileError);
      throw new Error(`Failed to fetch profile by LinkedIn URL: ${profileError.message}`);
    }

    if (!profile) {
      return null;
    }

    const userId = profile.user_id;

    // Step 2: Use the user_id to fetch the performance data
    return this.getUserPerformanceData(userId);
  }
}
