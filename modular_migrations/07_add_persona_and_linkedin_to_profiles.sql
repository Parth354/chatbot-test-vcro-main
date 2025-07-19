-- Add persona_data (JSONB) and linkedin_profile_url (TEXT) to public.profiles
ALTER TABLE public.profiles
ADD COLUMN persona_data JSONB,
ADD COLUMN linkedin_profile_url TEXT;

-- Optional: Add an index for linkedin_profile_url for faster lookups if needed
CREATE INDEX IF NOT EXISTS profiles_linkedin_profile_url_idx ON public.profiles (linkedin_profile_url);
