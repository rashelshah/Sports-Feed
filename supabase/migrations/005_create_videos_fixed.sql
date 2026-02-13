-- Create videos table
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  video_url TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'coco' CHECK (category IN ('coco', 'martial-arts', 'calorie-fight', 'adaptive-sports', 'unstructured-sports')),
  difficulty TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  type TEXT NOT NULL DEFAULT 'free' CHECK (type IN ('free', 'premium')),
  token_cost INTEGER DEFAULT 0,
  tags JSONB DEFAULT '[]'::jsonb,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on videos
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Videos are viewable by everyone" ON public.videos;
DROP POLICY IF EXISTS "Users can insert own videos" ON public.videos;
DROP POLICY IF EXISTS "Users can update own videos" ON public.videos;
DROP POLICY IF EXISTS "Users can delete own videos" ON public.videos;

-- Videos policies
CREATE POLICY "Videos are viewable by everyone"
  ON public.videos FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can insert own videos"
  ON public.videos FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Users can update own videos"
  ON public.videos FOR UPDATE
  USING (auth.uid() = coach_id);

CREATE POLICY "Users can delete own videos"
  ON public.videos FOR DELETE
  USING (auth.uid() = coach_id);

-- Create video_likes table
CREATE TABLE IF NOT EXISTS public.video_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- Enable RLS on video_likes
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can like videos" ON public.video_likes;
CREATE POLICY "Users can like videos"
  ON public.video_likes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create video_views table
CREATE TABLE IF NOT EXISTS public.video_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- Enable RLS on video_views
ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own video views" ON public.video_views;
CREATE POLICY "Users can view own video views"
  ON public.video_views FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS videos_coach_id_idx ON public.videos(coach_id);
CREATE INDEX IF NOT EXISTS videos_category_idx ON public.videos(category);
CREATE INDEX IF NOT EXISTS videos_type_idx ON public.videos(type);
CREATE INDEX IF NOT EXISTS videos_is_active_idx ON public.videos(is_active);
CREATE INDEX IF NOT EXISTS videos_created_at_idx ON public.videos(created_at);
CREATE INDEX IF NOT EXISTS video_likes_video_id_idx ON public.video_likes(video_id);
CREATE INDEX IF NOT EXISTS video_likes_user_id_idx ON public.video_likes(user_id);
CREATE INDEX IF NOT EXISTS video_views_video_id_idx ON public.video_views(video_id);
CREATE INDEX IF NOT EXISTS video_views_user_id_idx ON public.video_views(user_id);

-- Auto-update updated_at timestamp
DROP TRIGGER IF EXISTS on_video_updated ON public.videos;
CREATE OR REPLACE FUNCTION public.handle_video_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_video_updated
  BEFORE UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.handle_video_updated();
