import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, XCircle, Activity } from 'lucide-react';

interface ModerationStats {
  totalModerated: number;
  blockedContent: number;
  warnedContent: number;
  passedContent: number;
  languagesDetected: number;
}

export function ContentModerationPanel() {
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
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-green-600 bg-green-50';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Content Moderation</h2>
            <p className="text-gray-600">AI-powered content filtering and abuse detection</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <Activity className="h-8 w-8 text-blue-500" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{stats.totalModerated.toLocaleString()}</h3>
          <p className="text-sm text-gray-600">Total Moderated</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{stats.blockedContent}</h3>
          <p className="text-sm text-gray-600">Blocked Content</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{stats.warnedContent}</h3>
          <p className="text-sm text-gray-600">Warned Content</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{stats.passedContent}</h3>
          <p className="text-sm text-gray-600">Passed Content</p>
        </motion.div>
      </div>

      {/* Features List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Capabilities</h3>
          <ul className="space-y-3">
            <li className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Voice-to-Text Transcription</p>
                <p className="text-xs text-gray-600">Automatic transcription for accessibility</p>
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Multilingual Content Filtering</p>
                <p className="text-xs text-gray-600">Detects and filters content in 50+ languages</p>
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Abuse Detection System</p>
                <p className="text-xs text-gray-600">Real-time content moderation and safety checks</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detection Accuracy</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Abuse Detection</span>
                <span className="font-semibold text-gray-900">95%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full w-[95%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Language Detection</span>
                <span className="font-semibold text-gray-900">98%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full w-[98%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Voice Transcription</span>
                <span className="font-semibold text-gray-900">87%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full w-[87%]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Moderation Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentModerations.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {getActionIcon(item.type)}
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.content}</p>
                  <p className="text-xs text-gray-500">{item.time}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(item.severity)}`}>
                {item.severity}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">How It Works</h4>
            <p className="text-sm text-blue-700">
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

