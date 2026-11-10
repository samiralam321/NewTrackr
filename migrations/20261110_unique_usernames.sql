-- ==============================================================================
-- TRACKR MIGRATION: UNIQUE USERNAMES & HANDLES (TWITTER STYLE)
-- Description: Adds a unique, case-insensitive username column to public.profiles,
--              migrates existing users to unique handles, and adds constraints.
-- ==============================================================================

-- 1. Add username column to public.profiles if it does not exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username text;

-- 2. Populate unique handles for all existing registered users
UPDATE public.profiles 
SET username = 'samCPer' 
WHERE lower(full_name) LIKE '%samir%' AND (username IS NULL OR username = '');

UPDATE public.profiles 
SET username = 'rohit' 
WHERE lower(trim(full_name)) = 'rohit' AND (username IS NULL OR username = '');

UPDATE public.profiles 
SET username = 'deepak' 
WHERE lower(trim(full_name)) = 'deepak' AND (username IS NULL OR username = '');

UPDATE public.profiles 
SET username = 'sayan' 
WHERE lower(trim(full_name)) = 'sayan' AND (username IS NULL OR username = '');

UPDATE public.profiles 
SET username = 'sam' 
WHERE lower(trim(full_name)) = 'sam' AND (username IS NULL OR username = '');

UPDATE public.profiles 
SET username = 'gauto_git' 
WHERE lower(trim(full_name)) = 'gauto git' AND (username IS NULL OR username = '');

UPDATE public.profiles 
SET username = 'optimiz' 
WHERE lower(trim(full_name)) = 'optimiz' AND (username IS NULL OR username = '');

UPDATE public.profiles 
SET username = 'sonu_alam' 
WHERE lower(trim(full_name)) = 'sonu alam' AND (username IS NULL OR username = '');

UPDATE public.profiles 
SET username = 'jack' 
WHERE lower(trim(full_name)) = 'jack' AND (username IS NULL OR username = '');

UPDATE public.profiles 
SET username = 'a37409815' 
WHERE lower(trim(full_name)) = 'a37409815' AND (username IS NULL OR username = '');

UPDATE public.profiles 
SET username = 'malli_reddy' 
WHERE lower(trim(full_name)) = 'malli reddy' AND (username IS NULL OR username = '');

UPDATE public.profiles 
SET username = 'jitisha' 
WHERE lower(trim(full_name)) = 'jitisha' AND (username IS NULL OR username = '');

UPDATE public.profiles 
SET username = 'rohan_boards' 
WHERE lower(trim(full_name)) LIKE 'rohan%' AND (username IS NULL OR username = '');

UPDATE public.profiles 
SET username = 'saksham' 
WHERE lower(trim(full_name)) = 'saksham' AND (username IS NULL OR username = '');

UPDATE public.profiles 
SET username = 'noema' 
WHERE lower(trim(full_name)) = 'noema' AND (username IS NULL OR username = '');

UPDATE public.profiles 
SET username = 'sanjay' 
WHERE lower(trim(full_name)) = 'sanjay' AND (username IS NULL OR username = '');

UPDATE public.profiles 
SET username = 'sandipan_paria' 
WHERE lower(trim(full_name)) = 'sandipan paria' AND (username IS NULL OR username = '');

UPDATE public.profiles 
SET username = 'ritik' 
WHERE lower(trim(full_name)) LIKE 'ritik%' AND (username IS NULL OR username = '');

UPDATE public.profiles 
SET username = 'sunil_patel' 
WHERE lower(trim(full_name)) = 'sunil patel' AND (username IS NULL OR username = '');

UPDATE public.profiles 
SET username = 'heisenberg' 
WHERE lower(trim(full_name)) = 'heisenberg' AND (username IS NULL OR username = '');

UPDATE public.profiles 
SET username = 'test_streak' 
WHERE lower(trim(full_name)) = 'test streak user' AND (username IS NULL OR username = '');

UPDATE public.profiles 
SET username = 'wgfnekje' 
WHERE lower(trim(full_name)) = 'wgfnekje' AND (username IS NULL OR username = '');

UPDATE public.profiles 
SET username = 'gravity' 
WHERE lower(trim(full_name)) = 'gravity' AND (username IS NULL OR username = '');

-- Fallback for any other remaining user profiles:
UPDATE public.profiles 
SET username = regexp_replace(lower(trim(coalesce(full_name, 'student'))), '[^a-z0-9_]', '_', 'g')
WHERE username IS NULL OR username = '';

-- Ensure length is at least 3 characters
UPDATE public.profiles 
SET username = username || '_' || substr(id::text, 1, 4)
WHERE length(username) < 3;

-- 3. Create Case-Insensitive Unique Index (Twitter-style unique handles)
DROP INDEX IF EXISTS public.profiles_username_unique_idx;
CREATE UNIQUE INDEX profiles_username_unique_idx 
ON public.profiles (lower(username));

-- 4. Enforce Twitter handle format: 3 to 20 alphanumeric or underscore characters
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS username_format_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT username_format_check 
CHECK (username ~ '^[a-zA-Z0-9_]{3,20}$');

-- 5. Update auth trigger to guarantee unique usernames for all future signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_username text;
  unique_username text;
  counter integer := 0;
BEGIN
  -- Determine base username
  base_username := coalesce(
    new.raw_user_meta_data->>'username',
    regexp_replace(lower(split_part(coalesce(new.email, 'student'), '@', 1)), '[^a-z0-9_]', '', 'g')
  );

  IF length(base_username) < 3 THEN
    base_username := 'user_' || substr(new.id::text, 1, 6);
  END IF;

  base_username := substr(base_username, 1, 15);
  unique_username := base_username;

  -- Ensure uniqueness by incrementing suffix if collision occurs
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(unique_username)) LOOP
    counter := counter + 1;
    unique_username := substr(base_username, 1, 15) || '_' || counter;
  END LOOP;

  INSERT INTO public.profiles (id, full_name, avatar_url, username)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', unique_username),
    coalesce(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/adventurer/svg?seed=' || unique_username),
    unique_username
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
