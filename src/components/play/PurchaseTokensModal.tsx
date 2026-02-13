import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Coins, CreditCard, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getAuthToken } from '../../lib/supabase';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

interface PurchaseTokensModalProps {
  onClose: () => void;
  userId: string;
}

interface TokenPackage {
  id: string;
  tokens: number;
  bonusTokens: number;
  totalTokens: number;
  price: number;
  priceCents: number;
}

export function PurchaseTokensModal({ onClose }: PurchaseTokensModalProps) {
  const { darkMode } = useAuthStore();
  const [packages, setPackages] = useState<TokenPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Fetch packages from DB on mount
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await fetch(`${API_URL}/api/stripe/packages`);
        const data = await res.json();
        if (data.success && data.packages) {
          setPackages(data.packages);
          // Default to the most popular (3rd package if exists)
          const popular = data.packages.length >= 3 ? data.packages[2] : data.packages[0];
          setSelectedPackage(popular || null);
        }
      } catch (err) {
        console.error('Failed to fetch token packages:', err);
        toast.error('Failed to load token packages');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPackages();
  }, [API_URL]);

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    setIsPurchasing(true);

    try {
      const authToken = await getAuthToken();
      const res = await fetch(`${API_URL}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ packageId: selectedPackage.id }),
      });

      const data = await res.json();

      if (data.success && data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Failed to create checkout session');
      }
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
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-6">
                {packages.map((pkg, index) => {
                  const isPopular = index === 2;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedPackage?.id === pkg.id
                        ? (darkMode ? 'border-blue-500 bg-blue-900/30' : 'border-blue-500 bg-blue-50')
                        : (darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300')
                        } ${isPopular ? (darkMode ? 'ring-2 ring-purple-900/50' : 'ring-2 ring-purple-200') : ''}`}
                    >
                      {isPopular && (
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
                            {pkg.bonusTokens > 0 && (
                              <p className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>+{pkg.bonusTokens} bonus</p>
                            )}
                          </div>
                        </div>
                        <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>${pkg.price.toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}
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
                disabled={!selectedPackage}
                className="w-full"
                size="lg"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {selectedPackage
                  ? `Purchase ${selectedPackage.totalTokens} Tokens for $${selectedPackage.price.toFixed(2)}`
                  : 'Select a package'}
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}