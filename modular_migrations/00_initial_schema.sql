-- This file contains the complete schema for the database, including all tables, columns, indexes, functions, and triggers.

-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_net;

--------------------------------------------------------------------------------
-- Tables
--------------------------------------------------------------------------------

-- Profiles Table: Stores user profile information, linked to Supabase auth.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  openai_api_key TEXT,
  default_ai_agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  persona_data BOOLEAN DEFAULT FALSE,
  linkedin_profile_url TEXT
);

-- Agents Table: Stores the configuration for each chatbot agent.
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  welcome_message TEXT DEFAULT 'Hello! How can I help you today?',
  cta_buttons JSONB DEFAULT '[]'::jsonb,
  suggested_prompts TEXT[] DEFAULT '{}',
  rotating_messages TEXT[] DEFAULT '{}',
  colors JSONB DEFAULT '{"primary": "#3B82F6", "bubble": "#F3F4F6", "text": "#1F2937"}'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  dynamic_prompts JSONB DEFAULT '[]'::jsonb,
  lead_collection_enabled BOOLEAN DEFAULT FALSE,
  lead_form_triggers JSONB DEFAULT '[]'::jsonb,
  lead_backup_trigger JSONB DEFAULT '{"enabled": false, "message_count": 5}'::jsonb,
  lead_form_fields JSONB DEFAULT '[]'::jsonb,
  lead_submit_text TEXT DEFAULT 'Submit',
  lead_success_message TEXT DEFAULT 'Thank you! We will get back to you soon.',
  linkedin_url TEXT,
  persona JSONB,
  linkedin_prompt_message_count INTEGER DEFAULT 0,
  ai_model_config JSONB,
  openai_api_key TEXT,
  ai_mode TEXT NOT NULL DEFAULT 'chat_completion' CHECK (ai_mode IN ('chat_completion', 'assistant')),
  openai_assistant_id TEXT
);

-- Chat Sessions Table: Stores each individual chat conversation.
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  linkedin_profile TEXT,
  user_email TEXT,
  status TEXT DEFAULT 'unread' CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'unread'::text, 'read'::text, 'archived'::text])),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  tags TEXT[] DEFAULT '{}',
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  cta_button_1_clicks INTEGER DEFAULT 0,
  cta_button_2_clicks INTEGER DEFAULT 0,
  session_cookie TEXT,
  linkedin_prompt_message_count INTEGER DEFAULT 0,
  deleted_by_admin BOOLEAN DEFAULT FALSE,
  last_message_preview TEXT
);

-- Chat Messages Table: Stores individual messages within a chat session.
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'bot')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Lead Submissions Table: Stores data from lead collection forms.
CREATE TABLE IF NOT EXISTS public.lead_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'unread'
);

-- Prompt Responses Table: Stores predefined responses to specific prompts.
CREATE TABLE IF NOT EXISTS public.prompt_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  is_dynamic BOOLEAN NOT NULL DEFAULT FALSE,
  keywords TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Message Feedback Table: Stores user feedback (up/down votes) on messages.
CREATE TABLE IF NOT EXISTS public.message_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  message_id UUID NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Performance Table: Stores persona data generated from LinkedIn profiles.
CREATE TABLE IF NOT EXISTS public.user_performance (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    linkedin_url TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    raw_scraped_data JSONB,
    enriched_data JSONB
);

--------------------------------------------------------------------------------
-- Indexes
--------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles (user_id);
CREATE INDEX IF NOT EXISTS profiles_default_ai_agent_id_idx ON public.profiles (default_ai_agent_id);
CREATE INDEX IF NOT EXISTS profiles_linkedin_profile_url_idx ON public.profiles (linkedin_profile_url);
CREATE INDEX IF NOT EXISTS agents_user_id_idx ON public.agents (user_id);
CREATE INDEX IF NOT EXISTS chat_sessions_agent_id_idx ON public.chat_sessions (agent_id);
CREATE INDEX IF NOT EXISTS chat_sessions_user_id_idx ON public.chat_sessions (user_id);
CREATE INDEX IF NOT EXISTS chat_sessions_status_idx ON public.chat_sessions (status);
CREATE INDEX IF NOT EXISTS chat_messages_session_id_idx ON public.chat_messages (session_id);
CREATE INDEX IF NOT EXISTS lead_submissions_agent_id_idx ON public.lead_submissions (agent_id);
CREATE INDEX IF NOT EXISTS lead_submissions_session_id_idx ON public.lead_submissions (session_id);
CREATE INDEX IF NOT EXISTS prompt_responses_agent_id_idx ON public.prompt_responses (agent_id);
CREATE INDEX IF NOT EXISTS message_feedback_session_id_idx ON public.message_feedback (session_id);
CREATE INDEX IF NOT EXISTS message_feedback_message_id_idx ON public.message_feedback (message_id);
CREATE INDEX IF NOT EXISTS user_performance_user_id_idx ON public.user_performance (user_id);

--------------------------------------------------------------------------------
-- Functions
--------------------------------------------------------------------------------

-- Function to handle new user creation by inserting a corresponding profile.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, role)
  VALUES (new.id, new.email, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically set the updated_at timestamp on table updates.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check if the current user is an admin or superadmin.
CREATE OR REPLACE FUNCTION public.is_admin_or_superadmin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid()
      AND (role = 'admin' OR role = 'superadmin')
  );
END;
$$;

-- Function to call the Edge Function to process a LinkedIn profile.
CREATE OR REPLACE FUNCTION public.call_linkedin_profile_processor_edge_function()
RETURNS TRIGGER AS $$
DECLARE
  SUPABASE_URL TEXT := 'https://gfhnoeywoabeiijasumy.supabase.co';
  SUPABASE_ANON_KEY TEXT := 'YOUR_SUPABASE_ANON_KEY'; -- Replace with your actual anon key
  EDGE_FUNCTION_URL TEXT;
  PAYLOAD JSONB;
BEGIN
  EDGE_FUNCTION_URL := SUPABASE_URL || '/functions/v1/process-linkedin-profile';
  PAYLOAD := jsonb_build_object(
    'record', jsonb_build_object(
      'user_id', NEW.user_id,
      'linkedin_profile_url', NEW.linkedin_profile_url
    )
  );
  PERFORM net.http_post(
    url := EDGE_FUNCTION_URL,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || SUPABASE_ANON_KEY
    ),
    body := PAYLOAD
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update the last_message_preview in chat_sessions.
CREATE OR REPLACE FUNCTION public.update_last_message_preview()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_sessions
  SET 
    last_message_preview = LEFT(NEW.content, 100),
    last_message_at = NEW.created_at
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.is_admin_or_superadmin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.call_linkedin_profile_processor_edge_function() TO authenticated;

--------------------------------------------------------------------------------
-- Triggers
--------------------------------------------------------------------------------

-- Trigger to create a profile when a new user signs up in Supabase auth.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers to automatically update the 'updated_at' timestamp on modification.
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_agents_updated_at ON public.agents;
CREATE TRIGGER set_agents_updated_at
BEFORE UPDATE ON public.agents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_chat_sessions_updated_at ON public.chat_sessions;
CREATE TRIGGER set_chat_sessions_updated_at
BEFORE UPDATE ON public.chat_sessions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_prompt_responses_updated_at ON public.prompt_responses;
CREATE TRIGGER set_prompt_responses_updated_at
BEFORE UPDATE ON public.prompt_responses
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger to process a LinkedIn profile URL when it's updated.
CREATE OR REPLACE TRIGGER on_linkedin_profile_update
AFTER UPDATE OF linkedin_profile_url ON public.profiles
FOR EACH ROW
WHEN (OLD.linkedin_profile_url IS DISTINCT FROM NEW.linkedin_profile_url AND NEW.linkedin_profile_url IS NOT NULL)
EXECUTE FUNCTION public.call_linkedin_profile_processor_edge_function();

-- Trigger to update the last message preview when a new chat message is inserted.
CREATE TRIGGER on_new_chat_message
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_last_message_preview();