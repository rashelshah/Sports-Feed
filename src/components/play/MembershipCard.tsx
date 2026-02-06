import React from 'react';
import { motion } from 'framer-motion';
import { Star, Check, Coins } from 'lucide-react';
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
  const { user } = useAuthStore();
  const { spendTokens } = useAppStore();

  const handlePurchase = () => {
    if (!user) return;

    if (userTokens.balance < membership.price) {
      toast.error(`Insufficient tokens! You need ${membership.price} tokens for this membership.`);
      return;
    }

    const success = spendTokens(
      user.id, 
      membership.price, 
      'spent', 
      `Purchased membership: ${membership.name}`
    );

    if (success) {
      toast.success(`Successfully purchased ${membership.name} membership!`);
    } else {
      toast.error('Failed to process purchase. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-purple-100"
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
              <p className="font-semibold text-gray-900">{membership.coach.fullName}</p>
              {membership.coach.isVerified && (
                <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className="text-sm text-gray-600 capitalize">{membership.coach.sportsCategory.replace('-', ' ')}</p>
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">What's Included:</h4>
          <ul className="space-y-2">
            {membership.benefits.map((benefit, index) => (
              <li key={index} className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-700 text-sm">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Duration */}
        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Duration:</span>
            <span className="font-semibold text-gray-900">{membership.duration} days</span>
          </div>
        </div>

        {/* Price and Purchase */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <span className="text-purple-700 font-medium">Price:</span>
            <div className="flex items-center space-x-1 text-purple-700 font-bold text-lg">
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
  );
}