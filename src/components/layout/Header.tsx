import { motion, AnimatePresence } from 'framer-motion';
import { Home, Search, Bell, MessageCircle, User, LogOut, MapPin, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useSocketStore } from '../../store/socketStore';
import { useAppStore } from '../../store/appStore';

export function Header() {
  const { user, logout } = useAuthStore();
  const { isConnected } = useSocketStore();
  const { currentView, setCurrentView, notifications } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const handleNavClick = (view: string) => {
    setCurrentView(view as any);
    setMobileMenuOpen(false);
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

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 w-full"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl sm:text-2xl font-bold text-blue-600">SportsFeed</h1>
            {isConnected && (
              <span className="ml-3 h-2 w-2 bg-green-500 rounded-full"></span>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-8">
            {user?.role === 'expert' && (
              <button 
                onClick={() => setCurrentView('expert')}
                className={`flex items-center space-x-2 transition-colors ${
                  currentView === 'expert' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                <User className="h-5 w-5" />
                <span className="hidden lg:inline">Expert Panel</span>
              </button>
            )}
            
            <button 
              onClick={() => setCurrentView('home')}
              className={`flex items-center space-x-2 transition-colors ${
                currentView === 'home' ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300 hover:text-blue-600'
              }`}
            >
              <Home className="h-5 w-5" />
              <span className="hidden lg:inline">Home</span>
            </button>
            
            <button 
              onClick={() => setCurrentView('discover')}
              className={`flex items-center space-x-2 transition-colors ${
                currentView === 'discover' ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300 hover:text-blue-600'
              }`}
            >
              <Search className="h-5 w-5" />
              <span className="hidden lg:inline">Discover</span>
            </button>
            
            <button 
              onClick={() => setCurrentView('notifications')}
              className={`flex items-center space-x-2 transition-colors relative ${
                currentView === 'notifications' ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300 hover:text-blue-600'
              }`}
            >
              <Bell className="h-5 w-5" />
              <span className="hidden lg:inline">Notifications</span>
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setCurrentView('messages')}
              className={`flex items-center space-x-2 transition-colors ${
                currentView === 'messages' ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300 hover:text-blue-600'
              }`}
            >
              <MessageCircle className="h-5 w-5" />
              <span className="hidden lg:inline">Messages</span>
            </button>

            <button
              onClick={() => setCurrentView('play')}
              className={`flex items-center space-x-2 transition-colors ${
                currentView === 'play' ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300 hover:text-blue-600'
              }`}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              <span className="hidden lg:inline">Play</span>
            </button>

            <button
              onClick={() => setCurrentView('map')}
              className={`flex items-center space-x-2 transition-colors ${
                currentView === 'map' ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300 hover:text-blue-600'
              }`}
            >
              <MapPin className="h-5 w-5" />
              <span className="hidden lg:inline">Map</span>
            </button>
          </nav>

          {/* User Profile & Mobile Menu Toggle */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button 
              onClick={() => setCurrentView('profile')}
              className="flex items-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
            >
              <img
                src={user?.profileImage || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400'}
                alt={user?.fullName}
                className="h-8 w-8 rounded-full object-cover"
              />
              <div className="hidden sm:block">
                <div className="flex items-center space-x-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[100px] lg:max-w-[150px]">
                    {user?.fullName}
                  </p>
                  {getVerificationBadge()}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
              </div>
            </button>
            
            <button
              onClick={handleLogout}
              className="hidden sm:block text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <nav className="px-4 py-2 space-y-1">
              {user?.role === 'expert' && (
                <button 
                  onClick={() => handleNavClick('expert')}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                    currentView === 'expert' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <User className="h-5 w-5" />
                  <span>Expert Panel</span>
                </button>
              )}
              
              <button 
                onClick={() => handleNavClick('home')}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                  currentView === 'home' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Home className="h-5 w-5" />
                <span>Home</span>
              </button>
              
              <button 
                onClick={() => handleNavClick('discover')}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                  currentView === 'discover' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Search className="h-5 w-5" />
                <span>Discover</span>
              </button>
              
              <button 
                onClick={() => handleNavClick('notifications')}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors relative ${
                  currentView === 'notifications' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
                {unreadNotifications > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {unreadNotifications}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => handleNavClick('messages')}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                  currentView === 'messages' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <MessageCircle className="h-5 w-5" />
                <span>Messages</span>
              </button>

              <button
                onClick={() => handleNavClick('play')}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                  currentView === 'play' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span>Play</span>
              </button>

              <button
                onClick={() => handleNavClick('map')}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                  currentView === 'map' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <MapPin className="h-5 w-5" />
                <span>Map</span>
              </button>

              <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}