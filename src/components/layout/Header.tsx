import { motion } from 'framer-motion';
import { Home, Search, Bell, MessageCircle, LogOut, MapPin } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSocketStore } from '../../store/socketStore';
import { useAppStore } from '../../store/appStore';

export function Header() {
  const { user, logout, darkMode } = useAuthStore();
  const { isConnected } = useSocketStore();
  const { currentView, setCurrentView, notifications } = useAppStore();

  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  const handleLogout = () => {
    logout();
  };

  const getVerificationBadge = () => {
    if (!user?.isVerified) return null;

    const badgeColor = user.role === 'coach' ? 'text-purple-500' : 'text-blue-500';

    return (
      <svg className={`w-5 h-5 ${badgeColor}`} fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  // Navigation items
  const navItems = [

    { key: 'home', label: 'Home', icon: <Home className="h-5 w-5" /> },
    { key: 'discover', label: 'Discover', icon: <Search className="h-5 w-5" /> },
    { key: 'notifications', label: 'Notifications', icon: <Bell className="h-5 w-5" />, badge: unreadNotifications },
    { key: 'messages', label: 'Messages', icon: <MessageCircle className="h-5 w-5" /> },
    {
      key: 'play', label: 'Play', icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
        </svg>
      )
    },
    { key: 'map', label: 'Map', icon: <MapPin className="h-5 w-5" /> },
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${darkMode ? 'navbar-glass' : 'bg-white border-b border-gray-200'} fixed top-0 left-0 right-0 z-50`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600">SportsFeed</h1>
            {isConnected && (
              <span className="ml-3 h-2 w-2 bg-green-500 rounded-full"></span>
            )}
          </div>

          {/* Navigation with active tab underline animation */}
          <nav className="hidden md:flex items-center space-x-6 relative">
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => setCurrentView(item.key as any)}
                className={`flex items-center space-x-2 transition-colors relative py-4 ${currentView === item.key
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-400 dark:opacity-70 hover:text-blue-600 dark:hover:text-blue-400 dark:hover:opacity-100'
                  }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
                {/* Active tab underline — smooth animated */}
                {currentView === item.key && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </nav>

          {/* User Profile */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentView('profile')}
              className={`flex items-center space-x-2 rounded-lg p-2 transition-colors ${user?.role === 'expert' ? '' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              <img
                src={user?.profileImage || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400'}
                alt={user?.fullName}
                className="h-8 w-8 rounded-full object-cover"
              />
              <div className="hidden sm:block">
                <div className="flex items-center space-x-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.fullName}
                  </p>
                  {getVerificationBadge()}

                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
              </div>
            </button>

            <button
              onClick={handleLogout}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

    </motion.header>
  );
}