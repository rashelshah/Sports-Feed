import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus } from 'lucide-react';
import { Conversation } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useSocketStore } from '../../store/socketStore';
import { useAppStore } from '../../store/appStore';
import { Button } from '../ui/Button';
import { CreateGroupModal } from './CreateGroupModal';

interface MessageListProps {
  onConversationSelect: (conversation: Conversation) => void;
}

export function MessageList({ onConversationSelect }: MessageListProps) {
  const { user } = useAuthStore();
  const { getConversations } = useAppStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  useEffect(() => {
    if (user) {
      // Get conversations from all sports categories for cross-sport interaction
      const userConversations = getConversations(user.id, 'all');
      setConversations(userConversations);
    }
  }, [user, getConversations]);

  const filteredConversations = conversations.filter(conv =>
    conv.participants.some(p => 
      p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <>
      <div className="h-full bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Messages</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCreateGroup(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="overflow-y-auto">
        {filteredConversations.map((conversation) => {
          const otherUser = conversation.participants[0];
          
          return (
            <motion.div
              key={conversation.id}
              whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
              onClick={() => onConversationSelect(conversation)}
              className="p-4 border-b border-gray-100 cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={otherUser.profileImage}
                    alt={otherUser.fullName}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  {conversation.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <p className="font-medium text-gray-900 truncate">{otherUser.fullName}</p>
                    {otherUser.isVerified && (
                      <svg className={`w-4 h-4 ${otherUser.role === 'coach' ? 'text-purple-500' : 'text-blue-500'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {conversation.lastMessage?.content || 'No messages yet'}
                  </p>
                </div>
                
                <div className="text-xs text-gray-500">
                  {conversation.lastMessage && 
                    new Date(conversation.lastMessage.createdAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  }
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>

      {showCreateGroup && (
        <CreateGroupModal onClose={() => setShowCreateGroup(false)} />
      )}
    </>
  );
}