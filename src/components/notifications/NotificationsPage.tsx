import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Heart, UserPlus, UserMinus, Shield, MessageCircle, Share2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import toast from 'react-hot-toast';

export function NotificationsPage() {
  const { user, darkMode } = useAuthStore();
  const { notifications, markNotificationAsRead, fetchNotifications, setCurrentView } = useAppStore();

  // Fetch notifications from API on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Filter notifications for current user
  const userNotifications = notifications.filter(notification =>
    notification.userId === user?.id
  );

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'follow':
        return <UserPlus className="h-5 w-5 text-blue-500" />;
      case 'unfollow':
        return <UserMinus className="h-5 w-5 text-orange-500" />;
      case 'comment':
        return <MessageCircle className="h-5 w-5 text-green-500" />;
      case 'share':
        return <Share2 className="h-5 w-5 text-indigo-500" />;
      case 'verification':
        return <Shield className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleNotificationClick = (notification: { id: string; type: string; postId?: string; fromUser?: any }) => {
    markNotificationAsRead(notification.id);

    // Navigate to relevant content based on notification type
    switch (notification.type) {
      case 'like':
      case 'comment':
      case 'share':
        // Navigate to home feed where the post is visible
        setCurrentView('home');
        toast.success('Navigated to your feed');
        break;
      case 'follow':
      case 'unfollow':
        // Navigate to discover to see the user
        setCurrentView('discover');
        break;
      case 'message':
        // Navigate to messages
        setCurrentView('messages');
        break;
      default:
        break;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className={`rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h1 className={`text-2xl font-bold flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <Bell className="h-6 w-6 mr-3 text-blue-600" />
            Notifications
          </h1>
        </div>

        <div className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
          {userNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className={`h-12 w-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>No notifications</h3>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>You're all caught up!</p>
            </div>
          ) : (
            userNotifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' }}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 cursor-pointer transition-colors ${!notification.isRead ? (darkMode ? 'bg-blue-900/20' : 'bg-blue-50') : ''
                  }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {notification.fromUser ? (
                      <img
                        src={notification.fromUser.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(notification.fromUser.fullName || 'U')}&background=random`}
                        alt={notification.fromUser.fullName}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.isRead ? 'font-medium' : ''} ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {notification.message}
                    </p>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {new Date(notification.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {!notification.isRead && (
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}