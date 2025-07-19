-- Migration to change the data type of persona_data in the profiles table from JSONB to BOOLEAN.
-- This change is made because the detailed persona information is now stored in the user_performance table.
-- The persona_data column will now act as a simple flag to indicate if a persona has been generated.

-- Drop the existing persona_data column to avoid data type conflicts.
-- WARNING: This is a destructive action and will remove any existing data in this column.
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS persona_data;

-- Add the persona_data column back with the BOOLEAN data type.
ALTER TABLE public.profiles
ADD COLUMN persona_data BOOLEAN DEFAULT FALSE;

-- Add a comment to the new column for clarity.
COMMENT ON COLUMN public.profiles.persona_data IS 'Flag to indicate if a persona has been successfully generated and stored in the user_performance table. Defaults to FALSE.';
