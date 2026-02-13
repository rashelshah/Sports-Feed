import { useState } from 'react';
import { X, Search, Send } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useMessageableUsers, findOrCreateDirectConversation } from '../../hooks/useMessaging';
import toast from 'react-hot-toast';

interface StartConversationModalProps {
  onClose: () => void;
  onConversationCreated?: (conversationId: string) => void;
}

export function StartConversationModal({ onClose, onConversationCreated }: StartConversationModalProps) {
  const { user, darkMode } = useAuthStore();
  const [query, setQuery] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  
  const { users: candidates, isLoading } = useMessageableUsers(query, true);

  const startChat = async (targetUserId: string) => {
    if (!user) return;
    
    setIsStarting(true);
    
    try {
      // Find or create conversation
      const conversationId = await findOrCreateDirectConversation(user.id, targetUserId);
      
      if (!conversationId) {
        toast.error('Unable to start conversation. You may need to follow this user first.');
        return;
      }
      
      // Notify parent component
      onConversationCreated?.(conversationId);
      
      toast.success('Conversation started!');
      onClose();
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`rounded-lg shadow-xl w-full max-w-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
        <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Start New Conversation</h3>
          <button onClick={onClose} className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`} title="Close" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="relative">
            <Search className={`h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users by name or username"
              className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'border-gray-300'
              }`}
            />
          </div>

          <div className={`max-h-80 overflow-y-auto divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : candidates.length === 0 ? (
              <p className={`text-sm text-center py-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {query.trim() ? 'No users found. Try a different search.' : 'No users to message. Follow some users first!'}
              </p>
            ) : (
              candidates.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3">
                  <img src={u.profile_image} alt={u.full_name} className="h-10 w-10 rounded-full object-cover" />
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{u.full_name}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>@{u.username} • {u.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => startChat(u.id)}
                  disabled={isStarting}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                  <span>{isStarting ? 'Starting...' : 'Start'}</span>
                </button>
              </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


