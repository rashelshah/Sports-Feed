import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Image, Smile, Share } from 'lucide-react';
import { Conversation, Message } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { aiService } from '../../services/aiService';
import { VoiceMessageButton } from './VoiceMessageButton';
import toast from 'react-hot-toast';

interface ChatWindowProps {
  conversation: Conversation;
}

export function ChatWindow({ conversation }: ChatWindowProps) {
  const { user } = useAuthStore();
  const { addMessage, addNotification, messages } = useAppStore();
  const [newMessage, setNewMessage] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherUser = conversation.participants[0];

  useEffect(() => {
    if (user) {
      const filteredMessages = messages.filter(msg =>
        (msg.senderId === user.id && msg.receiverId === otherUser.id) ||
        (msg.senderId === otherUser.id && msg.receiverId === user.id)
      ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      setConversationMessages(filteredMessages);
    }
  }, [messages, user, otherUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user) return;

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

    const message: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      receiverId: otherUser.id,
      content: newMessage,
      type: 'text',
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    addMessage(message);
    
    // Add notification for the receiver
    addNotification({
      id: Date.now().toString(),
      userId: otherUser.id,
      type: 'comment',
      message: `${user.fullName} sent you a message`,
      isRead: false,
      createdAt: new Date().toISOString(),
      fromUser: user,
    });
    
    setNewMessage('');
  };

  const handleVoiceTranscript = (transcript: string) => {
    setNewMessage(transcript);
    toast.success('Voice transcribed! Review and send if ready.');
  };

  const handleShareProfile = () => {
    const shareUrl = `${window.location.origin}/profile/${otherUser.id}`;
    const shareText = `Connect with ${otherUser.fullName} (@${otherUser.username}) - ${otherUser.role} specializing in ${otherUser.sportsCategory.replace('-', ' ')} on SportsFeed!`;
    
    if (navigator.share) {
      navigator.share({
        title: `${otherUser.fullName} - SportsFeed`,
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
      }).catch(() => {
        toast.success('Profile shared!');
      });
    }
  };

  const getVerificationBadge = () => {
    if (!otherUser.isVerified) return null;
    
    const badgeColor = otherUser.role === 'coach' ? 'text-purple-500' : 'text-blue-500';
    
    return (
      <svg className={`w-4 h-4 ${badgeColor}`} fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="flex items-center space-x-3 p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3 flex-1">
          <img
            src={otherUser.profileImage}
            alt={otherUser.fullName}
            className="h-10 w-10 rounded-full object-cover"
          />
          <div>
            <div className="flex items-center space-x-1">
              <h3 className="font-semibold text-gray-900">{otherUser.fullName}</h3>
              {getVerificationBadge()}
            </div>
            <p className="text-sm text-gray-500 capitalize">
              {otherUser.role} • {otherUser.sportsCategory.replace('-', ' ')}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleShareProfile}
          className="text-gray-400 hover:text-blue-500 transition-colors p-2 rounded-full hover:bg-gray-100"
          title="Share Profile"
        >
          <Share className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversationMessages.map((message) => {
          const isOwn = message.senderId === user?.id;
          
          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isOwn
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                  {new Date(message.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Upload image"
            aria-label="Upload image"
          >
            <Image className="h-5 w-5" />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Add emoji"
              aria-label="Add emoji"
            >
              <Smile className="h-5 w-5" />
            </button>
          </div>
          
          <VoiceMessageButton
            onTranscript={handleVoiceTranscript}
            disabled={isValidating}
            className="mr-2"
          />
          
          <button
            type="submit"
            disabled={!newMessage.trim() || isValidating}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white p-2 rounded-full transition-colors"
            title="Send message"
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}