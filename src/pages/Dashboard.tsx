import React, { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { Feed } from '../components/feed/Feed';
import { UserProfile } from '../components/profile/UserProfile';
import { MessagesPage } from '../components/messaging/MessagesPage';
import { DiscoverPage } from '../components/discover/DiscoverPage';
import { NotificationsPage } from '../components/notifications/NotificationsPage';
import { ExpertDashboard } from '../components/expert/ExpertDashboard';
import { PlayPage } from '../components/play/PlayPage';
import { MapPage } from '../components/map/MapPage';
import { useAuthStore } from '../store/authStore';
import { useSocketStore } from '../store/socketStore';
import { useAppStore } from '../store/appStore';

export function Dashboard() {
  const { user } = useAuthStore();
  const { connect } = useSocketStore();
  const { currentView } = useAppStore();


  useEffect(() => {
    if (user) {
      connect(user.id);
    }
  }, [user, connect]);

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
        case 'expert':
          return <ExpertDashboard />;
        case 'play':
          return <PlayPage />;
        case 'map':
          return <MapPage />;
        default:
          return <Feed />;
      }
    } catch (error) {
      console.error('Error rendering content:', error);
      return (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to SportsFeed!</h2>
          <p className="text-gray-600 mb-4">You are successfully logged in as: {user?.fullName}</p>
          <p className="text-gray-600 mb-4">Role: {user?.role}</p>
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800">Dashboard is loading... If you see this message, the main components are being loaded.</p>
          </div>
        </div>
      );
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h2>
          <p className="text-gray-600">Please wait while we load your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Main Content */}
      <main className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}