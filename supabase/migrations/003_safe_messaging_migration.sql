-- ============================================================================
-- SAFE MIGRATION: Messaging System (Idempotent — can be run multiple times)
-- ============================================================================
-- This script safely adds all missing columns, tables, functions, and policies.
-- It uses DROP IF EXISTS / IF NOT EXISTS so it won't fail on re-run.
-- ============================================================================

-- ============================================================================
-- PART 1: ADD MISSING COLUMNS
-- ============================================================================

-- Add missing columns to conversations table
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_message TEXT;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add missing columns to conversation_participants table
ALTER TABLE public.conversation_participants ADD COLUMN IF NOT EXISTS left_at TIMESTAMPTZ NULL;
ALTER TABLE public.conversation_participants ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ;
ALTER TABLE public.conversation_participants ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- PART 2: CREATE MISSING TABLES
-- ============================================================================

-- Message reads table for read receipts
CREATE TABLE IF NOT EXISTS public.message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_message_read UNIQUE (message_id, user_id)
);

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

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 3: INDEXES
-- ============================================================================

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

-- ============================================================================
-- PART 4: FUNCTIONS (CREATE OR REPLACE — always safe)
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
  v_a_follows_b := public.is_following(p_user_id_a, p_user_id_b);
  v_b_follows_a := public.is_following(p_user_id_b, p_user_id_a);
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
  IF NOT public.can_users_message(p_user_id_a, p_user_id_b) THEN
    RAISE EXCEPTION 'Users cannot message each other - no follow relationship exists';
  END IF;

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

  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  INSERT INTO public.conversations (type, created_by)
  VALUES ('direct', p_user_id_a)
  RETURNING id INTO v_conversation_id;

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
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = p_sender_id
      AND left_at IS NULL
  ) INTO v_is_participant;

  IF NOT v_is_participant THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;

  UPDATE public.conversations
  SET is_archived = FALSE,
      archived_at = NULL,
      updated_at = NOW()
  WHERE id = p_conversation_id AND is_archived = TRUE;

  INSERT INTO public.messages (
    conversation_id, sender_id, content, type, media_url, reply_to_id
  ) VALUES (
    p_conversation_id, p_sender_id, p_content, p_type, p_media_url, p_reply_to_id
  )
  RETURNING id INTO v_message_id;

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
  IF NOT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = p_user_id
      AND left_at IS NULL
  ) THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;

  UPDATE public.conversation_participants
  SET last_read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;

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

-- Function to get unread message count
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
  SELECT last_read_at INTO v_last_read
  FROM public.conversation_participants
  WHERE conversation_id = p_conversation_id AND user_id = p_user_id;

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
  IF NOT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = p_user_id
      AND left_at IS NULL
  ) THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;

  UPDATE public.conversations
  SET is_archived = TRUE, archived_at = NOW(), updated_at = NOW()
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
-- PART 5: RLS POLICIES (DROP IF EXISTS before CREATE to be idempotent)
-- ============================================================================

-- user_following policies
DROP POLICY IF EXISTS "Users can view their own follows" ON public.user_following;
CREATE POLICY "Users can view their own follows"
  ON public.user_following FOR SELECT
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

DROP POLICY IF EXISTS "Users can follow as themselves" ON public.user_following;
CREATE POLICY "Users can follow as themselves"
  ON public.user_following FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow as themselves" ON public.user_following;
CREATE POLICY "Users can unfollow as themselves"
  ON public.user_following FOR DELETE
  USING (auth.uid() = follower_id);

-- conversations policies
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
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

DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- conversation_participants policies
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;
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

DROP POLICY IF EXISTS "Conversation creators can add participants" ON public.conversation_participants;
CREATE POLICY "Conversation creators can add participants"
  ON public.conversation_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND c.created_by = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND c.type = 'direct'
    )
  );

DROP POLICY IF EXISTS "Users can update their own participant record" ON public.conversation_participants;
CREATE POLICY "Users can update their own participant record"
  ON public.conversation_participants FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- messages policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
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

DROP POLICY IF EXISTS "Users can send messages to conversations they belong to" ON public.messages;
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

DROP POLICY IF EXISTS "Users can edit their own messages" ON public.messages;
CREATE POLICY "Users can edit their own messages"
  ON public.messages FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- message_reads policies
DROP POLICY IF EXISTS "Users can view read receipts in their conversations" ON public.message_reads;
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

DROP POLICY IF EXISTS "Users can mark messages as read for themselves" ON public.message_reads;
CREATE POLICY "Users can mark messages as read for themselves"
  ON public.message_reads FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- message_reactions policies
DROP POLICY IF EXISTS "Users can view reactions in their conversations" ON public.message_reactions;
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

DROP POLICY IF EXISTS "Users can add/remove their own reactions" ON public.message_reactions;
CREATE POLICY "Users can add/remove their own reactions"
  ON public.message_reactions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
