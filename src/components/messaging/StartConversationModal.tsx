import React, { useMemo, useState } from 'react';
import { X, Search, Send } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';

interface StartConversationModalProps {
  onClose: () => void;
}

export function StartConversationModal({ onClose }: StartConversationModalProps) {
  const { user } = useAuthStore();
  const { getFilteredUsers, addMessage, addNotification } = useAppStore();
  const [query, setQuery] = useState('');

  const candidates = useMemo(() => {
    if (!user) return [] as any[];
    const list = getFilteredUsers(user.sportsCategory);
    return list.filter(u => u.id !== user.id && (
      u.fullName.toLowerCase().includes(query.toLowerCase()) ||
      u.username.toLowerCase().includes(query.toLowerCase())
    ));
  }, [user, getFilteredUsers, query]);

  const startChat = (targetUserId: string) => {
    if (!user) return;
    const message = {
      id: Date.now().toString(),
      senderId: user.id,
      receiverId: targetUserId,
      content: 'Hi! 👋',
      type: 'text' as const,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    addMessage(message);
    addNotification({
      id: (Date.now() + 1).toString(),
      userId: targetUserId,
      type: 'comment',
      message: `${user.fullName} started a chat with you`,
      isRead: false,
      createdAt: new Date().toISOString(),
      fromUser: user,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Start New Conversation</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" title="Close" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users by name or username"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {candidates.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3">
                  <img src={u.profileImage} alt={u.fullName} className="h-10 w-10 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{u.fullName}</p>
                    <p className="text-xs text-gray-500">@{u.username} • {u.sportsCategory.replace('-', ' ')}</p>
                  </div>
                </div>
                <button
                  onClick={() => startChat(u.id)}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                  <span>Start</span>
                </button>
              </div>
            ))}
            {candidates.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-6">No users found. Try a different search.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


