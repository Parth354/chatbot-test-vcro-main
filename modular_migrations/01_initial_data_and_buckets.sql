-- Initial Data (if any, e.g., for dummy users or default settings)
-- Example: INSERT INTO public.profiles (id, user_id, email, full_name) VALUES ('your-uuid', 'your-user-id', 'test@example.com', 'Test User');

-- Storage Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;