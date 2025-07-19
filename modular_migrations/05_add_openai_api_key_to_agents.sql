-- Add openai_api_key to public.agents table
ALTER TABLE public.agents
ADD COLUMN openai_api_key TEXT;
