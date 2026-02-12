import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

// Helper to get auth token
const getToken = () => localStorage.getItem('token');

// Helper for backend API calls
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'Request failed');
  }

  return response.json();
}

export interface DBMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'voice' | 'file';
  media_url?: string;
  media_metadata?: Record<string, any>;
  reply_to_id?: string;
  is_edited: boolean;
  edited_at?: string;
  is_deleted: boolean;
  created_at: string;
}

export interface DBConversation {
  id: string;
  type: 'direct' | 'group';
  title?: string;
  avatar_url?: string;
  created_by: string;
  last_message?: string;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  archived_at?: string;
}

export interface DBConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  left_at?: string;
  last_read_at?: string;
  is_muted: boolean;
}

export interface DBProfile {
  id: string;
  username: string;
  full_name: string;
  profile_image?: string;
  role: string;
}

export interface ConversationWithParticipants extends DBConversation {
  participants: (DBConversationParticipant & { profile: DBProfile })[];
  unread_count: number;
}

export interface MessageWithSender extends DBMessage {
  sender: DBProfile;
  reactions?: { reaction: string; user_id: string }[];
  read_by?: { user_id: string; read_at: string }[];
}

/**
 * Hook to get all conversations for the current user with real-time updates.
 * Uses the backend API to fetch conversations, falling back to direct Supabase queries.
 */
export function useConversations() {
  const { user } = useAuthStore();
  const userId = user?.id;

  const [conversations, setConversations] = useState<ConversationWithParticipants[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<any>(null);

  const fetchConversations = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Try backend API first (more reliable — uses supabaseAdmin, no RLS issues)
      const data = await apiFetch('/api/conversations?type=all&limit=50');
      console.log('Conversations API response:', data);

      if (data.success && data.conversations && data.conversations.length > 0) {
        // Map backend response to our interface
        try {
          const mapped: ConversationWithParticipants[] = data.conversations.map((conv: any) => ({
            id: conv.id,
            type: conv.type,
            title: conv.title || conv.name,
            avatar_url: conv.avatar_url,
            created_by: conv.created_by,
            last_message: conv.last_message,
            last_message_at: conv.last_message_at,
            created_at: conv.created_at,
            updated_at: conv.updated_at,
            is_archived: conv.is_archived || false,
            archived_at: conv.archived_at,
            participants: (conv.participants || []).map((p: any) => {
              // Normalize: backend returns user.name/avatar_url mapped from full_name/profile_image
              const u = p.user || {};
              return {
                id: p.id || p.user_id,
                conversation_id: conv.id,
                user_id: p.user_id || u.id,
                role: p.role || 'member',
                joined_at: p.joined_at || conv.created_at,
                left_at: p.left_at,
                last_read_at: p.last_read_at,
                is_muted: p.is_muted || false,
                profile: {
                  id: u.id || p.user_id,
                  username: u.username || u.name || u.full_name || 'Unknown',
                  full_name: u.name || u.full_name || 'Unknown',
                  profile_image: u.avatar_url || u.profile_image,
                  role: u.role || 'athlete',
                },
              };
            }),
            unread_count: conv.unread_count || 0,
          }));

          console.log('Mapped conversations:', mapped.length);
          setConversations(mapped);
          setIsLoading(false);
          return;
        } catch (mapErr) {
          console.error('Error mapping conversations:', mapErr);
          // Continue to fallback
        }
      } else if (data.success && (!data.conversations || data.conversations.length === 0)) {
        // API returned success but no conversations - user has no conversations yet
        console.log('No conversations found for user');
        setConversations([]);
        setIsLoading(false);
        return;
      }
    } catch (apiErr) {
      console.warn('Backend API conversations fetch failed, trying direct Supabase:', apiErr);
    }

    // Fallback: direct Supabase query
    try {
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId)
        .is('left_at', null);

      if (participantError) throw participantError;

      if (!participantData || participantData.length === 0) {
        setConversations([]);
        setIsLoading(false);
        return;
      }

      const conversationIds = participantData.map((p) => p.conversation_id);

      // Try joining with profiles first, fall back to users table
      let conversationsData: any[] | null = null;
      let conversationsError: any = null;

      // Attempt 1: join with profiles table
      const result1 = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_participants!inner(
            *,
            profile:profiles(id, username, full_name, profile_image, role)
          )
        `)
        .in('id', conversationIds)
        .order('last_message_at', { ascending: false });

      if (!result1.error) {
        conversationsData = result1.data;
      } else {
        // Attempt 2: join with users table instead
        console.warn('profiles join failed, trying users table:', result1.error.message);
        const result2 = await supabase
          .from('conversations')
          .select(`
            *,
            conversation_participants!inner(
              *,
              profile:users(id, username, full_name, profile_image, role)
            )
          `)
          .in('id', conversationIds)
          .order('last_message_at', { ascending: false });

        if (result2.error) {
          // Attempt 3: no join, just get conversations
          console.warn('users join also failed, fetching without profiles:', result2.error.message);
          const result3 = await supabase
            .from('conversations')
            .select('*, conversation_participants!inner(*)')
            .in('id', conversationIds)
            .order('last_message_at', { ascending: false });

          conversationsData = result3.data;
          conversationsError = result3.error;
        } else {
          conversationsData = result2.data;
        }
      }

      if (conversationsError) throw conversationsError;

      // Get unread counts (try RPC, fall back to 0)
      const conversationsWithUnread = await Promise.all(
        (conversationsData || []).map(async (conversation: any) => {
          let unreadCount = 0;
          try {
            const { data } = await supabase.rpc('get_unread_count', {
              p_conversation_id: conversation.id,
              p_user_id: userId,
            });
            unreadCount = data || 0;
          } catch {
            // RPC not available, default to 0
          }

          return {
            ...conversation,
            unread_count: unreadCount,
          };
        })
      );

      setConversations(conversationsWithUnread);
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError(err?.message || 'Failed to fetch conversations');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return;

    fetchConversations();

    const subscription = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_participants',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    subscriptionRef.current = subscription;

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, fetchConversations]);

  return {
    conversations,
    setConversations,
    isLoading,
    error,
    refresh: fetchConversations,
  };
}

/**
 * Hook to get messages for a specific conversation with real-time updates
 */
export function useMessages(conversationId: string | null) {
  const { user } = useAuthStore();
  const userId = user?.id;

  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const subscriptionRef = useRef<any>(null);

  const PAGE_SIZE = 50;

  const fetchMessages = useCallback(
    async (beforeMessageId?: string) => {
      if (!conversationId || !userId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Try backend API first
        let apiSuccess = false;
        try {
          const endpoint = `/api/messages/conversation/${conversationId}?limit=${PAGE_SIZE}`;
          const data = await apiFetch(endpoint);

          if (data.success && data.messages) {
            const mapped: MessageWithSender[] = data.messages.map((m: any) => ({
              id: m.id,
              conversation_id: m.conversation_id,
              sender_id: m.sender_id,
              content: m.content,
              type: m.type || 'text',
              media_url: m.media_url,
              media_metadata: m.media_metadata,
              reply_to_id: m.reply_to_id,
              is_edited: m.is_edited || false,
              edited_at: m.edited_at,
              is_deleted: m.is_deleted || false,
              created_at: m.created_at,
              // Normalize: backend now returns sender.full_name/profile_image
              sender: m.sender ? {
                id: m.sender.id || m.sender_id,
                username: m.sender.username || m.sender.full_name || m.sender.name || 'Unknown',
                full_name: m.sender.full_name || m.sender.name || 'Unknown',
                profile_image: m.sender.profile_image || m.sender.avatar_url,
                role: m.sender.role || 'athlete',
              } : {
                id: m.sender_id,
                username: 'Unknown',
                full_name: 'Unknown',
                profile_image: undefined,
                role: 'athlete',
              },
              reactions: m.message_reactions || [],
              read_by: m.message_reads || [],
            }));

            if (beforeMessageId) {
              setMessages((prev) => [...mapped, ...prev]);
            } else {
              setMessages(mapped);
            }
            setHasMore(data.messages.length === PAGE_SIZE);
            apiSuccess = true;
          }
        } catch (apiErr) {
          console.warn('Backend API messages fetch failed, trying direct Supabase:', apiErr);
        }

        if (apiSuccess) {
          setIsLoading(false);
          return;
        }

        // Fallback: direct Supabase query
        // Try profiles join first, fall back to users
        let query: any;
        let queryResult: any;

        // Attempt 1: profiles join
        query = supabase
          .from('messages')
          .select(`
            *,
            sender:profiles(id, username, full_name, profile_image, role),
            message_reactions(reaction, user_id),
            message_reads(user_id, read_at)
          `)
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(PAGE_SIZE);

        if (beforeMessageId) {
          const { data: beforeMessage } = await supabase
            .from('messages')
            .select('created_at')
            .eq('id', beforeMessageId)
            .single();

          if (beforeMessage) {
            query = query.lt('created_at', beforeMessage.created_at);
          }
        }

        queryResult = await query;

        if (queryResult.error) {
          // Attempt 2: users join
          console.warn('profiles join failed for messages, trying users:', queryResult.error.message);
          query = supabase
            .from('messages')
            .select(`
              *,
              sender:users(id, username, full_name, profile_image, role)
            `)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false })
            .limit(PAGE_SIZE);

          queryResult = await query;
        }

        if (queryResult.error) throw queryResult.error;

        const messagesData = (queryResult.data || []).reverse();

        if (beforeMessageId) {
          setMessages((prev) => [...messagesData, ...prev]);
        } else {
          setMessages(messagesData);
        }

        setHasMore((queryResult.data || []).length === PAGE_SIZE);
      } catch (err: any) {
        console.error('Error fetching messages:', err);
        setError(err?.message || 'Failed to fetch messages');
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, userId]
  );

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore && messages.length > 0) {
      fetchMessages(messages[0].id);
    }
  }, [fetchMessages, messages, isLoading, hasMore]);

  // Set up real-time subscription for messages
  useEffect(() => {
    if (!conversationId || !userId) return;

    fetchMessages();
    markMessagesAsRead(conversationId, userId);

    const subscription = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch the full message with sender info
          let newMessage: any = null;

          // Try profiles join
          const { data: msg1 } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles(id, username, full_name, profile_image, role),
              message_reactions(reaction, user_id),
              message_reads(user_id, read_at)
            `)
            .eq('id', payload.new.id)
            .single();

          if (msg1) {
            newMessage = msg1;
          } else {
            // Fallback to users table
            const { data: msg2 } = await supabase
              .from('messages')
              .select(`
                *,
                sender:users(id, username, full_name, profile_image, role)
              `)
              .eq('id', payload.new.id)
              .single();
            newMessage = msg2;
          }

          if (newMessage) {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage as MessageWithSender];
            });

            if (newMessage.sender_id !== userId) {
              markMessagesAsRead(conversationId, userId);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id
                ? { ...msg, ...(payload.new as DBMessage) }
                : msg
            )
          );
        }
      )
      .subscribe();

    subscriptionRef.current = subscription;

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId, userId, fetchMessages]);

  return {
    messages,
    setMessages,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh: () => fetchMessages(),
  };
}

/**
 * Send a message to a conversation.
 * Tries Supabase RPC first, falls back to backend API.
 */
export async function sendMessage(
  conversationId: string,
  content: string,
  type: 'text' | 'image' | 'video' | 'voice' | 'file' = 'text',
  mediaUrl?: string,
  replyToId?: string
): Promise<string | null> {
  // Try Supabase RPC first
  try {
    const { data, error } = await supabase.rpc('send_message', {
      p_conversation_id: conversationId,
      p_sender_id: (await supabase.auth.getUser()).data.user?.id,
      p_content: content,
      p_type: type,
      p_media_url: mediaUrl,
      p_reply_to_id: replyToId,
    });

    if (!error && data) return data;
    if (error) {
      console.warn('send_message RPC failed, trying backend API:', error.message);
    }
  } catch (rpcErr) {
    console.warn('send_message RPC error, trying backend API:', rpcErr);
  }

  // Fallback: backend API
  try {
    const result = await apiFetch('/api/messages', {
      method: 'POST',
      body: JSON.stringify({
        conversationId,
        content,
        type: type === 'voice' ? 'audio' : type, // backend expects 'audio' not 'voice'
        mediaUrl,
        replyToId,
      }),
    });

    if (result.success && result.data) {
      return result.data.id;
    }

    throw new Error(result.error || 'Failed to send message');
  } catch (err: any) {
    console.error('Error sending message:', err);
    toast.error(err?.message || 'Failed to send message');
    return null;
  }
}

/**
 * Mark messages in a conversation as read.
 * Tries RPC first, falls back silently.
 */
export async function markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('mark_messages_read', {
      p_conversation_id: conversationId,
      p_user_id: userId,
    });

    if (error) {
      console.warn('mark_messages_read RPC failed:', error.message);
      // Non-critical — don't show error toast
    }
  } catch (err) {
    console.warn('Error marking messages as read:', err);
  }
}

/**
 * Rejoin a conversation that the user has previously left.
 * This clears the left_at timestamp to allow messaging again.
 */
export async function rejoinConversation(
  conversationId: string,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('conversation_participants')
      .update({ left_at: null, last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (err: any) {
    console.error('Error rejoining conversation:', err);
    return false;
  }
}

/**
 * Find or create a direct conversation with another user.
 * Tries Supabase RPC first, falls back to backend API.
 * If the user has previously left the conversation, it will rejoin them.
 */
export async function findOrCreateDirectConversation(
  userIdA: string,
  userIdB: string
): Promise<string | null> {
  // First, check if there's an existing conversation (including ones where user A has left)
  try {
    const { data: existingConv, error: findError } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        left_at,
        conversation:conversations!inner(
          id,
          conversation_participants!inner(user_id)
        )
      `)
      .eq('user_id', userIdA)
      .eq('conversation.conversation_participants.user_id', userIdB)
      .eq('conversation.type', 'direct')
      .maybeSingle();

    if (!findError && existingConv) {
      const convId = existingConv.conversation_id;
      
      // If user A has left this conversation, rejoin them
      if (existingConv.left_at) {
        const rejoined = await rejoinConversation(convId, userIdA);
        if (rejoined) {
          console.log('Rejoined existing conversation:', convId);
          return convId;
        }
      } else {
        // User is still in the conversation, return it
        return convId;
      }
    }
  } catch (findErr) {
    console.warn('Error finding existing conversation:', findErr);
    // Continue to create new conversation
  }

  // Try Supabase RPC first
  try {
    const { data, error } = await supabase.rpc('find_or_create_direct_conversation', {
      p_user_id_a: userIdA,
      p_user_id_b: userIdB,
    });

    if (!error && data) return data;
    if (error) {
      console.warn('find_or_create_direct_conversation RPC failed, trying backend API:', error.message);
    }
  } catch (rpcErr) {
    console.warn('find_or_create_direct_conversation RPC error, trying backend API:', rpcErr);
  }

  // Fallback: backend API
  try {
    const result = await apiFetch('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({
        type: 'direct',
        participantIds: [userIdB],
      }),
    });

    if (result.success && result.conversation) {
      return result.conversation.id;
    }

    // If conversation already exists, the API returns it in the error
    if (result.conversationId) {
      return result.conversationId;
    }

    throw new Error(result.error || 'Failed to create conversation');
  } catch (err: any) {
    // Special case: "Direct conversation already exists" is not really an error
    if (err.message?.includes('already exists')) {
      // Try to extract conversation ID from error or re-fetch
      console.warn('Conversation already exists, fetching existing...');
    }
    console.error('Error finding/creating conversation:', err);
    toast.error(err?.message || 'Unable to start conversation');
    return null;
  }
}

/**
 * Archive a conversation.
 */
export async function archiveConversation(
  conversationId: string,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('archive_conversation', {
      p_conversation_id: conversationId,
      p_user_id: userId,
    });

    if (error) {
      console.warn('archive_conversation RPC failed:', error.message);
      // Fallback: direct update
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ is_archived: true, archived_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (updateError) throw updateError;
    }

    toast.success('Conversation archived');
    return true;
  } catch (err: any) {
    console.error('Error archiving conversation:', err);
    toast.error(err?.message || 'Failed to archive conversation');
    return false;
  }
}

/**
 * Leave a conversation.
 */
export async function leaveConversation(
  conversationId: string,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('leave_conversation', {
      p_conversation_id: conversationId,
      p_user_id: userId,
    });

    if (error) {
      console.warn('leave_conversation RPC failed:', error.message);
      // Fallback: direct update
      const { error: updateError } = await supabase
        .from('conversation_participants')
        .update({ left_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);

      if (updateError) throw updateError;
    }

    toast.success('Left conversation');
    return true;
  } catch (err: any) {
    console.error('Error leaving conversation:', err);
    toast.error(err?.message || 'Failed to leave conversation');
    return false;
  }
}

/**
 * Add a reaction to a message.
 */
export async function addReaction(
  messageId: string,
  reaction: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from('message_reactions').insert({
      message_id: messageId,
      reaction,
    });

    if (error) {
      if (error.code === '23505') return true; // Already reacted
      throw error;
    }
    return true;
  } catch (err: any) {
    console.error('Error adding reaction:', err);
    toast.error('Failed to add reaction');
    return false;
  }
}

/**
 * Remove a reaction from a message.
 */
export async function removeReaction(
  messageId: string,
  reaction: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('reaction', reaction);

    if (error) throw error;
    return true;
  } catch (err: any) {
    console.error('Error removing reaction:', err);
    toast.error('Failed to remove reaction');
    return false;
  }
}

/**
 * Hook to search for users to message (must have follow relationship).
 * Uses the backend API to find followed users.
 */
export function useMessageableUsers(searchQuery: string, autoLoadAll = false) {
  const { user } = useAuthStore();
  const userId = user?.id;

  const [users, setUsers] = useState<DBProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchUsers = useCallback(async () => {
    if (!userId) return;
    
    // If autoLoadAll is true, fetch all followed users without requiring search query
    if (!autoLoadAll && !searchQuery.trim()) {
      setUsers([]);
      return;
    }

    setIsLoading(true);

    try {
      // Try fetching followed users via backend API (more reliable)
      let followIds: Set<string> = new Set();

      try {
        const [followingData, followersData] = await Promise.all([
          apiFetch(`/api/users/${userId}/following?limit=100`),
          apiFetch(`/api/users/${userId}/followers?limit=100`),
        ]);

        (followingData.following || []).forEach((f: any) => followIds.add(f.id));
        (followersData.followers || []).forEach((f: any) => followIds.add(f.id));
      } catch {
        // Fallback: direct Supabase query for follow relationships
        const { data: following } = await supabase
          .from('user_following')
          .select('following_id')
          .eq('follower_id', userId);

        const { data: followers } = await supabase
          .from('user_following')
          .select('follower_id')
          .eq('following_id', userId);

        followIds = new Set([
          ...(following?.map((f) => f.following_id) || []),
          ...(followers?.map((f) => f.follower_id) || []),
        ]);
      }

      if (followIds.size === 0) {
        setUsers([]);
        setIsLoading(false);
        return;
      }

      let searchResult: DBProfile[] = [];

      // If autoLoadAll and no search query, get all followed users
      if (autoLoadAll && !searchQuery.trim()) {
        // Attempt 1: profiles table
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, full_name, profile_image, role')
          .in('id', Array.from(followIds))
          .limit(50);

        if (!profilesError && profilesData) {
          searchResult = profilesData;
        } else {
          // Attempt 2: users table
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, username, full_name, profile_image, role')
            .in('id', Array.from(followIds))
            .limit(50);

          if (!usersError && usersData) {
            searchResult = usersData;
          }
        }
      } else {
        // Search within those users — try profiles first, fall back to users
        // Attempt 1: profiles table
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, full_name, profile_image, role')
          .in('id', Array.from(followIds))
          .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
          .limit(20);

        if (!profilesError && profilesData) {
          searchResult = profilesData;
        } else {
          // Attempt 2: users table
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, username, full_name, profile_image, role')
            .in('id', Array.from(followIds))
            .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
            .limit(20);

          if (!usersError && usersData) {
            searchResult = usersData;
          }
        }
      }

      setUsers(searchResult);
    } catch (err) {
      console.error('Error searching users:', err);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, searchQuery, autoLoadAll]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchUsers]);

  return { users, isLoading };
}
