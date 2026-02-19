import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Search, Bell, MessageCircle, LogOut, MapPin, X, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSocketStore } from '../../store/socketStore';
import { useAppStore } from '../../store/appStore';

export function Header() {
  const { user, logout, darkMode } = useAuthStore();
  const { isConnected } = useSocketStore();
  const { currentView, setCurrentView, notifications } = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  const handleLogout = () => {
    logout();
  };

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  // Close menu on route change
  const handleNav = (view: string) => {
    setCurrentView(view as any);
    setMenuOpen(false);
  };

  const getVerificationBadge = () => {
    if (!user?.isVerified) return null;
    const badgeColor = user.role === 'coach' ? 'text-purple-400' : 'text-blue-400';
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

  // Desktop nav items
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

  // Hamburger menu items (only nav actions, no profile)
  const mobileNavItems = [
    ...navItems,
    ...(user?.role === 'expert' ? [{ key: 'expert-panel', label: 'Expert Panel', icon: <ShieldCheck className="h-5 w-5" /> }] : []),
  ];

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${darkMode ? 'navbar-glass' : 'bg-white border-b border-gray-200 shadow-sm'} fixed top-0 left-0 right-0 z-50`}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">

            {/* Logo — TubeLight Feed */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <h1
                className={`text-xl font-bold tubelight-brand cursor-pointer ${darkMode ? 'text-white' : 'text-black'}`}
                onClick={() => setCurrentView('home' as any)}
              >
                TubeLight Feed
              </h1>
              {isConnected && (
                <span className="h-2 w-2 bg-green-500 rounded-full flex-shrink-0" />
              )}
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-5 relative">
              {navItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => setCurrentView(item.key as any)}
                  className={`flex items-center space-x-2 transition-colors relative py-4 ${currentView === item.key
                    ? darkMode ? 'text-white' : 'text-black'
                    : darkMode
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-600 hover:text-black'
                    }`}
                >
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                  {currentView === item.key && (
                    <motion.div
                      layoutId="activeTab"
                      className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${darkMode ? 'bg-white' : 'bg-black'}`}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              ))}
              {user?.role === 'expert' && (
                <button
                  onClick={() => setCurrentView('expert-panel' as any)}
                  className={`flex items-center space-x-2 transition-colors relative py-4 ${currentView === 'expert-panel'
                    ? darkMode ? 'text-white' : 'text-black'
                    : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
                    }`}
                >
                  <ShieldCheck className="h-5 w-5" />
                  <span className="text-sm font-medium">Expert Panel</span>
                  {currentView === 'expert-panel' && (
                    <motion.div
                      layoutId="activeTab"
                      className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${darkMode ? 'bg-white' : 'bg-black'}`}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              )}
            </nav>

            {/* Right: Avatar + Hamburger */}
            <div className="flex items-center gap-3">
              {/* Avatar — profile access */}
              <button
                onClick={() => setCurrentView('profile')}
                className="flex items-center gap-2 rounded-full p-1 transition-opacity hover:opacity-80"
              >
                <img
                  src={user?.profileImage || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400'}
                  alt={user?.fullName}
                  className="h-8 w-8 rounded-full object-cover border-2 border-white/20"
                />
                <div className="hidden sm:flex items-center gap-1">
                  <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user?.fullName?.split(' ')[0]}
                  </span>
                  {getVerificationBadge()}
                </div>
              </button>

              {/* Logout — desktop only */}
              <button
                onClick={handleLogout}
                className={`hidden lg:flex transition-opacity hover:opacity-70 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>

              {/* Hamburger — mobile only */}
              <button
                className="hamburger-btn lg:hidden"
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
              >
                <span />
                <span />
                <span />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu — rendered outside header to avoid z-index stacking context issues */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mobile-menu-overlay lg:hidden"
              onClick={() => setMenuOpen(false)}
            />

            {/* Slide-in Panel */}
            <motion.div
              ref={menuRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="mobile-menu-panel lg:hidden"
            >
              {/* Panel Header */}
              <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
                <span
                  className={`tubelight-brand text-lg font-bold cursor-pointer ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  onClick={() => handleNav('home')}
                >
                  TubeLight Feed
                </span>
                <button
                  onClick={() => setMenuOpen(false)}
                  className={`transition-colors rounded-lg p-1 ${darkMode ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-900 hover:bg-black/5'}`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Nav Links */}
              <nav className="flex flex-col py-2">
                {mobileNavItems.map(item => (
                  <button
                    key={item.key}
                    onClick={() => handleNav(item.key)}
                    className={`menu-link ${currentView === item.key ? 'active' : ''}`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-auto h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              {/* Logout at bottom */}
              <div className={`mt-auto border-t py-4 px-5 ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
                <button
                  onClick={handleLogout}
                  className={`flex items-center gap-3 transition-colors w-full min-h-[48px] font-medium ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}