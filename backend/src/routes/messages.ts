import express, { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { authenticateToken } from '../middleware/auth';
import { validate, validateQuery, validateParams } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Validation schemas
const sendMessageSchema = Joi.object({
  conversationId: Joi.string().uuid().required(),
  content: Joi.string().required().max(2000),
  type: Joi.string().valid('text', 'image', 'video', 'audio', 'file').default('text'),
  mediaUrl: Joi.string().uri().optional().allow(null, ''),
  replyToId: Joi.string().uuid().optional().allow(null)
});

const getMessagesQuerySchema = Joi.object({
  page: Joi.string().optional(),
  limit: Joi.string().optional(),
  before: Joi.date().iso().optional(),
  after: Joi.date().iso().optional()
});

const conversationIdSchema = Joi.object({
  conversationId: Joi.string().uuid().required()
});

const messageIdSchema = Joi.object({
  id: Joi.string().uuid().required()
});

const updateMessageSchema = Joi.object({
  content: Joi.string().required().max(2000)
});

// Get messages for a conversation
router.get('/conversation/:conversationId', authenticateToken, validateParams(conversationIdSchema), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { conversationId } = req.params;
  const {
    page: pageStr = '1',
    limit: limitStr = '50',
    before,
    after
  } = req.query as any;

  const page = parseInt(pageStr, 10) || 1;
  const limit = parseInt(limitStr, 10) || 50;

  // Check if user is participant in conversation
  const { data: participant, error: participantError } = await supabaseAdmin
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', req.user!.id)
    .single();

  if (participantError || !participant) {
    res.status(403).json({
      success: false,
      error: 'Not authorized to view messages in this conversation'
    });
    return;
  }

  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .limit(limit)
    .order('created_at', { ascending: false });

  // Apply date filters
  if (before) {
    query = query.lt('created_at', before);
  }

  if (after) {
    query = query.gt('created_at', after);
  }

  const { data: messages, error } = await query;

  if (error) {
    console.error('Messages query error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to fetch messages',
      details: error.message
    });
    return;
  }

  // Fetch sender data for all messages separately (more reliable than joins)
  const senderIds = [...new Set((messages || []).map(m => m.sender_id))];
  let sendersMap = new Map();

  if (senderIds.length > 0) {
    const { data: sendersData } = await supabaseAdmin
      .from('users')
      .select('id, full_name, profile_image, role, is_verified')
      .in('id', senderIds);

    (sendersData || []).forEach(u => {
      sendersMap.set(u.id, u);
    });
  }

  // Attach sender data to each message
  const messagesWithSender = (messages || []).map(msg => {
    const sender = sendersMap.get(msg.sender_id) || {};
    return {
      ...msg,
      sender: {
        id: sender.id || msg.sender_id,
        name: sender.full_name || 'Unknown',
        avatar_url: sender.profile_image,
        role: sender.role || 'athlete',
        is_verified: sender.is_verified
      }
    };
  });

  // Mark messages as read (ignore errors if table doesn't exist)
  try {
    await supabaseAdmin
      .from('message_reads')
      .upsert(
        (messages || []).map(message => ({
          message_id: message.id,
          user_id: req.user!.id,
          read_at: new Date().toISOString()
        })),
        { onConflict: 'message_id,user_id' }
      );
  } catch (e) {
    // message_reads table may not exist
  }

  res.json({
    success: true,
    messages: messagesWithSender.reverse(), // Reverse to show oldest first
    pagination: {
      currentPage: page,
      totalPages: 1,
      totalMessages: messages?.length || 0,
      hasNextPage: false,
      hasPrevPage: false
    }
  });
}));

// Send a message
router.post('/', authenticateToken, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  console.log('=== SEND MESSAGE DEBUG ===');
  console.log('Request body:', req.body);

  const {
    conversationId,
    content,
    type = 'text',
    mediaUrl,
    replyToId
  } = req.body;

  // Check if user is participant in conversation
  const { data: participant, error: participantError } = await supabaseAdmin
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', req.user!.id)
    .single();

  if (participantError || !participant) {
    res.status(403).json({
      success: false,
      error: 'Not authorized to send messages in this conversation'
    });
    return;
  }

  // If replying to a message, verify it exists and belongs to this conversation
  if (replyToId) {
    const { data: replyToMessage, error: replyError } = await supabaseAdmin
      .from('messages')
      .select('id, conversation_id')
      .eq('id', replyToId)
      .single();

    if (replyError || !replyToMessage || replyToMessage.conversation_id !== conversationId) {
      res.status(400).json({
        success: false,
        error: 'Invalid reply message'
      });
      return;
    }
  }

  const messageId = uuidv4();

  const { data: message, error } = await supabaseAdmin
    .from('messages')
    .insert({
      id: messageId,
      conversation_id: conversationId,
      sender_id: req.user!.id,
      content,
      type,
      media_url: mediaUrl,
      reply_to_id: replyToId,
      created_at: new Date().toISOString()
    })
    .select('*')
    .single();

  if (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to send message'
    });
    return;
  }

  // Update conversation's last message info
  await supabaseAdmin
    .from('conversations')
    .update({
      last_message_at: new Date().toISOString(),
      last_message: content.substring(0, 100) // Truncate for preview
    })
    .eq('id', conversationId);

  // Get other participants to send notifications
  const { data: otherParticipants } = await supabaseAdmin
    .from('conversation_participants')
    .select(`
      user:users!user_id(
        id,
        name,
        email
      )
    `)
    .eq('conversation_id', conversationId)
    .neq('user_id', req.user!.id);

  // Get sender's name for notification
  const { data: sender } = await supabaseAdmin
    .from('users')
    .select('name, full_name')
    .eq('id', req.user!.id)
    .single();

  const senderName = sender?.name || sender?.full_name || 'Someone';

  // Create notifications for other participants
  if (otherParticipants && otherParticipants.length > 0) {
    const notifications = otherParticipants.map(participant => ({
      user_id: participant.user[0]?.id,
      type: 'message',
      title: 'New Message',
      message: `${senderName} messaged you: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
      data: { conversationId, messageId, senderId: req.user!.id },
      from_user_id: req.user!.id,
      created_at: new Date().toISOString()
    }));

    const { data: inserted } = await supabaseAdmin
      .from('notifications')
      .insert(notifications)
      .select();

    // Emit notifications in real time
    const socketHandlers = req.app.locals.socketHandlers;
    if (socketHandlers && inserted) {
      inserted.forEach((n: any) => socketHandlers.sendNotificationToUser(n.user_id, n));
    }
  }

  // Emit message to conversation room via socket
  const socketHandlers = req.app.locals.socketHandlers;
  if (socketHandlers) {
    socketHandlers.broadcastToConversation(conversationId, 'newMessage', message);
  }

  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    data: message
  });
}));

// Get single message
router.get('/:id', authenticateToken, validateParams(messageIdSchema), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const { data: message, error } = await supabaseAdmin
    .from('messages')
    .select(`
      *,
      sender:users!sender_id(
        id,
        name,
        avatar_url,
        role,
        is_verified
      ),
      conversation:conversations!conversation_id(
        id,
        type,
        name
      ),
      reply_to:messages!reply_to_id(
        id,
        content,
        type,
        sender:users!sender_id(
          id,
          name,
          avatar_url
        )
      ),
      reactions:message_reactions(
        *,
        user:users!user_id(
          id,
          name,
          avatar_url
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error || !message) {
    res.status(404).json({
      success: false,
      error: 'Message not found'
    });
    return;
  }

  // Check if user is participant in the conversation
  const { data: participant } = await supabaseAdmin
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', message.conversation_id)
    .eq('user_id', req.user!.id)
    .single();

  if (!participant) {
    res.status(403).json({
      success: false,
      error: 'Not authorized to view this message'
    });
    return;
  }

  res.json({
    success: true,
    message
  });
}));

// Update message (edit)
router.put('/:id', authenticateToken, validateParams(messageIdSchema), validate(updateMessageSchema), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { content } = req.body;

  // Check if user owns the message
  const { data: existingMessage, error: fetchError } = await supabaseAdmin
    .from('messages')
    .select('sender_id, conversation_id, created_at')
    .eq('id', id)
    .single();

  if (fetchError || !existingMessage) {
    res.status(404).json({
      success: false,
      error: 'Message not found'
    });
    return;
  }

  if (existingMessage.sender_id !== req.user!.id) {
    res.status(403).json({
      success: false,
      error: 'Not authorized to view this message'
    });
    return;
  }

  // Check if message is not too old (e.g., 24 hours)
  const messageAge = Date.now() - new Date(existingMessage.created_at).getTime();
  const maxEditAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  if (messageAge > maxEditAge) {
    res.status(400).json({
      success: false,
      error: 'Message is too old to edit'
    });
    return;
  }

  const { data: updatedMessage, error } = await supabaseAdmin
    .from('messages')
    .update({
      content,
      is_edited: true,
      edited_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to update message'
    });
    return;
  }

  res.json({
    success: true,
    message: 'Message updated successfully',
    data: updatedMessage
  });
}));

// Delete message
router.delete('/:id', authenticateToken, validateParams(messageIdSchema), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // Check if user owns the message
  const { data: existingMessage, error: fetchError } = await supabaseAdmin
    .from('messages')
    .select('sender_id, conversation_id')
    .eq('id', id)
    .single();

  if (fetchError || !existingMessage) {
    res.status(404).json({
      success: false,
      error: 'Message not found'
    });
    return;
  }

  if (existingMessage.sender_id !== req.user!.id) {
    res.status(403).json({
      success: false,
      error: 'Not authorized to delete this message'
    });
    return;
  }

  // Soft delete - mark as deleted instead of actually deleting
  const { error } = await supabaseAdmin
    .from('messages')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      content: 'This message was deleted'
    })
    .eq('id', id);

  if (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to delete message'
    });
    return;
  }

  res.json({
    success: true,
    message: 'Message deleted successfully'
  });
}));

// Add reaction to message
router.post('/:id/react', authenticateToken, validateParams(messageIdSchema), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id: messageId } = req.params;
  const { emoji } = req.body;

  if (!emoji || typeof emoji !== 'string') {
    res.status(400).json({
      success: false,
      error: 'Valid emoji is required'
    });
    return;
  }

  // Check if message exists and user has access
  const { data: message, error: messageError } = await supabaseAdmin
    .from('messages')
    .select('id, conversation_id')
    .eq('id', messageId)
    .single();

  if (messageError || !message) {
    res.status(404).json({
      success: false,
      error: 'Message not found'
    });
    return;
  }

  // Check if user is participant in conversation
  const { data: participant } = await supabaseAdmin
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', message.conversation_id)
    .eq('user_id', req.user!.id)
    .single();

  if (!participant) {
    res.status(403).json({
      success: false,
      error: 'Not authorized to react to this message'
    });
    return;
  }

  // Check if user already reacted with this emoji
  const { data: existingReaction } = await supabaseAdmin
    .from('message_reactions')
    .select('id')
    .eq('message_id', messageId)
    .eq('user_id', req.user!.id)
    .eq('emoji', emoji)
    .single();

  if (existingReaction) {
    // Remove reaction
    const { error: removeError } = await supabaseAdmin
      .from('message_reactions')
      .delete()
      .eq('id', existingReaction.id);

    if (removeError) {
      res.status(400).json({
        success: false,
        error: 'Failed to remove reaction'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Reaction removed successfully',
      action: 'removed'
    });
  } else {
    // Add reaction
    const { error: addError } = await supabaseAdmin
      .from('message_reactions')
      .insert({
        message_id: messageId,
        user_id: req.user!.id,
        emoji,
        created_at: new Date().toISOString()
      });

    if (addError) {
      res.status(400).json({
        success: false,
        error: 'Failed to add reaction'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Reaction added successfully',
      action: 'added'
    });
  }
}));

// Mark messages as read
router.post('/read', authenticateToken, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { messageIds } = req.body;

  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    res.status(400).json({
      success: false,
      error: 'Message IDs array is required'
    });
    return;
  }

  // Verify all messages exist and user has access
  const { data: messages } = await supabaseAdmin
    .from('messages')
    .select('id, conversation_id')
    .in('id', messageIds);

  if (!messages || messages.length !== messageIds.length) {
    res.status(400).json({
      success: false,
      error: 'Some messages not found'
    });
    return;
  }

  // Check access to all conversations
  const conversationIds = [...new Set(messages.map(m => m.conversation_id))];
  const { data: participants } = await supabaseAdmin
    .from('conversation_participants')
    .select('conversation_id')
    .in('conversation_id', conversationIds)
    .eq('user_id', req.user!.id);

  if (!participants || participants.length !== conversationIds.length) {
    res.status(403).json({
      success: false,
      error: 'Not authorized to access some conversations'
    });
    return;
  }

  // Mark messages as read
  const { error } = await supabaseAdmin
    .from('message_reads')
    .upsert(
      messageIds.map(messageId => ({
        message_id: messageId,
        user_id: req.user!.id,
        read_at: new Date().toISOString()
      })),
      { onConflict: 'message_id,user_id' }
    );

  if (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to mark messages as read'
    });
    return;
  }

  res.json({
    success: true,
    message: 'Messages marked as read successfully'
  });
}));

// Search messages in a conversation
router.get('/conversation/:conversationId/search', authenticateToken, validateParams(conversationIdSchema), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { conversationId } = req.params;
  const { query, limit = 20 } = req.query as any;

  if (!query || query.length < 2) {
    res.status(400).json({
      success: false,
      error: 'Search query must be at least 2 characters'
    });
    return;
  }

  // Check if user is participant in conversation
  const { data: participant } = await supabaseAdmin
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', req.user!.id)
    .single();

  if (!participant) {
    res.status(403).json({
      success: false,
      error: 'Not authorized to search messages in this conversation'
    });
    return;
  }

  const { data: messages, error } = await supabaseAdmin
    .from('messages')
    .select(`
      *,
      sender:users!sender_id(
        id,
        name,
        avatar_url,
        role
      )
    `)
    .eq('conversation_id', conversationId)
    .ilike('content', `%${query}%`)
    .eq('is_deleted', false)
    .limit(limit)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(400).json({
      success: false,
      error: 'Search failed'
    });
    return;
  }

  res.json({
    success: true,
    messages: messages || []
  });
}));

export default router;