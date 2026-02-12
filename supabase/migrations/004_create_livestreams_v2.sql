-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert own livestreams" ON public.livestreams;
DROP POLICY IF EXISTS "Users can update own livestreams" ON public.livestreams;
DROP POLICY IF EXISTS "Users can delete own livestreams" ON public.livestreams;
DROP POLICY IF EXISTS "Livestreams are viewable by everyone" ON public.livestreams;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_livestream_updated ON public.livestreams;

-- Drop table if exists
DROP TABLE IF EXISTS public.livestreams;

-- Create livestreams table with reference to profiles (not users)
CREATE TABLE public.livestreams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  thumbnail_url TEXT,
  category TEXT NOT NULL DEFAULT 'coco' CHECK (category IN ('coco', 'martial-arts', 'calorie-fight', 'adaptive-sports', 'unstructured-sports')),
  scheduled_time TIMESTAMPTZ,
  is_live BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  viewers_count INTEGER DEFAULT 0,
  max_viewers INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.livestreams ENABLE ROW LEVEL SECURITY;

-- Users can insert their own livestreams
CREATE POLICY "Users can insert own livestreams"
  ON public.livestreams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own livestreams
CREATE POLICY "Users can update own livestreams"
  ON public.livestreams FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own livestreams
CREATE POLICY "Users can delete own livestreams"
  ON public.livestreams FOR DELETE
  USING (auth.uid() = user_id);

-- Allow public read for all active livestreams
CREATE POLICY "Livestreams are viewable by everyone"
  ON public.livestreams FOR SELECT
  USING (is_active = true);

-- Create indexes
CREATE INDEX IF NOT EXISTS livestreams_user_id_idx ON public.livestreams(user_id);
CREATE INDEX IF NOT EXISTS livestreams_category_idx ON public.livestreams(category);
CREATE INDEX IF NOT EXISTS livestreams_is_live_idx ON public.livestreams(is_live);
CREATE INDEX IF NOT EXISTS livestreams_is_active_idx ON public.livestreams(is_active);
CREATE INDEX IF NOT EXISTS livestreams_created_at_idx ON public.livestreams(created_at);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_livestream_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_livestream_updated
  BEFORE UPDATE ON public.livestreams
  FOR EACH ROW EXECUTE FUNCTION public.handle_livestream_updated();
