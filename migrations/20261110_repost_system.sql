-- ==============================================================================
-- TRACKR MIGRATION: COMPLETE TWITTER/X-STYLE REPOST & QUOTE SYSTEM
-- Description: Creates the relational reposts table, adds quote/repost references
--              to posts, updates notifications check constraint, and configures RLS.
-- ==============================================================================

-- 1. Create relational reposts table
CREATE TABLE IF NOT EXISTS public.reposts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE (post_id, user_id)
);

-- Index for instant lookup of a post's reposts and a user's reposts
CREATE INDEX IF NOT EXISTS idx_reposts_post_id ON public.reposts(post_id);
CREATE INDEX IF NOT EXISTS idx_reposts_user_id ON public.reposts(user_id);
CREATE INDEX IF NOT EXISTS idx_reposts_created_at ON public.reposts(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;

-- Repost policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reposts' AND policyname = 'Reposts are viewable by everyone.'
  ) THEN
    CREATE POLICY "Reposts are viewable by everyone." ON public.reposts FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reposts' AND policyname = 'Users can insert their own reposts.'
  ) THEN
    CREATE POLICY "Users can insert their own reposts." ON public.reposts FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reposts' AND policyname = 'Users can delete their own reposts.'
  ) THEN
    CREATE POLICY "Users can delete their own reposts." ON public.reposts FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Enable Realtime replication for reposts
ALTER PUBLICATION supabase_realtime ADD TABLE public.reposts;

-- 2. Add relational quote and repost references to public.posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS quoted_post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS repost_of_id uuid REFERENCES public.posts(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_posts_quoted_post_id ON public.posts(quoted_post_id);
CREATE INDEX IF NOT EXISTS idx_posts_repost_of_id ON public.posts(repost_of_id);

-- 3. Update notifications constraint to support 'repost' and 'quote'
DO $$
BEGIN
  ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
  ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('like', 'comment', 'follow', 'mention', 'badge', 'repost', 'quote'));
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- 4. Notification Trigger for new Reposts
CREATE OR REPLACE FUNCTION public.handle_new_repost()
RETURNS trigger AS $$
DECLARE
  target_post_owner uuid;
BEGIN
  SELECT user_id INTO target_post_owner FROM public.posts WHERE id = NEW.post_id;
  
  -- Don't notify if user reposts their own post
  IF target_post_owner IS NOT NULL AND target_post_owner != NEW.user_id THEN
    -- Check if duplicate unread notification already exists to avoid spamming
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE user_id = target_post_owner 
        AND actor_id = NEW.user_id 
        AND type = 'repost' 
        AND post_id = NEW.post_id
    ) THEN
      INSERT INTO public.notifications (user_id, actor_id, type, post_id)
      VALUES (target_post_owner, NEW.user_id, 'repost', NEW.post_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_repost_created ON public.reposts;
CREATE TRIGGER on_repost_created
  AFTER INSERT ON public.reposts
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_repost();
