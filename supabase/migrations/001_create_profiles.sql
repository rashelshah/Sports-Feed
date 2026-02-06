-- Create profiles table for app user data (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'coach', 'expert', 'fan', 'aspirant', 'administrator')),
  sports_category TEXT NOT NULL DEFAULT 'martial-arts' CHECK (sports_category IN ('coco', 'martial-arts', 'calorie-fight', 'adaptive-sports', 'unstructured-sports')),
  gender TEXT NOT NULL DEFAULT 'prefer-not-to-say' CHECK (gender IN ('male', 'female', 'non-binary', 'prefer-not-to-say')),
  profile_image TEXT,
  bio TEXT,
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  posts INTEGER DEFAULT 0,
  accessibility_needs JSONB DEFAULT '[]'::jsonb,
  preferred_accommodations JSONB DEFAULT '[]'::jsonb,
  sport_role JSONB,
  sport_interests JSONB DEFAULT '[]'::jsonb,
  is_professional BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'approved' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  evidence_documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can insert their own profile (during signup)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow public read for profiles (needed for viewing other users)
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);

-- Auto-create profile when new user signs up (works even with email confirmation)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    username,
    full_name,
    role,
    sports_category,
    gender,
    accessibility_needs,
    preferred_accommodations,
    sport_role,
    sport_interests,
    is_professional,
    verification_status
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    COALESCE(NEW.raw_user_meta_data->>'sports_category', 'martial-arts'),
    COALESCE(NEW.raw_user_meta_data->>'gender', 'prefer-not-to-say'),
    COALESCE((NEW.raw_user_meta_data->'accessibility_needs')::jsonb, '[]'::jsonb),
    COALESCE((NEW.raw_user_meta_data->'preferred_accommodations')::jsonb, '[]'::jsonb),
    (NEW.raw_user_meta_data->'sport_role'),
    COALESCE((NEW.raw_user_meta_data->'sport_interests')::jsonb, '[]'::jsonb),
    COALESCE((NEW.raw_user_meta_data->>'is_professional')::boolean, false),
    COALESCE(NEW.raw_user_meta_data->>'verification_status', 'approved')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
