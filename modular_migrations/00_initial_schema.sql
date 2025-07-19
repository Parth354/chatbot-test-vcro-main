-- Tables
DROP TABLE IF EXISTS public.agents CASCADE;
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('user', 'admin', 'superadmin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

DROP TABLE IF EXISTS public.agents CASCADE;
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
  dynamic_prompts JSONB DEFAULT '[
  {
    "id": "when-prompt",
    "keywords": ["when"],
    "message": "When can we have a meeting",
    "enabled": true
  },
  {
    "id": "how-prompt", 
    "keywords": ["how"],
    "message": "How can you help me?",
    "enabled": true
  }
]'::jsonb,
  lead_collection_enabled boolean DEFAULT false,
  lead_form_triggers jsonb DEFAULT '[]'::jsonb,
  lead_backup_trigger jsonb DEFAULT '{"enabled": false, "message_count": 5}'::jsonb,
  lead_form_fields jsonb DEFAULT '[{"id": "linkedin_profile", "type": "text", "label": "LinkedIn Profile", "placeholder": "LinkedIn Profile URL", "required": true, "order": 0, "system_field": "linkedin_profile", "default_enabled": true}]'::jsonb,
  lead_submit_text text DEFAULT 'Submit',
  lead_success_message text DEFAULT 'Thank you! We will get back to you soon.',
  linkedin_url TEXT,
  persona JSONB,
  linkedin_prompt_message_count INTEGER DEFAULT 0,
  ai_model_config JSONB
);

CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Link to auth.users for chatbot users
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
  deleted_by_admin BOOLEAN DEFAULT FALSE -- Soft delete flag for admin panel
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'bot')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lead_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
  form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'unread' -- Status for lead submissions
);

CREATE TABLE IF NOT EXISTS public.prompt_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  is_dynamic BOOLEAN NOT NULL DEFAULT false,
  keywords TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.message_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE, -- Ensure cascade delete
  message_id UUID NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles (user_id);
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

-- Row Level Security (Enable RLS after tables are created)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_feedback ENABLE ROW LEVEL SECURITY;

-- Functions
-- Function to handle new user creation (from 01_functions.sql)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, email)
  VALUES (new.id, new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set updated_at timestamp (from 01_functions.sql)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
-- Trigger for new auth.users (from 06_triggers.sql)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers to set updated_at (from 06_triggers.sql)
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