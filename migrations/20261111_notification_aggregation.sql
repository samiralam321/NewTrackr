-- ==============================================================================
-- TRACKR NOTIFICATION AGGREGATION SYSTEM MIGRATION
-- Production-ready indexes, constraints, and triggers for like/follow aggregation
-- ==============================================================================

-- 1. Performance Indexes for Grouping and Real-Time Fetching
CREATE INDEX IF NOT EXISTS idx_notifications_user_type_post
  ON public.notifications (user_id, type, post_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id)
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_likes_post_created
  ON public.likes (post_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_follows_following_created
  ON public.follows (following_id, created_at DESC);

-- 2. Expand Notification Type Constraints (support 'repost' and 'quote')
DO $$
BEGIN
  ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
  ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('like', 'comment', 'follow', 'mention', 'badge', 'repost', 'quote'));
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- 3. Automatic Unlike Cleanup Trigger (Removes stale notification when a post is unliked)
CREATE OR REPLACE FUNCTION public.handle_like_deleted()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE user_id != OLD.user_id
    AND actor_id = OLD.user_id
    AND type = 'like'
    AND post_id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_like_deleted ON public.likes;
CREATE TRIGGER on_like_deleted
  AFTER DELETE ON public.likes
  FOR EACH ROW EXECUTE PROCEDURE public.handle_like_deleted();

-- 4. Automatic Unfollow Cleanup Trigger (Removes stale follow notification on unfollow)
CREATE OR REPLACE FUNCTION public.handle_follow_deleted()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE user_id = OLD.following_id
    AND actor_id = OLD.follower_id
    AND type = 'follow';
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_follow_deleted ON public.follows;
CREATE TRIGGER on_follow_deleted
  AFTER DELETE ON public.follows
  FOR EACH ROW EXECUTE PROCEDURE public.handle_follow_deleted();
