import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Check, Coins, X, ShieldCheck } from 'lucide-react';
import { Membership, UserTokens } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

interface MembershipCardProps {
  membership: Membership;
  userTokens: UserTokens;
}

export function MembershipCard({ membership, userTokens }: MembershipCardProps) {
  const { user, darkMode } = useAuthStore();
  const { spendTokens } = useAppStore();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = () => {
    if (!user) return;

    if (userTokens.balance < membership.price) {
      toast.error(`Insufficient tokens! You need ${membership.price} tokens for this membership.`);
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmPurchase = async () => {
    if (!user) return;
    setIsPurchasing(true);

    try {
      const success = spendTokens(
        user.id,
        membership.price,
        'spent',
        `Purchased membership: ${membership.name}`
      );

      if (success) {
        toast.success(`Successfully purchased ${membership.name} membership!`);
        setShowConfirmModal(false);
      } else {
        toast.error('Failed to process purchase. Please try again.');
      }
    } catch {
      toast.error('Failed to process purchase. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -5 }}
        className={`rounded-lg shadow-md overflow-hidden border-2 ${darkMode ? 'border-purple-900/50 bg-gray-800' : 'border-purple-100 bg-white'}`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold">{membership.name}</h3>
            <Star className="h-6 w-6" />
          </div>
          <p className="text-purple-100 text-sm">{membership.description}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Coach Info */}
          <div className="flex items-center space-x-3 mb-4">
            <img
              src={membership.coach.profileImage}
              alt={membership.coach.fullName}
              className="h-10 w-10 rounded-full object-cover"
            />
            <div>
              <div className="flex items-center space-x-1">
                <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{membership.coach.fullName}</p>
                {membership.coach.isVerified && (
                  <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className={`text-sm capitalize ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{membership.coach.sportsCategory.replace('-', ' ')}</p>
            </div>
          </div>

          {/* Benefits */}
          <div className="mb-6">
            <h4 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>What's Included:</h4>
            <ul className="space-y-2">
              {membership.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Duration */}
          <div className={`mb-6 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex justify-between items-center">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Duration:</span>
              <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{membership.duration} days</span>
            </div>
          </div>

          {/* Price and Purchase */}
          <div className="space-y-4">
            <div className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
              <span className={`font-medium ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>Price:</span>
              <div className={`flex items-center space-x-1 font-bold text-lg ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                <Coins className="h-5 w-5" />
                <span>{membership.price}</span>
              </div>
            </div>

            <Button
              onClick={handlePurchase}
              className="w-full"
              size="lg"
              variant="secondary"
              disabled={userTokens.balance < membership.price}
            >
              {userTokens.balance < membership.price ? (
                'Insufficient Tokens'
              ) : (
                <>
                  <Coins className="h-4 w-4 mr-2" />
                  Purchase Membership
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`rounded-xl shadow-2xl p-6 max-w-sm w-full ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Confirm Membership Purchase
                </h3>
                <button onClick={() => setShowConfirmModal(false)} className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className={`flex items-center space-x-3 mb-4 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <ShieldCheck className="h-8 w-8 text-purple-500" />
                <div>
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{membership.name}</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>by {membership.coach.fullName}</p>
                </div>
              </div>

              <div className={`rounded-lg p-3 mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Cost:</span>
                  <span className="flex items-center text-yellow-500 font-bold">
                    <Coins className="h-4 w-4 mr-1" />
                    {membership.price} tokens
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Duration:</span>
                  <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{membership.duration} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Your Balance:</span>
                  <span className={`font-bold ${userTokens.balance >= membership.price ? 'text-green-500' : 'text-red-500'}`}>
                    {userTokens.balance} tokens
                  </span>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowConfirmModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmPurchase}
                  variant="primary"
                  className="flex-1"
                  disabled={isPurchasing}
                >
                  {isPurchasing ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Coins className="h-4 w-4 mr-1" />
                      Confirm Purchase
                    </span>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}