import React from 'react';
import { motion } from 'framer-motion';
import { Home, Search, Bell, MessageCircle, User, LogOut, MapPin } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSocketStore } from '../../store/socketStore';
import { useAppStore } from '../../store/appStore';

export function Header() {
  const { user, logout } = useAuthStore();
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

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-b border-gray-200 sticky top-0 z-50"
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

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {user?.role === 'expert' && (
              <button 
                onClick={() => setCurrentView('expert')}
                className={`flex items-center space-x-2 transition-colors ${
                  currentView === 'expert' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                <User className="h-5 w-5" />
                <span>Expert Panel</span>
              </button>
            )}
            
            
            <button 
              onClick={() => setCurrentView('home')}
              className={`flex items-center space-x-2 transition-colors ${
                currentView === 'home' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              <Home className="h-5 w-5" />
              <span>Home</span>
            </button>
            
            <button 
              onClick={() => setCurrentView('discover')}
              className={`flex items-center space-x-2 transition-colors ${
                currentView === 'discover' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              <Search className="h-5 w-5" />
              <span>Discover</span>
            </button>
            
            <button 
              onClick={() => setCurrentView('notifications')}
              className={`flex items-center space-x-2 transition-colors relative ${
                currentView === 'notifications' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setCurrentView('messages')}
              className={`flex items-center space-x-2 transition-colors ${
                currentView === 'messages' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              <MessageCircle className="h-5 w-5" />
              <span>Messages</span>
            </button>

            <button
              onClick={() => setCurrentView('play')}
              className={`flex items-center space-x-2 transition-colors ${
                currentView === 'play' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              <span>Play</span>
            </button>

            <button
              onClick={() => setCurrentView('map')}
              className={`flex items-center space-x-2 transition-colors ${
                currentView === 'map' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              <MapPin className="h-5 w-5" />
              <span>Map</span>
            </button>
          </nav>

          {/* User Profile */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setCurrentView('profile')}
              className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg p-2 transition-colors"
            >
              <img
                src={user?.profileImage || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400'}
                alt={user?.fullName}
                className="h-8 w-8 rounded-full object-cover"
              />
              <div className="hidden sm:block">
                <div className="flex items-center space-x-1">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.fullName}
                  </p>
                  {getVerificationBadge()}
                </div>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </button>
            
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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