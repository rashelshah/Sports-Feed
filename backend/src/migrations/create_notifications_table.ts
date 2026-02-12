import { supabaseAdmin } from '../config/supabase';

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  type character varying(50) NOT NULL,
  title character varying(255) NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  data jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  read_at timestamp with time zone,
  from_user_id uuid
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_from_user_id ON public.notifications USING btree (from_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON public.notifications USING btree (read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications USING btree (created_at);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can view own notifications') THEN
    CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can update own notifications') THEN
    CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'System can insert notifications') THEN
    CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
  END IF;
END $$;

GRANT ALL ON TABLE public.notifications TO anon;
GRANT ALL ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;

NOTIFY pgrst, 'reload schema';
`;

/**
 * Create the notifications table if it doesn't exist.
 */
export async function createNotificationsTable(): Promise<void> {
    console.log('[Migration] Checking if notifications table exists...');

    // Check if table exists by trying a simple query
    const { error: checkError } = await supabaseAdmin
        .from('notifications')
        .select('id')
        .limit(1);

    if (!checkError) {
        console.log('[Migration] ✅ notifications table already exists.');
        return;
    }

    if (checkError.code !== 'PGRST205') {
        console.log('[Migration] notifications table check returned:', checkError.message);
        return;
    }

    console.log('[Migration] ⚠️  notifications table not found in database!');
    console.log('[Migration] Please create it by running the following SQL in your Supabase SQL Editor:');
    console.log('[Migration] Go to: https://supabase.com/dashboard → your project → SQL Editor');
    console.log('[Migration] ─────────────────────────────────────────');
    console.log(CREATE_TABLE_SQL);
    console.log('[Migration] ─────────────────────────────────────────');
}
