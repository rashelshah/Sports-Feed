import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image, Smile, Share, MoreVertical, Archive, Check, CheckCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { aiService } from '../../services/aiService';
import { VoiceMessageButton } from './VoiceMessageButton';
import { 
  useMessages, 
  sendMessage, 
  markMessagesAsRead, 
  archiveConversation,
  MessageWithSender,
  ConversationWithParticipants
} from '../../hooks/useMessaging';
import { ProfileFollowButton } from '../profile/FollowButton';
import toast from 'react-hot-toast';

interface ChatWindowProps {
  conversationId: string;
  conversation?: ConversationWithParticipants;
  onBack?: () => void;
  onArchive?: () => void;
}

export function ChatWindow({ conversationId, conversation, onBack, onArchive }: ChatWindowProps) {
  const { user, darkMode } = useAuthStore();
  const { addNotification } = useAppStore();
  const { 
    messages, 
    setMessages,
    isLoading, 
    hasMore, 
    loadMore,
    refresh 
  } = useMessages(conversationId);
  
  const [newMessage, setNewMessage] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const userId = user?.id;

  const commonEmojis = ['😀', '😂', '😍', '🥳', '😎', '🤔', '👍', '👎', '❤️', '🎉', '🔥', '👏', '🙏', '✅', '❌', '🤝', '🏆', '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉'];

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Get other participant info from first message's sender
  // Get other participant from conversation participants if no messages yet
  const otherParticipantFromConv = conversation?.participants?.find(
    (p: { user_id: string; profile?: any }) => p.user_id !== userId
  )?.profile;

  const otherParticipant = messages.find(m => m.sender_id !== userId)?.sender || otherParticipantFromConv;

  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isLoading]);

  // Mark messages as read when conversation opens
  useEffect(() => {
    if (userId && conversationId) {
      markMessagesAsRead(conversationId, userId);
    }
  }, [conversationId, userId, messages.length]);

  // Handle scroll to load more messages
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || isLoading || !hasMore) return;

    if (container.scrollTop < 100) {
      loadMore();
    }
  }, [isLoading, hasMore, loadMore]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !userId || !conversationId) return;

    // AI Content Moderation
    setIsValidating(true);
    try {
      const moderationCheck = await aiService.realTimeModerationCheck(newMessage);
      
      if (moderationCheck.action === 'block') {
        toast.error('Message contains inappropriate content. Please revise.');
        setIsValidating(false);
        return;
      }
      
      if (moderationCheck.action === 'warn') {
        toast.error(moderationCheck.reason || 'Message may be inappropriate');
      }
    } catch (error) {
      console.error('Moderation check failed:', error);
    } finally {
      setIsValidating(false);
    }

    const content = newMessage.trim();
    setNewMessage('');

    // Create optimistic message for instant UI update
    const optimisticMessage: MessageWithSender = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: userId,
      content,
      type: 'text',
      created_at: new Date().toISOString(),
      sender: {
        id: userId,
        username: user?.fullName || 'You',
        full_name: user?.fullName || 'You',
        profile_image: user?.profileImage,
        role: user?.role || 'user',
      },
      reactions: [],
      read_by: [],
      is_edited: false,
      is_deleted: false,
    };

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage]);

    const messageId = await sendMessage(conversationId, content, 'text');

    if (!messageId) {
      setNewMessage(content);
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      return;
    }

    // Replace optimistic message with real one (or let real-time update handle it)
    setMessages(prev => prev.map(m => 
      m.id === optimisticMessage.id ? { ...m, id: messageId } : m
    ));

    if (otherParticipant) {
      addNotification({
        id: Date.now().toString(),
        userId: otherParticipant.id,
        type: 'comment',
        message: `${user?.fullName} sent you a message`,
        isRead: false,
        createdAt: new Date().toISOString(),
        fromUser: user,
      });
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    setNewMessage(transcript);
    toast.success('Voice transcribed! Review and send if ready.');
  };

  const handleShareProfile = () => {
    if (!otherParticipant) return;

    const shareUrl = `${window.location.origin}/profile/${otherParticipant.id}`;
    const shareText = `Connect with ${otherParticipant.full_name} (@${otherParticipant.username}) on SportsFeed!`;
    
    if (navigator.share) {
      navigator.share({
        title: `${otherParticipant.full_name} - SportsFeed`,
        text: shareText,
        url: shareUrl,
      }).then(() => {
        toast.success('Profile shared successfully!');
      }).catch(() => {
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`).then(() => {
          toast.success('Profile link copied to clipboard!');
        });
      });
    } else {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`).then(() => {
        toast.success('Profile link copied to clipboard!');
      });
    }
  };

  const handleArchive = async () => {
    if (!userId || !conversationId) return;

    const success = await archiveConversation(conversationId, userId);
    if (success) {
      onArchive?.();
    }
    setShowMenu(false);
  };

  const getVerificationBadge = () => null;

  const groupMessagesByDate = (msgs: MessageWithSender[]) => {
    const groups: { date: string; messages: MessageWithSender[] }[] = [];
    let currentDate = '';
    let currentGroup: MessageWithSender[] = [];

    msgs.forEach((msg) => {
      const msgDate = new Date(msg.created_at).toDateString();
      if (msgDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = msgDate;
        currentGroup = [msg];
      } else {
        currentGroup.push(msg);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  // Show loading overlay when switching conversations
  if (isLoading && messages.length === 0) {
    return (
      <div className={`flex flex-col h-full ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Chat Header - Show immediately with available data */}
        <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center space-x-3">
            {onBack && (
              <button
                onClick={onBack}
                className={`md:hidden p-2 -ml-2 rounded-full ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            
            <div className="flex items-center space-x-3">
              <img
                src={otherParticipant?.profile_image || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400'}
                alt={otherParticipant?.full_name}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <div className="flex items-center space-x-1">
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{otherParticipant?.full_name || 'Loading...'}</h3>
                </div>
                <p className={`text-sm capitalize ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {otherParticipant?.role || 'User'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className={`mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading messages...</p>
        </div>

        {/* Message Input - Disabled while loading */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              disabled
              className={`p-2 rounded-full ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}
            >
              <Image className="h-5 w-5" />
            </button>
            
            <div className="flex-1">
              <input
                type="text"
                disabled
                placeholder="Loading messages..."
                className={`w-full px-4 py-2 border rounded-full ${darkMode ? 'border-gray-600 bg-gray-700 text-gray-400' : 'border-gray-200 bg-gray-100 text-gray-400'}`}
              />
            </div>
            
            <button
              type="button"
              disabled
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-300 text-white'}`}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Chat Header */}
      <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className={`md:hidden p-2 -ml-2 rounded-full ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          
          <div className="flex items-center space-x-3">
            <img
              src={otherParticipant?.profile_image || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400'}
              alt={otherParticipant?.full_name}
              className="h-10 w-10 rounded-full object-cover"
            />
            <div>
              <div className="flex items-center space-x-1">
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{otherParticipant?.full_name || 'Loading...'}</h3>
                {getVerificationBadge()}
              </div>
              <p className={`text-sm capitalize ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {otherParticipant?.role || 'User'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {otherParticipant && (
            <ProfileFollowButton
              targetUserId={otherParticipant.id}
              targetUserName={otherParticipant.full_name}
            />
          )}
          
          <button
            onClick={handleShareProfile}
            className={`p-2 rounded-full transition-colors ${darkMode ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700' : 'text-gray-400 hover:text-blue-500 hover:bg-gray-100'}`}
            title="Share Profile"
          >
            <Share className="h-5 w-5" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`p-2 rounded-full transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border py-1 z-50 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                >
                  <button
                    onClick={handleArchive}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <Archive className="h-4 w-4" />
                    Archive Conversation
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {hasMore && (
          <div className="flex justify-center py-2">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="text-sm text-blue-500 hover:text-blue-600 disabled:text-gray-400"
            >
              {isLoading ? 'Loading...' : 'Load more messages'}
            </button>
          </div>
        )}

        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        )}

        {messages.map((message: MessageWithSender) => {
          const isOwn = message.sender_id === user?.id;
          
          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-end gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                {!isOwn && (
                  <img
                    src={message.sender?.profile_image || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400'}
                    alt={message.sender?.full_name}
                    className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                  />
                )}

                <div className="flex flex-col">
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      isOwn
                        ? 'bg-blue-500 text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-900 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>

                  <div className={`flex items-center gap-2 mt-1 px-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <span className={`text-xs ${isOwn ? 'text-blue-300' : 'text-gray-400'}`}>
                      {new Date(message.created_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    
                    {isOwn && (
                      <span className="text-blue-300">
                        {message.read_by && message.read_by.length > 0 ? (
                          <CheckCheck className="h-3 w-3" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className={`p-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            className={`p-2 rounded-full transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
            title="Upload image"
          >
            <Image className="h-5 w-5" />
          </button>
          
          <div className="flex-1 relative">
            <div className="relative" ref={emojiPickerRef}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={isValidating}
                className={`w-full px-4 py-2 pr-10 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'border border-gray-300 disabled:bg-gray-100 disabled:text-gray-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                title="Add emoji"
              >
                <Smile className="h-5 w-5" />
              </button>
              
              {showEmojiPicker && (
                <div className={`absolute bottom-full right-0 mb-2 rounded-lg shadow-lg border p-3 z-50 w-64 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="grid grid-cols-6 gap-2">
                    {commonEmojis.map((emoji, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleEmojiSelect(emoji)}
                        className={`text-2xl rounded p-1 transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <VoiceMessageButton
            onTranscript={handleVoiceTranscript}
            disabled={isValidating}
          />
          
          <button
            type="submit"
            disabled={!newMessage.trim() || isValidating}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white p-2 rounded-full transition-colors"
            title="Send message"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}