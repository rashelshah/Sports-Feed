import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { darkMode, toggleDarkMode } = useAuthStore();
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
  });

  // Font scale state — read from localStorage on mount
  const [fontScale, setFontScale] = useState(() => {
    const saved = localStorage.getItem('fontScale');
    return saved ? Math.min(1.15, Math.max(0.9, parseFloat(saved))) : 1;
  });
  const [isSliding, setIsSliding] = useState(false);

  // Apply font scale live as user drags
  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', String(fontScale));
  }, [fontScale]);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDarkModeToggle = () => {
    toggleDarkMode();
  };

  const handleFontScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const clamped = Math.min(1.15, Math.max(0.9, value));
    setFontScale(clamped);
  };



  const handleSave = () => {
    // Persist font scale to localStorage
    localStorage.setItem('fontScale', String(fontScale));
    toast.success('Settings saved successfully!');
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`rounded-2xl shadow-xl max-w-md w-full ${darkMode ? 'glass clay-soft' : 'bg-white clay-soft-light'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <span className="text-gray-700 dark:text-gray-300 font-medium">Push Notifications</span>
            <button
              onClick={() => handleToggle('pushNotifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.pushNotifications ? 'bg-blue-500' : 'bg-gray-300'
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <span className="text-gray-700 dark:text-gray-300 font-medium">Email Notifications</span>
            <button
              onClick={() => handleToggle('emailNotifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.emailNotifications ? 'bg-blue-500' : 'bg-gray-300'
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>

          {/* Text Size Control — replaces Privacy Mode */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-700 dark:text-gray-300 font-medium">⚙️ Text Size Control</span>
              <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                {Math.round(fontScale * 100)}%
              </span>
            </div>

            {/* Custom Slider */}
            <input
              type="range"
              min="0.9"
              max="1.15"
              step="0.01"
              value={fontScale}
              onChange={handleFontScaleChange}
              onMouseDown={() => setIsSliding(true)}
              onMouseUp={() => setIsSliding(false)}
              onTouchStart={() => setIsSliding(true)}
              onTouchEnd={() => setIsSliding(false)}
              className={`text-size-slider w-full ${isSliding ? 'slider-active' : ''}`}
            />
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <span className="text-gray-700 dark:text-gray-300 font-medium">Dark Mode</span>
            <button
              onClick={handleDarkModeToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${darkMode ? 'bg-blue-500' : 'bg-gray-300'
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>
        </div>

        <div className="p-6 pt-0">
          <Button onClick={handleSave} className="w-full btn-press">
            Save Settings
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
