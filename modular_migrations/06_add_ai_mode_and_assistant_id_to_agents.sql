-- Add ai_mode and openai_assistant_id to public.agents table
ALTER TABLE public.agents
ADD COLUMN ai_mode TEXT NOT NULL DEFAULT 'chat_completion' CHECK (ai_mode IN ('chat_completion', 'assistant')),
ADD COLUMN openai_assistant_id TEXT;
