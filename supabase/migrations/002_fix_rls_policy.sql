-- FIX FOR RLS POLICY VIOLATION ON PROFILES TABLE
-- This script updates the RLS policies to allow the trigger function to create profiles

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create a new INSERT policy that allows:
-- 1. Authenticated users to insert their own profile
-- 2. Service role (used by trigger) to insert any profile
CREATE POLICY "Enable insert for authenticated users and service role"
  ON public.profiles FOR INSERT
  TO authenticated, service_role
  WITH CHECK (
    auth.uid() = id  -- Allow users to insert their own profile
    OR
    auth.role() = 'service_role'  -- Allow service role (trigger function)
  );

-- Alternative: If the above doesn't work, use this simpler version
-- that allows any authenticated insert (since the trigger creates the profile anyway)
-- DROP POLICY IF EXISTS "Enable insert for authenticated users and service role" ON public.profiles;
-- CREATE POLICY "Enable profile creation" 
--   ON public.profiles FOR INSERT  
--   WITH CHECK (true);

-- Verify the handle_new_user function has SECURITY DEFINER
-- (it already does in the migration, but just to be safe)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER  -- This is critical - runs as function owner
SET search_path = public
LANGUAGE plpgsql
AS $$
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
$$;

-- Recreate the trigger (in case it doesn't exist)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();
