-- ==========================================
-- DAILY CHALLENGE ARENA SCHEMA
-- ==========================================

-- 1. Modify Profiles Table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak integer default 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS challenge_rank text default 'Bronze';

-- 2. Questions Table
CREATE TABLE IF NOT EXISTS public.questions (
  id uuid default gen_random_uuid() primary key,
  topic text check (topic in ('DSA', 'OOPS', 'OS', 'DBMS', 'Aptitude', 'AI', 'CN')),
  difficulty text check (difficulty in ('Medium', 'Hard')),
  question text not null,
  options jsonb not null, -- Array of strings
  correct_answer text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for questions
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Everyone can read questions
DROP POLICY IF EXISTS "Questions are viewable by everyone." ON questions;
CREATE POLICY "Questions are viewable by everyone."
  ON questions FOR SELECT USING ( true );

-- 3. Daily Challenges Table
CREATE TABLE IF NOT EXISTS public.daily_challenges (
  date date primary key, -- YYYY-MM-DD
  question_ids uuid[] not null -- Array of 5 UUIDs
);

-- Enable RLS
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Daily challenges are viewable by everyone." ON daily_challenges;
CREATE POLICY "Daily challenges are viewable by everyone."
  ON daily_challenges FOR SELECT USING ( true );

-- 4. Attempts Table
CREATE TABLE IF NOT EXISTS public.attempts (
  user_id uuid references public.profiles(id) on delete cascade not null,
  challenge_date date references public.daily_challenges(date) on delete cascade not null,
  score integer not null,
  time_taken integer not null, -- in seconds
  answers jsonb not null, -- Array of selected answers
  accuracy numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (user_id, challenge_date)
);

-- Enable RLS
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;

-- Users can read all attempts (for leaderboards)
DROP POLICY IF EXISTS "Attempts are viewable by everyone." ON attempts;
CREATE POLICY "Attempts are viewable by everyone."
  ON attempts FOR SELECT USING ( true );

-- Users can insert their own attempts
DROP POLICY IF EXISTS "Users can insert their own attempts." ON attempts;
CREATE POLICY "Users can insert their own attempts."
  ON attempts FOR INSERT WITH CHECK ( auth.uid() = user_id );

-- Users cannot update attempts (locked after submission)
-- No UPDATE policy intentionally

-- Enable Realtime safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'attempts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attempts;
  END IF;
END $$;
