-- Opportunities Discovery Table
CREATE TABLE IF NOT EXISTS public.opportunities (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  full_description TEXT,
  category TEXT NOT NULL,
  organizer TEXT NOT NULL,
  organizer_logo TEXT,
  official_url TEXT NOT NULL,
  application_url TEXT NOT NULL,
  location TEXT DEFAULT 'India / Remote',
  mode TEXT DEFAULT 'Online',
  eligibility TEXT DEFAULT 'Open to all college students',
  skills TEXT[] DEFAULT '{}',
  prize_pool TEXT,
  stipend TEXT,
  registration_deadline DATE NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'Active',
  source_name TEXT NOT NULL,
  source_url TEXT,
  external_id TEXT UNIQUE,
  is_featured BOOLEAN DEFAULT false,
  is_paid BOOLEAN DEFAULT false,
  last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Opportunities are viewable by everyone."
  ON public.opportunities FOR SELECT
  USING ( true );

CREATE POLICY "System can manage opportunities"
  ON public.opportunities FOR ALL
  USING ( true );

-- User Opportunity Bookmarks
CREATE TABLE IF NOT EXISTS public.opportunity_bookmarks (
  opportunity_id TEXT NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (opportunity_id, user_id)
);

ALTER TABLE public.opportunity_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own opportunity bookmarks"
  ON public.opportunity_bookmarks FOR SELECT
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can add own opportunity bookmarks"
  ON public.opportunity_bookmarks FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can delete own opportunity bookmarks"
  ON public.opportunity_bookmarks FOR DELETE
  USING ( auth.uid() = user_id );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_category ON public.opportunities(category);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON public.opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline ON public.opportunities(registration_deadline);
CREATE INDEX IF NOT EXISTS idx_opportunities_mode ON public.opportunities(mode);
