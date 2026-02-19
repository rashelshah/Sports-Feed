import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Search, Plus, Inbox, Loader2 } from 'lucide-react';
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
  const { user, darkMode } = useAuthStore();
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
    <div className={`h-[calc(100vh-80px)] flex flex-col ${darkMode ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Header — hidden on mobile when chat is open */}
      <div className={`flex items-center justify-between p-4 border-b ${selectedConversationId ? 'hidden md:flex' : 'flex'
        } ${darkMode ? 'surface-2 border-white/5' : 'bg-white border-gray-200'}`}>
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Messages</h1>
          <p className={`text-sm ${darkMode ? 'text-white/50' : 'text-gray-600'}`}>Connect with your sports community</p>
        </div>
        <button
          onClick={() => setShowStartModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversations Sidebar — full width on mobile, fixed width on desktop */}
        <div
          className={`${selectedConversationId ? 'hidden md:flex' : 'flex'
            } w-full md:w-80 flex-col border-r ${darkMode ? 'surface-2 border-white/5' : 'bg-gray-50 border-gray-200'}`}
        >
          {/* Search */}
          <div className={`p-4 border-b ${darkMode ? 'border-white/5' : 'border-gray-200'}`}>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${darkMode ? 'text-white/40' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${darkMode
                  ? 'bg-white/5 border-white/10 text-white placeholder-white/40'
                  : 'bg-white border-gray-300 text-gray-900'
                  }`}
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
                <Inbox className={`h-12 w-12 mb-3 ${darkMode ? 'text-white/20' : 'text-gray-300'}`} />
                <p className={`font-medium ${darkMode ? 'text-white/50' : 'text-gray-500'}`}>No conversations yet</p>
                <p className={`text-sm mt-1 ${darkMode ? 'text-white/30' : 'text-gray-400'}`}>
                  Start a conversation with someone you follow
                </p>
                <button
                  onClick={() => setShowStartModal(true)}
                  className="mt-4 text-blue-500 hover:text-blue-400 font-medium"
                >
                  Start New Chat
                </button>
              </div>
            ) : (
              <div className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-gray-100'}`}>
                {filteredConversations.map((conversation) => {
                  const other = getOtherParticipant(conversation);
                  const isActive = selectedConversationId === conversation.id;

                  return (
                    <motion.button
                      key={conversation.id}
                      whileHover={{ backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' }}
                      onClick={async () => {
                        setIsSwitchingConversation(true);
                        setSelectedConversationId(conversation.id);

                        if (conversation.unread_count > 0) {
                          setConversations((prev: typeof conversations) => prev.map((c: typeof conversations[0]) =>
                            c.id === conversation.id
                              ? { ...c, unread_count: 0 }
                              : c
                          ));
                          await markMessagesAsRead(conversation.id, userId!);
                          refresh();
                        }

                        setTimeout(() => {
                          setIsSwitchingConversation(false);
                        }, 500);
                      }}
                      className={`w-full p-4 flex items-start space-x-3 transition-colors ${isActive
                        ? (darkMode ? 'bg-blue-900/20 border-l-4 border-blue-500' : 'bg-blue-50 border-l-4 border-blue-500')
                        : (darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50')
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
                          <h3 className={`font-semibold truncate ${isActive ? (darkMode ? 'text-blue-400' : 'text-blue-900') : (darkMode ? 'text-white' : 'text-gray-900')}`}>
                            {other?.full_name || 'Unknown'}
                          </h3>
                          {conversation.last_message_at && (
                            <span className={`text-xs ${darkMode ? 'text-white/40' : 'text-gray-400'}`}>
                              {formatTimeAgo(new Date(conversation.last_message_at))}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm capitalize ${darkMode ? 'text-white/50' : 'text-gray-500'}`}>{other?.role || 'User'}</p>
                        <p className={`text-sm truncate mt-1 ${darkMode ? 'text-white/70' : 'text-gray-600'}`}>
                          {conversation.last_message
                            ? (conversation.last_message.match(/^https?:\/\/.*\.(jpg|jpeg|png|gif|webp|svg)/i) ? '📷 Photo' : conversation.last_message)
                            : 'No messages yet'}
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
          <div className={`p-4 border-t ${darkMode ? 'border-white/5' : 'border-gray-200'}`}>
            <div className={`flex items-center justify-between text-sm ${darkMode ? 'text-white/50' : 'text-gray-600'}`}>
              <span>{conversations.length} conversations</span>
              <span>
                {conversations.reduce((acc, c) => acc + c.unread_count, 0)} unread
              </span>
            </div>
          </div>
        </div>

        {/* Chat Window — full screen on mobile when selected */}
        <div className={`flex-1 ${selectedConversationId ? 'flex' : 'hidden md:flex'} flex-col ${darkMode ? 'surface-1' : 'bg-white'}`}>
          {isSwitchingConversation ? (
            <div className={`h-full flex flex-col items-center justify-center p-8`}>
              <Loader2 className="h-12 w-12 mb-4 animate-spin text-blue-500" />
              <h3 className={`text-lg font-medium ${darkMode ? 'text-white/70' : 'text-gray-600'}`}>Loading messages...</h3>
            </div>
          ) : selectedConversation ? (
            <ChatWindow
              conversationId={selectedConversation.id}
              conversation={selectedConversation}
              onBack={() => setSelectedConversationId(null)}
              onArchive={() => setSelectedConversationId(null)}
            />
          ) : (
            /* Desktop only — empty state placeholder */
            <div className={`h-full hidden md:flex flex-col items-center justify-center p-8`}>
              <MessageCircle className={`h-24 w-24 mb-6 ${darkMode ? 'text-white/10' : 'text-gray-200'}`} />
              <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Select a conversation</h3>
              <p className={`text-center max-w-md mb-6 ${darkMode ? 'text-white/50' : 'text-gray-500'}`}>
                Choose a conversation from the sidebar or start a new one
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

      {/* Mobile FAB — floating action button for new chat (visible only on mobile when no chat selected) */}
      <div className={`md:hidden fixed bottom-6 right-6 z-40 ${selectedConversationId ? 'hidden' : ''}`}>
        <button
          onClick={() => setShowStartModal(true)}
          className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {showStartModal && (
        <StartConversationModal
          onClose={() => setShowStartModal(false)}
          onConversationCreated={(id) => {
            setSelectedConversationId(id);
            setShowStartModal(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}