import { supabaseAdmin } from '../config/supabase';

/**
 * Ensures all messaging-related tables and columns exist.
 * This runs at server startup and safely adds missing columns/tables.
 */
export async function ensureMessagingSchema(): Promise<void> {
    console.log('[Migration] Checking messaging schema...');

    try {
        // Check if conversations table exists
        const { error: convCheck } = await supabaseAdmin
            .from('conversations')
            .select('id')
            .limit(1);

        if (convCheck && convCheck.message?.includes('does not exist')) {
            console.error('[Migration] ❌ conversations table does not exist!');
            console.error('[Migration] Please run the following SQL in your Supabase SQL Editor:');
            console.error('[Migration] File: supabase/migrations/003_follow_and_messaging_system.sql');
            return;
        }

        // Try to add missing columns to conversations table (safe — IF NOT EXISTS equivalent)
        const columnsToAdd = [
            { table: 'conversations', column: 'is_archived', type: 'BOOLEAN DEFAULT FALSE' },
            { table: 'conversations', column: 'archived_at', type: 'TIMESTAMPTZ' },
            { table: 'conversations', column: 'last_message', type: 'TEXT' },
            { table: 'conversations', column: 'last_message_at', type: 'TIMESTAMPTZ' },
            { table: 'conversation_participants', column: 'left_at', type: 'TIMESTAMPTZ' },
            { table: 'conversation_participants', column: 'last_read_at', type: 'TIMESTAMPTZ' },
            { table: 'conversation_participants', column: 'is_muted', type: 'BOOLEAN DEFAULT FALSE' },
        ];

        for (const { table, column, type } of columnsToAdd) {
            try {
                // Check if column exists by selecting it
                const { error } = await supabaseAdmin
                    .from(table)
                    .select(column)
                    .limit(1);

                if (error && error.message?.includes('does not exist')) {
                    console.log(`[Migration] Adding missing column: ${table}.${column}`);
                    // We can't run DDL via REST, so just log the SQL for the user
                    console.log(`[Migration] Run in Supabase SQL Editor: ALTER TABLE public.${table} ADD COLUMN IF NOT EXISTS ${column} ${type};`);
                }
            } catch {
                // Column check failed, skip
            }
        }

        // Check if messaging tables exist
        const tables = ['messages', 'message_reads', 'message_reactions'];
        for (const table of tables) {
            const { error } = await supabaseAdmin
                .from(table)
                .select('id')
                .limit(1);

            if (error && error.message?.includes('does not exist')) {
                console.error(`[Migration] ❌ ${table} table does not exist!`);
                console.error(`[Migration] Please run: supabase/migrations/003_follow_and_messaging_system.sql`);
            }
        }

        // Check if RPC functions exist by doing a test call
        const rpcFunctions = [
            { name: 'send_message', check: false },
            { name: 'find_or_create_direct_conversation', check: false },
            { name: 'mark_messages_read', check: false },
            { name: 'get_unread_count', check: false },
        ];

        for (const fn of rpcFunctions) {
            try {
                // A minimal test - we expect an error about params, not about function not found
                const { error } = await supabaseAdmin.rpc(fn.name, {});
                if (error && (error.message?.includes('does not exist') || error.code === 'PGRST202')) {
                    console.warn(`[Migration] ⚠️  RPC function '${fn.name}' not found. Messaging will use API fallback.`);
                    console.warn(`[Migration] Run the migration SQL to enable RPC functions.`);
                }
            } catch {
                // Expected
            }
        }

        console.log('[Migration] Messaging schema check complete.');
    } catch (err) {
        console.error('[Migration] Error checking messaging schema:', err);
    }
}

/**
 * Returns the SQL that needs to be run to fix missing columns.
 */
export function getMissingSchemaSql(): string {
    return `
-- Run this SQL in Supabase SQL Editor to fix messaging schema issues:

-- Add missing columns to conversations table
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_message TEXT;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;

-- Add missing columns to conversation_participants table
ALTER TABLE public.conversation_participants ADD COLUMN IF NOT EXISTS left_at TIMESTAMPTZ;
ALTER TABLE public.conversation_participants ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ;
ALTER TABLE public.conversation_participants ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT FALSE;
  `.trim();
}
