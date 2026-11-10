-- ==============================================================================
-- TRACKR MIGRATION: ADD WEBSITE / LINK TO PROFILES
-- Description: Adds a website/link column to public.profiles table so users can
--              attach any link (GitHub, portfolio, LinkedIn, website) to their profile.
-- ==============================================================================

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS website text;

COMMENT ON COLUMN public.profiles.website IS 'Personal link, website, portfolio, or GitHub profile URL';
