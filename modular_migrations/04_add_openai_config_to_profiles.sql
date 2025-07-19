-- Add OpenAI API key and default AI agent ID to public.profiles
ALTER TABLE public.profiles
ADD COLUMN openai_api_key TEXT,
ADD COLUMN default_ai_agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL;

-- Optional: Add an index for default_ai_agent_id for faster lookups
CREATE INDEX IF NOT EXISTS profiles_default_ai_agent_id_idx ON public.profiles (default_ai_agent_id);
