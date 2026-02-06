import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, Plus, TrendingUp, Gift } from 'lucide-react';
import { UserTokens } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { Button } from '../ui/Button';
import { PurchaseTokensModal } from './PurchaseTokensModal';
import { ReferralModal } from './ReferralModal';

interface TokenWalletProps {
  tokens: UserTokens;
}

export function TokenWallet({ tokens }: TokenWalletProps) {
  const { user } = useAuthStore();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);

  return (
    <>
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white min-w-[280px]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Coins className="h-5 w-5" />
            <span className="font-medium">Token Wallet</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowPurchaseModal(true)}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-1 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowReferralModal(true)}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-1 transition-colors"
            >
              <Gift className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-blue-100">Balance:</span>
            <span className="text-2xl font-bold">{tokens.balance}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 text-green-200">
                <TrendingUp className="h-3 w-3" />
                <span>Earned</span>
              </div>
              <div className="font-semibold">{tokens.totalEarned}</div>
            </div>
            <div className="text-center">
              <div className="text-red-200">Spent</div>
              <div className="font-semibold">{tokens.totalSpent}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Tokens Modal */}
      {showPurchaseModal && (
        <PurchaseTokensModal
          onClose={() => setShowPurchaseModal(false)}
          userId={user?.id || ''}
        />
      )}

      {/* Referral Modal */}
      {showReferralModal && (
        <ReferralModal
          onClose={() => setShowReferralModal(false)}
          userId={user?.id || ''}
        />
      )}
    </>
  );
}