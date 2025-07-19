-- Application-specific RLS Policies

-- Policies for public.profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for public.agents
CREATE POLICY "Users can view their own agents" ON public.agents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own agents" ON public.agents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own agents" ON public.agents FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own agents" ON public.agents FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Public can view active agents for embedding" ON public.agents FOR SELECT TO anon, authenticated USING (status = 'active');

-- Policies for public.chat_sessions
-- Allow anyone (anon or authenticated) to create a new session for any agent
CREATE POLICY "Allow anon/auth to create chat sessions"
  ON public.chat_sessions FOR INSERT
  WITH CHECK (true);

-- Admin can view chat sessions for their agents (only non-soft-deleted ones)
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

-- Chatbot users can view their own sessions (even if soft-deleted by admin)
CREATE POLICY "Chatbot user can view their own sessions"
  ON public.chat_sessions FOR SELECT
  TO authenticated -- Applies to any authenticated user, including chatbot users
  USING (chat_sessions.user_id = auth.uid());

-- Admin can soft-delete (update deleted_by_admin) chat sessions for their agents
CREATE POLICY "Admin can soft-delete chat sessions"
  ON public.chat_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.agents
      WHERE agents.id = chat_sessions.agent_id
      AND agents.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agents
      WHERE agents.id = chat_sessions.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- Policies for public.chat_messages
-- Allow anyone (anon or authenticated) to insert messages into their session
CREATE POLICY "Allow anon/auth to insert chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs
      WHERE cs.id = chat_messages.session_id
      AND (cs.user_id = auth.uid() OR cs.user_id IS NULL) -- Session belongs to user or is anonymous
    )
  );

-- Admin can view messages for their agent's sessions (only non-soft-deleted messages)
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

-- Chatbot users can view their own messages (even if soft-deleted by admin)
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

-- Policies for public.lead_submissions
CREATE POLICY "Users can view lead submissions for their agents" 
ON public.lead_submissions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.agents 
  WHERE agents.id = lead_submissions.agent_id 
  AND agents.user_id = auth.uid()
));

CREATE POLICY "Lead submissions can be created for any agent" 
ON public.lead_submissions 
FOR INSERT 
WITH CHECK (true);

-- Policies for public.prompt_responses
CREATE POLICY "Users can view prompts for their agents" 
ON public.prompt_responses 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.agents 
  WHERE agents.id = prompt_responses.agent_id 
  AND agents.user_id = auth.uid()
));

CREATE POLICY "Users can create prompts for their agents" 
ON public.prompt_responses 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.agents 
  WHERE agents.id = prompt_responses.agent_id 
  AND agents.user_id = auth.uid()
));

CREATE POLICY "Users can update prompts for their agents" 
ON public.prompt_responses 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.agents 
  WHERE agents.id = prompt_responses.agent_id 
  AND agents.user_id = auth.uid()
));

CREATE POLICY "Users can delete prompts for their agents" 
ON public.prompt_responses 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.agents 
  WHERE agents.id = prompt_responses.agent_id 
  AND agents.user_id = auth.uid()
));

CREATE POLICY "Public can view prompt responses for active agents"
ON public.prompt_responses
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.agents 
    WHERE agents.id = prompt_responses.agent_id 
    AND agents.status = 'active'
  )
);

-- Policies for public.message_feedback
-- Allow anyone (anon or authenticated) to create feedback
CREATE POLICY "Allow anon/auth to create message feedback"
  ON public.message_feedback FOR INSERT
  WITH CHECK (true);

-- Admin can view feedback for their agent's sessions
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