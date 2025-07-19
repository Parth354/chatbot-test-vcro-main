import { Json } from "../integrations/supabase/types";

export interface Agent {
  id: string
  user_id: string
  name: string
  description: string | null
  avatar_url: string | null
  welcome_message: string
  cta_buttons: any // Json type from Supabase
  rotating_messages: string[]
  colors: any // Json type from Supabase
  status: 'active' | 'inactive'
  lead_collection_enabled: boolean
  lead_form_triggers: LeadFormTrigger[]
  lead_backup_trigger: LeadBackupTrigger
  lead_form_fields: LeadFormField[]
  lead_submit_text: string
  lead_success_message: string
  linkedin_prompt_message_count?: number; // Added for LinkedIn prompt
  created_at: string
  updated_at: string
  linkedin_url?: string | null
  persona?: Json | null
  ai_model_config?: { model_name: string } | null
  openai_api_key?: string | null; // Added openai_api_key
  ai_mode?: 'chat_completion' | 'assistant';
  openai_assistant_id?: string | null;
  total_conversations?: number; // Added for dashboard metrics
  total_messages?: number; // Added for dashboard metrics
  linkedin_profile_url?: string; // Added for profile
}

export interface CTAButton {
  label: string
  url: string
}

export interface AgentColors {
  primary: string
  bubble: string
  text: string
}

export interface LeadFormTrigger {
  id: string
  keywords: string[]
  enabled: boolean
}

export interface LeadBackupTrigger {
  enabled: boolean
  message_count: number
}

export interface LeadFormField {
  id: string
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox'
  label: string
  placeholder?: string
  required: boolean
  options?: string[] // For select fields
  order: number
  system_field?: string // For system fields like 'linkedin_profile'
  default_enabled?: boolean // For default system fields
}


export interface LeadSubmission {
  id: string
  agent_id: string
  session_id?: string
  form_data: Record<string, any>
  submitted_at: string
  created_at: string
}

export interface CreateAgentData {
  name: string
  description?: string
  avatar_url?: string
  welcome_message?: string
  cta_buttons?: CTAButton[]
  rotating_messages?: string[]
  colors?: AgentColors
  status?: 'active' | 'inactive'
  lead_collection_enabled?: boolean
  lead_form_triggers?: LeadFormTrigger[]
  lead_backup_trigger?: LeadBackupTrigger
  lead_form_fields?: LeadFormField[]
  lead_submit_text?: string
  lead_success_message?: string
  openai_api_key?: string; // Added openai_api_key
  ai_mode?: 'chat_completion' | 'assistant';
  openai_assistant_id?: string;
  linkedin_url?: string;
  linkedin_prompt_message_count?: number;
  ai_model_config?: { model_name: string };
}

export interface UpdateAgentData extends Partial<CreateAgentData> {}

export interface ChatSession {
  id: string;
  agent_id: string;
  user_id: string | null;
  user_name: string | null;
  linkedin_profile: string | null;
  user_email: string | null;
  status: 'active' | 'completed' | 'unread' | 'read' | 'archived';
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  last_message_at: string;
  created_at: string;
  updated_at: string;
  cta_button_1_clicks: number;
  cta_button_2_clicks: number;
  session_cookie: string | null;
  linkedin_prompt_message_count: number;
  deleted_by_admin: boolean;
  message_count?: number;
  last_message_preview?: string;
}

export interface ConversationFilters {
  dateFrom?: string;
  dateTo?: string;
  keyword?: string;
  status?: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  content: string;
  sender: 'user' | 'bot';
  created_at: string;
}

export interface RawChatSessionData extends Omit<ChatSession, 'message_count'> {
  messages: Array<{ count: number }>;
}

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role?: 'user' | 'admin' | 'superadmin';
  created_at: string;
  updated_at: string;
  linkedin_profile_url?: string;
}