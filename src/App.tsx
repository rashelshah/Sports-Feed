import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { useAuthStore } from './store/authStore';
import { TokenPurchaseSuccess } from './components/play/TokenPurchaseSuccess';
import { TokenPurchaseCancel } from './components/play/TokenPurchaseCancel';

function App() {
  const { isAuthenticated, isInitialized, initSession, darkMode } = useAuthStore();

  useEffect(() => {
    initSession();
  }, [initSession]);

  // Restore font scale from localStorage on app load
  useEffect(() => {
    const savedScale = localStorage.getItem('fontScale');
    if (savedScale) {
      const scale = Math.min(1.15, Math.max(0.9, parseFloat(savedScale)));
      document.documentElement.style.setProperty('--font-scale', String(scale));
    }
  }, []);

  // Apply dark mode class on mount and when darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  if (!isInitialized) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-black' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className={`min-h-screen ${darkMode ? 'dark bg-black' : 'bg-gray-50'}`}>
        <Routes>
          <Route
            path="/auth"
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage />
            }
          />
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? <Dashboard /> : <Navigate to="/auth" replace />
            }
          />
          <Route
            path="/"
            element={
              <Navigate to={isAuthenticated ? "/dashboard" : "/auth"} replace />
            }
          />
          <Route path="/tokens/success" element={<TokenPurchaseSuccess />} />
          <Route path="/tokens/cancel" element={<TokenPurchaseCancel />} />
        </Routes>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: darkMode ? '#1f2937' : '#fff',
              color: darkMode ? '#f3f4f6' : '#374151',
              borderRadius: '8px',
              border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;