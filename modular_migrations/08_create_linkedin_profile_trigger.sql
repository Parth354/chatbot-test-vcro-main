-- Enable the pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to call the Edge Function
CREATE OR REPLACE FUNCTION public.call_linkedin_profile_processor_edge_function()
RETURNS TRIGGER AS $$
DECLARE
  -- Replace with your actual Supabase project URL and anon key
  -- For security, consider using Supabase secrets for the anon key in production
  SUPABASE_URL TEXT := 'https://gfhnoeywoabeiijasumy.supabase.co'; -- e.g., 'https://abcdefghijk.supabase.co'
  SUPABASE_ANON_KEY TEXT := 'YOUR_SUPABASE_ANON_KEY'; -- e.g., 'eyJhbGciOiJIUzI1Ni...'
  EDGE_FUNCTION_URL TEXT;
  PAYLOAD JSONB;
BEGIN
  -- Construct the URL for your Edge Function
  EDGE_FUNCTION_URL := SUPABASE_URL || '/functions/v1/process-linkedin-profile';

  -- Prepare the payload for the Edge Function
  PAYLOAD := jsonb_build_object(
    'record', jsonb_build_object(
      'user_id', NEW.user_id,
      'linkedin_profile_url', NEW.linkedin_profile_url
    )
  );

  -- Call the Edge Function using pg_net
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

-- Create a trigger on the profiles table
CREATE OR REPLACE TRIGGER on_linkedin_profile_update
AFTER UPDATE OF linkedin_profile_url ON public.profiles
FOR EACH ROW
WHEN (OLD.linkedin_profile_url IS DISTINCT FROM NEW.linkedin_profile_url AND NEW.linkedin_profile_url IS NOT NULL)
EXECUTE FUNCTION public.call_linkedin_profile_processor_edge_function();

-- Grant usage on the function to authenticated users (or appropriate role)
GRANT EXECUTE ON FUNCTION public.call_linkedin_profile_processor_edge_function() TO authenticated;
