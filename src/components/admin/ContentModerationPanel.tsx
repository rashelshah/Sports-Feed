import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, XCircle, Activity } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface ModerationStats {
  totalModerated: number;
  blockedContent: number;
  warnedContent: number;
  passedContent: number;
  languagesDetected: number;
}

export function ContentModerationPanel() {
  const { darkMode } = useAuthStore();
  const [stats] = useState<ModerationStats>({
    totalModerated: 1234,
    blockedContent: 45,
    warnedContent: 89,
    passedContent: 1100,
    languagesDetected: 12,
  });

  const recentModerations = [
    { id: '1', type: 'block', content: 'Post with inappropriate language', severity: 'critical', time: '2 min ago' },
    { id: '2', type: 'warn', content: 'Message flagged for review', severity: 'medium', time: '5 min ago' },
    { id: '3', type: 'block', content: 'Video with offensive content', severity: 'high', time: '8 min ago' },
    { id: '4', type: 'pass', content: 'Clean post', severity: 'low', time: '10 min ago' },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return darkMode ? 'text-red-400 bg-red-900/30' : 'text-red-600 bg-red-50';
      case 'high':
        return darkMode ? 'text-orange-400 bg-orange-900/30' : 'text-orange-600 bg-orange-50';
      case 'medium':
        return darkMode ? 'text-yellow-400 bg-yellow-900/30' : 'text-yellow-600 bg-yellow-50';
      default:
        return darkMode ? 'text-green-400 bg-green-900/30' : 'text-green-600 bg-green-50';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'block':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-6 ${darkMode ? 'bg-gray-900 min-h-screen p-6' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
            <Shield className={`h-6 w-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Content Moderation</h2>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>AI-powered content filtering and abuse detection</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-lg shadow-md p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <div className="flex items-center justify-between mb-4">
            <Activity className="h-8 w-8 text-blue-500" />
          </div>
          <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalModerated.toLocaleString()}</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Moderated</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-lg shadow-md p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <div className="flex items-center justify-between mb-4">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.blockedContent}</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Blocked Content</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-lg shadow-md p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
          <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.warnedContent}</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Warned Content</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`rounded-lg shadow-md p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.passedContent}</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Passed Content</p>
        </motion.div>
      </div>

      {/* Features List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>AI Capabilities</h3>
          <ul className="space-y-3">
            <li className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Voice-to-Text Transcription</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Automatic transcription for accessibility</p>
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Multilingual Content Filtering</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Detects and filters content in 50+ languages</p>
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Abuse Detection System</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Real-time content moderation and safety checks</p>
              </div>
            </li>
          </ul>
        </div>

        <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Detection Accuracy</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Abuse Detection</span>
                <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>95%</span>
              </div>
              <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div className="bg-red-500 h-2 rounded-full w-[95%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Language Detection</span>
                <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>98%</span>
              </div>
              <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div className="bg-blue-500 h-2 rounded-full w-[98%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Voice Transcription</span>
                <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>87%</span>
              </div>
              <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div className="bg-green-500 h-2 rounded-full w-[87%]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Moderations */}
      <div className={`rounded-lg shadow-md overflow-hidden ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Moderations</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {recentModerations.map((item, index) => (
            <div key={item.id} className={`p-4 flex items-center space-x-4 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
              <div className="flex-shrink-0">
                {getActionIcon(item.type)}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.content}</p>
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.time}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(item.severity)}`}>
                {item.severity}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className={`rounded-lg p-4 ${darkMode ? 'bg-blue-900/30 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
        <div className="flex items-start space-x-3">
          <Activity className={`h-5 w-5 mt-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <div>
            <h4 className={`text-sm font-medium mb-1 ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>How It Works</h4>
            <p className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
              Our AI-powered moderation system analyzes all content (messages, posts, and uploads) in real-time using advanced natural language processing. 
              It detects inappropriate content, filters multilingual text, and transcribes voice messages for accessibility. 
              The system continuously learns and improves to maintain a safe community environment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

