import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Play, Coins, Clock } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

interface WatchAdModalProps {
  onClose: () => void;
  userId: string;
}

export function WatchAdModal({ onClose, userId }: WatchAdModalProps) {
  const { watchAd } = useAppStore();
  const [isWatching, setIsWatching] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [adCompleted, setAdCompleted] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isWatching && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setAdCompleted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWatching, countdown]);

  const startWatchingAd = () => {
    setIsWatching(true);
    setCountdown(15);
  };

  const claimReward = () => {
    watchAd(userId);
    toast.success('Congratulations! You earned 10 tokens!');
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
        className="bg-white rounded-lg shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Watch Ad for Tokens</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {!isWatching && !adCompleted && (
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <Coins className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Earn 10 Free Tokens!
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                Watch a short 15-second advertisement to earn tokens and unlock premium content.
              </p>
              
              <Button
                onClick={startWatchingAd}
                className="w-full"
                size="lg"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Watching Ad
              </Button>
            </div>
          )}

          {isWatching && !adCompleted && (
            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-8 mb-6">
                <div className="text-white">
                  <h3 className="text-xl font-bold mb-2">SportsFeed Premium</h3>
                  <p className="text-sm opacity-90 mb-4">
                    Unlock unlimited access to premium training videos from top coaches worldwide!
                  </p>
                  <div className="bg-white bg-opacity-20 rounded-lg p-3">
                    <p className="text-lg font-semibold">Join thousands of athletes</p>
                    <p className="text-sm">Transform your training today</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Clock className="h-5 w-5 text-gray-500" />
                <span className="text-lg font-bold text-gray-900">{countdown}s</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${((15 - countdown) / 15) * 100}%` }}
                />
              </div>
            </div>
          )}

          {adCompleted && (
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <Coins className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ad Complete! 🎉
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                Thank you for watching! You've earned 10 tokens.
              </p>
              
              <Button
                onClick={claimReward}
                className="w-full"
                size="lg"
              >
                <Coins className="h-4 w-4 mr-2" />
                Claim 10 Tokens
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}