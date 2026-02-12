-- ============================================================================
-- MIGRATION: Follow System + Messaging System
-- ============================================================================
-- This migration creates the follow system and messaging system tables,
-- functions, triggers, and RLS policies.
-- ============================================================================

-- ============================================================================
-- PART 1: FOLLOW SYSTEM TABLES
-- ============================================================================

-- Create user_following table for tracking follows
CREATE TABLE IF NOT EXISTS public.user_following (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate follows
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id),
  -- Prevent self-follow
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Enable RLS on user_following
ALTER TABLE public.user_following ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_following_follower_id ON public.user_following(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_following_following_id ON public.user_following(following_id);
CREATE INDEX IF NOT EXISTS idx_user_following_created_at ON public.user_following(created_at);

-- ============================================================================
-- PART 2: MESSAGING SYSTEM TABLES
-- ============================================================================

-- Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
  title TEXT,
  avatar_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT FALSE
);

-- Enable RLS on conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Conversation participants table
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ NULL,
  last_read_at TIMESTAMPTZ,
  is_muted BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT unique_participant UNIQUE (conversation_id, user_id)
);

-- Enable RLS on conversation_participants
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'voice', 'file')),
  media_url TEXT,
  media_metadata JSONB,
  reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Message reads table for read receipts
CREATE TABLE IF NOT EXISTS public.message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_message_read UNIQUE (message_id, user_id)
);

-- Enable RLS on message_reads
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

-- Message reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_reaction UNIQUE (message_id, user_id, reaction)
);

-- Enable RLS on message_reactions
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Indexes for messaging performance
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON public.conversations(created_by);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON public.conversation_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_message_reads_message_id ON public.message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user_id ON public.message_reads(user_id);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON public.message_reactions(message_id);

-- Ensure left_at column exists (for migrations that partially ran)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversation_participants' 
    AND column_name = 'left_at'
  ) THEN
    ALTER TABLE public.conversation_participants ADD COLUMN left_at TIMESTAMPTZ NULL;
  END IF;
END $$;

-- ============================================================================
-- PART 3: FUNCTIONS FOR FOLLOW SYSTEM
-- ============================================================================

-- Function to follow a user with atomic counter updates
CREATE OR REPLACE FUNCTION public.follow_user(
  p_follower_id UUID,
  p_following_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_target_username TEXT;
BEGIN
  -- Check for self-follow
  IF p_follower_id = p_following_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot follow yourself'
    );
  END IF;

  -- Check if users exist and are not banned
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_follower_id AND raw_user_meta_data->>'banned' IS NULL) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Follower user not found or banned'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_following_id AND raw_user_meta_data->>'banned' IS NULL) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User to follow not found or banned'
    );
  END IF;

  -- Check if already following
  IF EXISTS (
    SELECT 1 FROM public.user_following 
    WHERE follower_id = p_follower_id AND following_id = p_following_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Already following this user'
    );
  END IF;

  -- Get target user's username
  SELECT username INTO v_target_username
  FROM public.profiles
  WHERE id = p_following_id;

  -- Insert follow record
  INSERT INTO public.user_following (follower_id, following_id)
  VALUES (p_follower_id, p_following_id);

  -- Increment target user's followers count
  UPDATE public.profiles
  SET followers = COALESCE(followers, 0) + 1,
      updated_at = NOW()
  WHERE id = p_following_id;

  -- Increment current user's following count
  UPDATE public.profiles
  SET following = COALESCE(following, 0) + 1,
      updated_at = NOW()
  WHERE id = p_follower_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', format('Following %s', v_target_username),
    'following_id', p_following_id
  );
END;
$$;

-- Function to unfollow a user with atomic counter updates
CREATE OR REPLACE FUNCTION public.unfollow_user(
  p_follower_id UUID,
  p_following_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_target_username TEXT;
  v_deleted_count INT;
BEGIN
  -- Get target user's username before unfollowing
  SELECT username INTO v_target_username
  FROM public.profiles
  WHERE id = p_following_id;

  -- Delete follow record and get count
  WITH deleted AS (
    DELETE FROM public.user_following 
    WHERE follower_id = p_follower_id AND following_id = p_following_id
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;

  -- If no record was deleted, user wasn't following
  IF v_deleted_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Not following this user'
    );
  END IF;

  -- Decrement target user's followers count (don't go below 0)
  UPDATE public.profiles
  SET followers = GREATEST(COALESCE(followers, 0) - 1, 0),
      updated_at = NOW()
  WHERE id = p_following_id;

  -- Decrement current user's following count (don't go below 0)
  UPDATE public.profiles
  SET following = GREATEST(COALESCE(following, 0) - 1, 0),
      updated_at = NOW()
  WHERE id = p_follower_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', format('Unfollowed %s', v_target_username),
    'unfollowed_id', p_following_id
  );
END;
$$;

-- Function to check if user A follows user B
CREATE OR REPLACE FUNCTION public.is_following(
  p_follower_id UUID,
  p_following_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_following 
    WHERE follower_id = p_follower_id AND following_id = p_following_id
  );
END;
$$;

-- Function to get mutual follow status
CREATE OR REPLACE FUNCTION public.get_mutual_follow_status(
  p_user_id_a UUID,
  p_user_id_b UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_a_follows_b BOOLEAN;
  v_b_follows_a BOOLEAN;
  v_is_mutual BOOLEAN;
BEGIN
  v_a_follows_b := public.is_following(p_user_id_a, p_user_id_b);
  v_b_follows_a := public.is_following(p_user_id_b, p_user_id_a);
  v_is_mutual := v_a_follows_b AND v_b_follows_a;

  RETURN jsonb_build_object(
    'user_a_follows_user_b', v_a_follows_b,
    'user_b_follows_user_a', v_b_follows_a,
    'is_mutual', v_is_mutual,
    'can_message', v_a_follows_b OR v_b_follows_a
  );
END;
$$;

-- Function to get followers list with profiles
CREATE OR REPLACE FUNCTION public.get_followers(
  p_user_id UUID,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  username TEXT,
  full_name TEXT,
  profile_image TEXT,
  role TEXT,
  followed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.full_name,
    p.profile_image,
    p.role,
    uf.created_at as followed_at
  FROM public.user_following uf
  JOIN public.profiles p ON uf.follower_id = p.id
  WHERE uf.following_id = p_user_id
  ORDER BY uf.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Function to get following list with profiles
CREATE OR REPLACE FUNCTION public.get_following(
  p_user_id UUID,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  username TEXT,
  full_name TEXT,
  profile_image TEXT,
  role TEXT,
  followed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.full_name,
    p.profile_image,
    p.role,
    uf.created_at as followed_at
  FROM public.user_following uf
  JOIN public.profiles p ON uf.following_id = p.id
  WHERE uf.follower_id = p_user_id
  ORDER BY uf.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================================================
-- PART 4: FUNCTIONS FOR MESSAGING SYSTEM
-- ============================================================================

-- Function to check if users can message each other
CREATE OR REPLACE FUNCTION public.can_users_message(
  p_user_id_a UUID,
  p_user_id_b UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_a_follows_b BOOLEAN;
  v_b_follows_a BOOLEAN;
BEGIN
  -- Users can message if:
  -- 1. They follow each other (mutual)
  -- OR
  -- 2. At least one follows the other
  
  v_a_follows_b := public.is_following(p_user_id_a, p_user_id_b);
  v_b_follows_a := public.is_following(p_user_id_b, p_user_id_a);
  
  -- For this implementation, we allow messaging if there's any follow relationship
  -- This is the "one follows the other" approach mentioned in requirements
  RETURN v_a_follows_b OR v_b_follows_a;
END;
$$;

-- Function to find or create direct conversation
CREATE OR REPLACE FUNCTION public.find_or_create_direct_conversation(
  p_user_id_a UUID,
  p_user_id_b UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Check if users can message each other
  IF NOT public.can_users_message(p_user_id_a, p_user_id_b) THEN
    RAISE EXCEPTION 'Users cannot message each other - no follow relationship exists';
  END IF;

  -- Look for existing direct conversation between these two users
  SELECT c.id INTO v_conversation_id
  FROM public.conversations c
  JOIN public.conversation_participants cp1 ON c.id = cp1.conversation_id
  JOIN public.conversation_participants cp2 ON c.id = cp2.conversation_id
  WHERE c.type = 'direct'
    AND cp1.user_id = p_user_id_a
    AND cp2.user_id = p_user_id_b
    AND cp1.left_at IS NULL
    AND cp2.left_at IS NULL
    AND (
      SELECT COUNT(*) 
      FROM public.conversation_participants 
      WHERE conversation_id = c.id AND left_at IS NULL
    ) = 2
  LIMIT 1;

  -- If conversation exists, return it
  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  -- Create new conversation
  INSERT INTO public.conversations (type, created_by)
  VALUES ('direct', p_user_id_a)
  RETURNING id INTO v_conversation_id;

  -- Add both participants
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES 
    (v_conversation_id, p_user_id_a),
    (v_conversation_id, p_user_id_b);

  RETURN v_conversation_id;
END;
$$;

-- Function to send a message
CREATE OR REPLACE FUNCTION public.send_message(
  p_conversation_id UUID,
  p_sender_id UUID,
  p_content TEXT,
  p_type TEXT DEFAULT 'text',
  p_media_url TEXT DEFAULT NULL,
  p_reply_to_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_message_id UUID;
  v_is_participant BOOLEAN;
BEGIN
  -- Verify sender is a participant in the conversation
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = p_sender_id
      AND left_at IS NULL
  ) INTO v_is_participant;

  IF NOT v_is_participant THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;

  -- Check if conversation is archived and unarchive it
  UPDATE public.conversations
  SET is_archived = FALSE,
      archived_at = NULL,
      updated_at = NOW()
  WHERE id = p_conversation_id AND is_archived = TRUE;

  -- Insert the message
  INSERT INTO public.messages (
    conversation_id,
    sender_id,
    content,
    type,
    media_url,
    reply_to_id
  ) VALUES (
    p_conversation_id,
    p_sender_id,
    p_content,
    p_type,
    p_media_url,
    p_reply_to_id
  )
  RETURNING id INTO v_message_id;

  -- Update conversation last_message and last_message_at
  UPDATE public.conversations
  SET last_message = p_content,
      last_message_at = NOW(),
      updated_at = NOW()
  WHERE id = p_conversation_id;

  RETURN v_message_id;
END;
$$;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_messages_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify user is a participant
  IF NOT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = p_user_id
      AND left_at IS NULL
  ) THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;

  -- Update participant's last_read_at
  UPDATE public.conversation_participants
  SET last_read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;

  -- Insert read records for all unread messages
  INSERT INTO public.message_reads (message_id, user_id)
  SELECT m.id, p_user_id
  FROM public.messages m
  WHERE m.conversation_id = p_conversation_id
    AND m.sender_id != p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.message_reads mr
      WHERE mr.message_id = m.id AND mr.user_id = p_user_id
    )
  ON CONFLICT (message_id, user_id) DO NOTHING;
END;
$$;

-- Function to get unread message count for a conversation
CREATE OR REPLACE FUNCTION public.get_unread_count(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_read TIMESTAMPTZ;
BEGIN
  -- Get user's last read timestamp for this conversation
  SELECT last_read_at INTO v_last_read
  FROM public.conversation_participants
  WHERE conversation_id = p_conversation_id AND user_id = p_user_id;

  -- Count messages after last read (or all if never read)
  RETURN (
    SELECT COUNT(*)
    FROM public.messages
    WHERE conversation_id = p_conversation_id
      AND sender_id != p_user_id
      AND (v_last_read IS NULL OR created_at > v_last_read)
  );
END;
$$;

-- Function to archive a conversation
CREATE OR REPLACE FUNCTION public.archive_conversation(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify user is a participant
  IF NOT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = p_user_id
      AND left_at IS NULL
  ) THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;

  -- Archive the conversation
  UPDATE public.conversations
  SET is_archived = TRUE,
      archived_at = NOW(),
      updated_at = NOW()
  WHERE id = p_conversation_id;
END;
$$;

-- Function to leave a conversation
CREATE OR REPLACE FUNCTION public.leave_conversation(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set left_at timestamp for the participant
  UPDATE public.conversation_participants
  SET left_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;
END;
$$;

-- Trigger to auto-update conversation updated_at
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_conversation_on_message ON public.messages;
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_timestamp();

-- ============================================================================
-- PART 5: ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- RLS Policies for user_following table
CREATE POLICY "Users can view their own follows"
  ON public.user_following FOR SELECT
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can follow as themselves"
  ON public.user_following FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow as themselves"
  ON public.user_following FOR DELETE
  USING (auth.uid() = follower_id);

-- RLS Policies for conversations table
CREATE POLICY "Users can view conversations they participate in"
  ON public.conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = id
        AND user_id = auth.uid()
        AND left_at IS NULL
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "Authenticated users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- RLS Policies for conversation_participants table
CREATE POLICY "Users can view participants of their conversations"
  ON public.conversation_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_id
        AND cp.user_id = auth.uid()
        AND cp.left_at IS NULL
    )
  );

CREATE POLICY "Conversation creators can add participants"
  ON public.conversation_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND c.created_by = auth.uid()
    )
    OR 
    -- Allow self-join for direct conversations via find_or_create
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND c.type = 'direct'
    )
  );

CREATE POLICY "Users can update their own participant record"
  ON public.conversation_participants FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for messages table
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id
        AND user_id = auth.uid()
        AND left_at IS NULL
    )
  );

CREATE POLICY "Users can send messages to conversations they belong to"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id
        AND user_id = auth.uid()
        AND left_at IS NULL
    )
  );

CREATE POLICY "Users can edit their own messages"
  ON public.messages FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- RLS Policies for message_reads table
CREATE POLICY "Users can view read receipts in their conversations"
  ON public.message_reads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversation_participants cp ON m.conversation_id = cp.conversation_id
      WHERE m.id = message_reads.message_id
        AND cp.user_id = auth.uid()
        AND cp.left_at IS NULL
    )
  );

CREATE POLICY "Users can mark messages as read for themselves"
  ON public.message_reads FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for message_reactions table
CREATE POLICY "Users can view reactions in their conversations"
  ON public.message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversation_participants cp ON m.conversation_id = cp.conversation_id
      WHERE m.id = message_reactions.message_id
        AND cp.user_id = auth.uid()
        AND cp.left_at IS NULL
    )
  );

CREATE POLICY "Users can add/remove their own reactions"
  ON public.message_reactions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
