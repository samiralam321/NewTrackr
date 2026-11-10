-- Performance indexes for rapid notifications loading and live unread badge queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON public.notifications (user_id) 
  WHERE is_read = false;
