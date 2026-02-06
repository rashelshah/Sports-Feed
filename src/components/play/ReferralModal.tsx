import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Gift, Copy, Share, Users } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

interface ReferralModalProps {
  onClose: () => void;
  userId: string;
}

export function ReferralModal({ onClose, userId }: ReferralModalProps) {
  const { addTokens } = useAppStore();
  const [referralCode] = useState(`SPORT${userId.slice(-4).toUpperCase()}`);
  const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard!');
    });
  };

  const shareReferral = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join SportsFeed',
        text: 'Join me on SportsFeed and get 50 free tokens!',
        url: referralLink,
      }).catch(() => {
        // Fallback to clipboard if share fails
        copyToClipboard(referralLink);
      });
    } else {
      copyToClipboard(referralLink);
    }
  };

  const simulateReferral = () => {
    // Simulate a successful referral
    addTokens(userId, 50, 'earned', 'Friend joined using your referral code');
    toast.success('Congratulations! You earned 50 tokens from a referral!');
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
          <h2 className="text-xl font-bold text-gray-900">Refer Friends</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-4 w-16 h-16 mx-auto mb-4">
              <Gift className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Earn 50 Tokens per Referral!
            </h3>
            <p className="text-gray-600 text-sm">
              Invite friends to join SportsFeed and both of you get 50 tokens when they sign up.
            </p>
          </div>

          <div className="space-y-4">
            {/* Referral Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Referral Code
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={referralCode}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-center font-mono font-bold"
                />
                <Button
                  onClick={() => copyToClipboard(referralCode)}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Referral Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referral Link
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                />
                <Button
                  onClick={() => copyToClipboard(referralLink)}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Share Button */}
            <Button
              onClick={shareReferral}
              className="w-full"
              size="lg"
            >
              <Share className="h-4 w-4 mr-2" />
              Share Referral Link
            </Button>

            {/* Demo Button */}
            <Button
              onClick={simulateReferral}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <Users className="h-4 w-4 mr-2" />
              Simulate Referral (Demo)
            </Button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">How it works:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>1. Share your referral code or link</li>
              <li>2. Friend signs up using your code</li>
              <li>3. Both of you get 50 tokens instantly!</li>
              <li>4. No limit on referrals</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}