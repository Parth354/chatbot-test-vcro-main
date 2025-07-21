-- This file contains the RLS policies for the 'avatars' storage bucket.

-- Drop old policies to ensure a clean slate
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- Allow authenticated users to upload avatars to their own folder
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND owner = auth.uid());

-- Allow users to view their own avatars
CREATE POLICY "Users can view their own avatars"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars' AND owner = auth.uid());

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND owner = auth.uid());

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND owner = auth.uid());
