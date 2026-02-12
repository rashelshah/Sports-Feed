import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Users, Search, Plus, Inbox, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useConversations, markMessagesAsRead } from '../../hooks/useMessaging';
import { ChatWindow } from './ChatWindow';
import { StartConversationModal } from './StartConversationModal';

// Simple date formatter to replace date-fns
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  return date.toLocaleDateString();
};

export function MessagesPage() {
  const { user } = useAuthStore();
  const { conversations, isLoading, refresh, setConversations } = useConversations();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSwitchingConversation, setIsSwitchingConversation] = useState(false);

  const userId = user?.id;

  // Get selected conversation
  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  );

  // Get other participant for display
  const getOtherParticipant = (conversation: typeof conversations[0]) => {
    return conversation.participants.find((p) => p.user_id !== userId)?.profile;
  };

  // Filter conversations by search
  const filteredConversations = searchQuery
    ? conversations.filter((c) => {
        const other = getOtherParticipant(c);
        return (
          other?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          other?.username?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      })
    : conversations;

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 text-sm">Connect with your sports community</p>
        </div>
        <button
          onClick={() => setShowStartModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversations Sidebar */}
        <div
          className={`${
            selectedConversationId ? 'hidden md:flex' : 'flex'
          } w-full md:w-80 flex-col bg-gray-50 border-r border-gray-200`}
        >
          {/* Search */}
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <Inbox className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No conversations yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Start a conversation with someone you follow
                </p>
                <button
                  onClick={() => setShowStartModal(true)}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Start New Chat
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredConversations.map((conversation) => {
                  const other = getOtherParticipant(conversation);
                  const isActive = selectedConversationId === conversation.id;

                  return (
                    <motion.button
                      key={conversation.id}
                      whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                      onClick={async () => {
                        // Show loading state immediately
                        setIsSwitchingConversation(true);
                        setSelectedConversationId(conversation.id);
                        
                        // Clear unread count immediately in UI for better UX
                        if (conversation.unread_count > 0) {
                          // Optimistically update local state to remove badge immediately
                          setConversations((prev: typeof conversations) => prev.map((c: typeof conversations[0]) => 
                            c.id === conversation.id 
                              ? { ...c, unread_count: 0 }
                              : c
                          ));
                          // Then sync with backend
                          await markMessagesAsRead(conversation.id, userId!);
                          refresh(); // Refresh conversations to ensure sync
                        }
                        
                        // Keep loading state for a short time to ensure messages are loaded
                        setTimeout(() => {
                          setIsSwitchingConversation(false);
                        }, 500);
                      }}
                      className={`w-full p-4 flex items-start space-x-3 transition-colors ${
                        isActive ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
                      }`}
                    >
                      <img
                        src={
                          other?.profile_image ||
                          'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400'
                        }
                        alt={other?.full_name}
                        className="h-12 w-12 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {other?.full_name || 'Unknown'}
                          </h3>
                          {conversation.last_message_at && (
                            <span className="text-xs text-gray-400">
                              {formatTimeAgo(new Date(conversation.last_message_at))}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 capitalize">{other?.role || 'User'}</p>
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {conversation.last_message || 'No messages yet'}
                        </p>
                      </div>
                      {conversation.unread_count > 0 && (
                        <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                          {conversation.unread_count}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{conversations.length} conversations</span>
              <span>
                {conversations.reduce((acc, c) => acc + c.unread_count, 0)} unread
              </span>
            </div>
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 bg-white">
          {isSwitchingConversation ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
              <Loader2 className="h-12 w-12 mb-4 animate-spin text-blue-500" />
              <h3 className="text-lg font-medium text-gray-600">Loading messages...</h3>
            </div>
          ) : selectedConversation ? (
            <ChatWindow
              conversationId={selectedConversation.id}
              conversation={selectedConversation}
              onBack={() => setSelectedConversationId(null)}
              onArchive={() => setSelectedConversationId(null)}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
              <MessageCircle className="h-24 w-24 mb-6 text-gray-200" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-center max-w-md mb-6">
                Choose a conversation from the sidebar or start a new one to begin messaging
              </p>
              <button
                onClick={() => setShowStartModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start New Conversation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {conversations.length === 0 && !selectedConversationId && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-lg shadow-md p-6 cursor-pointer border border-gray-200 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Group Chats</h3>
            </div>
            <p className="text-sm text-gray-600">
              Create or join group conversations with your sports community.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-lg shadow-md p-6 cursor-pointer border border-gray-200 hover:border-green-300 transition-colors"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Search className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Find People</h3>
            </div>
            <p className="text-sm text-gray-600">
              Discover athletes and coaches in your area and sports category.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-lg shadow-md p-6 cursor-pointer border border-gray-200 hover:border-purple-300 transition-colors"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageCircle className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Quick Chat</h3>
            </div>
            <p className="text-sm text-gray-600">
              Start instant conversations with verified coaches and experts.
            </p>
          </motion.div>
        </div>
      )}

      {showStartModal && (
        <StartConversationModal
          onClose={() => setShowStartModal(false)}
          onConversationCreated={(id) => {
            setSelectedConversationId(id);
            setShowStartModal(false);
          }}
        />
      )}
    </div>
  );
}