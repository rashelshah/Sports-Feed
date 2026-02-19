import { useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { Feed } from '../components/feed/Feed';
import { UserProfile } from '../components/profile/UserProfile';
import { MessagesPage } from '../components/messaging/MessagesPage';
import { DiscoverPage } from '../components/discover/DiscoverPage';
import { NotificationsPage } from '../components/notifications/NotificationsPage';
import { PlayPage } from '../components/play/PlayPage';
import { MapPage } from '../components/map/MapPage';
import { ExpertDashboard } from '../components/expert/ExpertDashboard';
import { useAuthStore } from '../store/authStore';
import { useSocketStore } from '../store/socketStore';
import { useAppStore } from '../store/appStore';

export function Dashboard() {
  const { user, darkMode } = useAuthStore();
  const { connect } = useSocketStore();
  const { currentView, fetchNotifications } = useAppStore();

  useEffect(() => {
    if (user) {
      connect(user.id);
      fetchNotifications();
    }
  }, [user, connect, fetchNotifications]);

  const renderContent = () => {
    try {
      switch (currentView) {
        case 'home':
          return <Feed />;
        case 'discover':
          return <DiscoverPage />;
        case 'notifications':
          return <NotificationsPage />;
        case 'messages':
          return <MessagesPage />;
        case 'profile':
          return <UserProfile />;
        case 'play':
          return <PlayPage />;
        case 'map':
          return <MapPage />;
        case 'expert-panel':
          return user?.role === 'expert' ? <ExpertDashboard /> : <Feed />;
        default:
          return <Feed />;
      }
    } catch (error) {
      console.error('Error rendering content:', error);
      return (
        <div className="p-8 text-center">
          <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Welcome to TubeLight Feed!</h2>
          <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>You are successfully logged in as: {user?.fullName}</p>
          <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Role: {user?.role}</p>
          <div className={`mt-8 p-4 rounded-lg ${darkMode ? 'bg-white/5 border border-white/10' : 'bg-blue-50'}`}>
            <p className={darkMode ? 'text-gray-300' : 'text-blue-800'}>Dashboard is loading...</p>
          </div>
        </div>
      );
    }
  };

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-black' : 'bg-gray-50'}`}>
        <div className="text-center">
          <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Loading...</h2>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Please wait while we load your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-black' : 'bg-gray-50'}`}>
      <Header />
      <main className="pt-24 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}