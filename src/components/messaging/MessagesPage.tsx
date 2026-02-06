import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Users, Search, Plus } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { StartConversationModal } from './StartConversationModal';

export function MessagesPage() {
  const { user } = useAuthStore();
  const [showStartModal, setShowStartModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600">Connect with your sports community</p>
        </div>
        <button onClick={() => setShowStartModal(true)} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Messages Content */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-12">
          <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
          <p className="text-gray-600 mb-6">
            Start a conversation with other athletes, coaches, and sports enthusiasts.
          </p>
          <div className="space-y-4">
            <button onClick={() => setShowStartModal(true)} className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Start New Conversation
            </button>
            <div className="text-sm text-gray-500">
              Connect with users from your sports category: <span className="font-medium capitalize">{user?.sportsCategory}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <p className="text-sm text-gray-600">Create or join group conversations with your sports community.</p>
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
          <p className="text-sm text-gray-600">Discover athletes and coaches in your area and sports category.</p>
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
          <p className="text-sm text-gray-600">Start instant conversations with verified coaches and experts.</p>
        </motion.div>
      </div>
    {showStartModal && (
      <StartConversationModal onClose={() => setShowStartModal(false)} />
    )}
    </div>
  );
}