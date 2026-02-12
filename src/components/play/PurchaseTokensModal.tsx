import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Coins, CreditCard } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

interface PurchaseTokensModalProps {
  onClose: () => void;
  userId: string;
}

const tokenPackages = [
  { tokens: 100, price: 4.99, bonus: 0, popular: false },
  { tokens: 250, price: 9.99, bonus: 25, popular: false },
  { tokens: 500, price: 19.99, bonus: 75, popular: true },
  { tokens: 1000, price: 34.99, bonus: 200, popular: false },
];

export function PurchaseTokensModal({ onClose, userId }: PurchaseTokensModalProps) {
  const { purchaseTokens } = useAppStore();
  const { darkMode } = useAuthStore();
  const [selectedPackage, setSelectedPackage] = useState(tokenPackages[2]);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async () => {
    setIsPurchasing(true);
    
    try {
      // Mock payment process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const totalTokens = selectedPackage.tokens + selectedPackage.bonus;
      purchaseTokens(userId, totalTokens, selectedPackage.price);
      
      toast.success(`Successfully purchased ${totalTokens} tokens!`);
      onClose();
    } catch (error) {
      toast.error('Purchase failed. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
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
        className={`rounded-lg shadow-xl max-w-md w-full ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Purchase Tokens</h2>
          <button
            onClick={onClose}
            className={`transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-3 mb-6">
            {tokenPackages.map((pkg, index) => (
              <div
                key={index}
                onClick={() => setSelectedPackage(pkg)}
                className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedPackage === pkg
                    ? (darkMode ? 'border-blue-500 bg-blue-900/30' : 'border-blue-500 bg-blue-50')
                    : (darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300')
                } ${pkg.popular ? (darkMode ? 'ring-2 ring-purple-900/50' : 'ring-2 ring-purple-200') : ''}`}
              >
                {pkg.popular && (
                  <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold ${darkMode ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'}`}>
                    POPULAR
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${darkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'}`}>
                      <Coins className={`h-5 w-5 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                    </div>
                    <div>
                      <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{pkg.tokens.toLocaleString()} tokens</p>
                      {pkg.bonus > 0 && (
                        <p className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>+{pkg.bonus} bonus</p>
                      )}
                    </div>
                  </div>
                  <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>${pkg.price}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={`rounded-lg p-4 mb-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>How to earn tokens:</h3>
            <ul className={`text-sm space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <li>• Watch videos: +5 tokens</li>
              <li>• Like videos: +2 tokens</li>
              <li>• Refer friends: +50 tokens</li>
              <li>• Daily login: +10 tokens</li>
            </ul>
          </div>

          <Button
            onClick={handlePurchase}
            loading={isPurchasing}
            className="w-full"
            size="lg"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Purchase {selectedPackage.tokens + selectedPackage.bonus} Tokens for ${selectedPackage.price}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}