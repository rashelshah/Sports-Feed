import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

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
 * Hook to get all conversations for the current user with real-time updates
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
      // Fetch conversations where user is a participant and hasn't left
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

      // Fetch full conversation data with participants and profiles
      const { data: conversationsData, error: conversationsError } = await supabase
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

      if (conversationsError) throw conversationsError;

      // Get unread counts for each conversation
      const conversationsWithUnread = await Promise.all(
        (conversationsData || []).map(async (conv: any) => {
          const { data: unreadCount } = await supabase
            .rpc('get_unread_count', {
              p_conversation_id: conv.id,
              p_user_id: userId,
            });

          return {
            ...conv,
            unread_count: unreadCount || 0,
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

    // Initial fetch
    fetchConversations();

    // Subscribe to conversation changes
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
          // Refresh conversations on any change
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
    isLoading,
    error,
    refresh: fetchConversations,
  };
}

/**
 * Hook to get messages for a specific conversation with real-time updates
 * @param conversationId - The conversation ID to fetch messages for
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
        let query = supabase
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

        const { data, error: messagesError } = await query;

        if (messagesError) throw messagesError;

        const messagesData = (data || []).reverse(); // Reverse to show oldest first

        if (beforeMessageId) {
          setMessages((prev) => [...messagesData, ...prev]);
        } else {
          setMessages(messagesData);
        }

        setHasMore((data || []).length === PAGE_SIZE);
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

    // Initial fetch
    fetchMessages();

    // Mark messages as read
    markMessagesAsRead(conversationId, userId);

    // Subscribe to new messages
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
          const { data: newMessage } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles(id, username, full_name, profile_image, role),
              message_reactions(reaction, user_id),
              message_reads(user_id, read_at)
            `)
            .eq('id', payload.new.id)
            .single();

          if (newMessage) {
            setMessages((prev) => [...prev, newMessage as MessageWithSender]);

            // Mark as read if not the sender
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
        },
        () => {
          // Refresh messages to get updated reactions
          fetchMessages();
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
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh: () => fetchMessages(),
  };
}

/**
 * Send a message to a conversation
 */
export async function sendMessage(
  conversationId: string,
  content: string,
  type: 'text' | 'image' | 'video' | 'voice' | 'file' = 'text',
  mediaUrl?: string,
  replyToId?: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('send_message', {
      p_conversation_id: conversationId,
      p_sender_id: (await supabase.auth.getUser()).data.user?.id,
      p_content: content,
      p_type: type,
      p_media_url: mediaUrl,
      p_reply_to_id: replyToId,
    });

    if (error) throw error;
    return data;
  } catch (err: any) {
    console.error('Error sending message:', err);
    toast.error(err?.message || 'Failed to send message');
    return null;
  }
}

/**
 * Mark messages in a conversation as read
 */
export async function markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('mark_messages_read', {
      p_conversation_id: conversationId,
      p_user_id: userId,
    });

    if (error) throw error;
  } catch (err) {
    console.error('Error marking messages as read:', err);
  }
}

/**
 * Find or create a direct conversation with another user
 */
export async function findOrCreateDirectConversation(
  userIdA: string,
  userIdB: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('find_or_create_direct_conversation', {
      p_user_id_a: userIdA,
      p_user_id_b: userIdB,
    });

    if (error) throw error;
    return data;
  } catch (err: any) {
    console.error('Error finding/creating conversation:', err);
    toast.error(err?.message || 'Unable to start conversation');
    return null;
  }
}

/**
 * Archive a conversation
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

    if (error) throw error;
    toast.success('Conversation archived');
    return true;
  } catch (err: any) {
    console.error('Error archiving conversation:', err);
    toast.error(err?.message || 'Failed to archive conversation');
    return false;
  }
}

/**
 * Leave a conversation
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

    if (error) throw error;
    toast.success('Left conversation');
    return true;
  } catch (err: any) {
    console.error('Error leaving conversation:', err);
    toast.error(err?.message || 'Failed to leave conversation');
    return false;
  }
}

/**
 * Add a reaction to a message
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
      // If it's a duplicate, that's fine - user already reacted
      if (error.code === '23505') {
        return true;
      }
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
 * Remove a reaction from a message
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
 * Hook to search for users to message (must have follow relationship)
 */
export function useMessageableUsers(searchQuery: string) {
  const { user } = useAuthStore();
  const userId = user?.id;

  const [users, setUsers] = useState<DBProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchUsers = useCallback(async () => {
    if (!userId || !searchQuery.trim()) {
      setUsers([]);
      return;
    }

    setIsLoading(true);

    try {
      // Get users that current user follows or that follow current user
      const { data: following } = await supabase
        .from('user_following')
        .select('following_id')
        .eq('follower_id', userId);

      const { data: followers } = await supabase
        .from('user_following')
        .select('follower_id')
        .eq('following_id', userId);

      const followIds = new Set([
        ...(following?.map((f) => f.following_id) || []),
        ...(followers?.map((f) => f.follower_id) || []),
      ]);

      if (followIds.size === 0) {
        setUsers([]);
        setIsLoading(false);
        return;
      }

      // Search within those users
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, profile_image, role')
        .in('id', Array.from(followIds))
        .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
        .limit(20);

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error searching users:', err);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, searchQuery]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchUsers]);

  return { users, isLoading };
}
