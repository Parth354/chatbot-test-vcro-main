-- This file contains all application-level Row Level Security (RLS) policies.

-- Enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_performance DISABLE ROW LEVEL SECURITY; -- Explicitly disabled

--------------------------------------------------------------------------------
-- RLS Policies for public.profiles
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- RLS Policies for public.agents
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own agents" ON public.agents;
DROP POLICY IF EXISTS "Users can create their own agents" ON public.agents;
DROP POLICY IF EXISTS "Users can update their own agents" ON public.agents;
DROP POLICY IF EXISTS "Users can delete their own agents" ON public.agents;
DROP POLICY IF EXISTS "Public can view active agents for embedding" ON public.agents;

CREATE POLICY "Users can view their own agents" ON public.agents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own agents" ON public.agents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own agents" ON public.agents FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own agents" ON public.agents FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Public can view active agents for embedding" ON public.agents FOR SELECT TO anon, authenticated USING (status = 'active');

--------------------------------------------------------------------------------
-- RLS Policies for public.chat_sessions
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow anon/auth to create chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Admin can view their agent's chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Chatbot user can view their own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Admin can soft-delete chat sessions" ON public.chat_sessions;

CREATE POLICY "Allow anon/auth to create chat sessions" ON public.chat_sessions FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can view their agent's chat sessions"
  ON public.chat_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agents
      WHERE agents.id = chat_sessions.agent_id
      AND agents.user_id = auth.uid()
    )
    AND chat_sessions.deleted_by_admin = FALSE
  );

CREATE POLICY "Chatbot user can view their own sessions"
  ON public.chat_sessions FOR SELECT
  TO authenticated
  USING (chat_sessions.user_id = auth.uid());

CREATE POLICY "Admin can soft-delete chat sessions"
  ON public.chat_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.agents
      WHERE agents.id = chat_sessions.agent_id
      AND agents.user_id = auth.uid()
    )
  );

--------------------------------------------------------------------------------
-- RLS Policies for public.chat_messages
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow anon/auth to insert chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admin can view their agent's chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Chatbot user can view their own chat messages" ON public.chat_messages;

CREATE POLICY "Allow anon/auth to insert chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs
      WHERE cs.id = chat_messages.session_id
      AND (cs.user_id = auth.uid() OR cs.user_id IS NULL)
    )
  );

CREATE POLICY "Admin can view their agent's chat messages"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs
      JOIN public.agents a ON cs.agent_id = a.id
      WHERE cs.id = chat_messages.session_id
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Chatbot user can view their own chat messages"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs
      WHERE cs.id = chat_messages.session_id
      AND cs.user_id = auth.uid()
    )
  );

--------------------------------------------------------------------------------
-- RLS Policies for public.lead_submissions
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view lead submissions for their agents" ON public.lead_submissions;
DROP POLICY IF EXISTS "Allow users to create lead submissions for their sessions" ON public.lead_submissions;

CREATE POLICY "Users can view lead submissions for their agents"
ON public.lead_submissions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.agents
  WHERE agents.id = lead_submissions.agent_id
  AND agents.user_id = auth.uid()
));

CREATE POLICY "Allow users to create lead submissions for their sessions"
ON public.lead_submissions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_sessions cs
    WHERE cs.id = lead_submissions.session_id
    AND (
      cs.user_id = auth.uid() OR cs.user_id IS NULL
    )
  )
);

--------------------------------------------------------------------------------
-- RLS Policies for public.prompt_responses
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view prompts for their agents" ON public.prompt_responses;
DROP POLICY IF EXISTS "Users can create prompts for their agents" ON public.prompt_responses;
DROP POLICY IF EXISTS "Users can update prompts for their agents" ON public.prompt_responses;
DROP POLICY IF EXISTS "Users can delete prompts for their agents" ON public.prompt_responses;
DROP POLICY IF EXISTS "Public can view prompt responses for active agents" ON public.prompt_responses;

CREATE POLICY "Users can view prompts for their agents"
ON public.prompt_responses FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.agents
  WHERE agents.id = prompt_responses.agent_id
  AND agents.user_id = auth.uid()
));

CREATE POLICY "Users can create prompts for their agents"
ON public.prompt_responses FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.agents
  WHERE agents.id = prompt_responses.agent_id
  AND agents.user_id = auth.uid()
));

CREATE POLICY "Users can update prompts for their agents"
ON public.prompt_responses FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.agents
  WHERE agents.id = prompt_responses.agent_id
  AND agents.user_id = auth.uid()
));

CREATE POLICY "Users can delete prompts for their agents"
ON public.prompt_responses FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.agents
  WHERE agents.id = prompt_responses.agent_id
  AND agents.user_id = auth.uid()
));

CREATE POLICY "Public can view prompt responses for active agents"
ON public.prompt_responses FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.agents
    WHERE agents.id = prompt_responses.agent_id
    AND agents.status = 'active'
  )
);

--------------------------------------------------------------------------------
-- RLS Policies for public.message_feedback
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow anon/auth to create message feedback" ON public.message_feedback;
DROP POLICY IF EXISTS "Admin can view their agent's message feedback" ON public.message_feedback;
DROP POLICY IF EXISTS "Users can update their own message feedback" ON public.message_feedback;
DROP POLICY IF EXISTS "Allow agent owner to delete message feedback" ON public.message_feedback;

CREATE POLICY "Allow anon/auth to create message feedback"
  ON public.message_feedback FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can view their agent's message feedback"
  ON public.message_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs
      JOIN public.agents a ON cs.agent_id = a.id
      WHERE cs.id = message_feedback.session_id
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own message feedback"
  ON public.message_feedback FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs
      WHERE cs.id = message_feedback.session_id
      AND cs.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow agent owner to delete message feedback"
  ON public.message_feedback FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs
      JOIN public.agents a ON cs.agent_id = a.id
      WHERE cs.id = message_feedback.session_id
      AND a.user_id = auth.uid()
    )
  );
