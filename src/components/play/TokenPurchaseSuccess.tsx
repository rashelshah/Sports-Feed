import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Coins, Loader2, AlertCircle, LogIn } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getAuthToken } from '../../lib/supabase';

export function TokenPurchaseSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { darkMode, initSession } = useAuthStore();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [tokensCredited, setTokensCredited] = useState(0);
    const [newBalance, setNewBalance] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');
    const hasVerified = useRef(false);

    const sessionId = searchParams.get('session_id');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    useEffect(() => {
        // Prevent double-fire in React StrictMode
        if (hasVerified.current) return;
        hasVerified.current = true;

        const verifyPayment = async () => {
            if (!sessionId) {
                setStatus('error');
                setErrorMsg('Missing session ID');
                return;
            }

            // Re-initialize auth session first (refreshes the Supabase token)
            try {
                await initSession();
            } catch (e) {
                // Continue anyway — getAuthToken might still work
            }

            // Get a fresh token
            const token = await getAuthToken();
            if (!token) {
                setStatus('error');
                setErrorMsg('Your session has expired. Please log in again to verify your purchase. Your tokens are safe — they will be credited automatically.');
                return;
            }

            try {
                const res = await fetch(
                    `${API_URL}/api/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                const data = await res.json();

                if (data.success) {
                    setTokensCredited(data.tokensCredited);
                    setNewBalance(data.newBalance);
                    setStatus('success');
                    // Auto-redirect to dashboard after 4 seconds
                    setTimeout(() => navigate('/dashboard'), 4000);
                } else if (res.status === 401) {
                    setStatus('error');
                    setErrorMsg('Your session has expired. Please log in again. Your tokens are safe and will appear in your wallet.');
                } else {
                    setStatus('error');
                    setErrorMsg(data.error || 'Failed to verify payment');
                }
            } catch (err) {
                setStatus('error');
                setErrorMsg('Network error. Please check your connection and try refreshing the page.');
            }
        };

        verifyPayment();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`max-w-md w-full rounded-2xl shadow-xl p-8 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
            >
                {status === 'loading' && (
                    <>
                        <Loader2 className="h-16 w-16 animate-spin text-blue-500 mx-auto mb-4" />
                        <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Verifying your purchase...
                        </h2>
                        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                            Please wait while we confirm your payment.
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                        >
                            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
                        </motion.div>
                        <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Purchase Successful! 🎉
                        </h2>
                        <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Your tokens have been added to your wallet.
                        </p>
                        <div className={`rounded-xl p-6 mb-6 ${darkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
                            <div className="flex items-center justify-center space-x-2 mb-3">
                                <Coins className={`h-8 w-8 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                                <span className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    +{tokensCredited}
                                </span>
                            </div>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                tokens credited to your account
                            </p>
                            <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-green-200'}`}>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    New Balance: <span className="font-bold">{newBalance.toLocaleString()} tokens</span>
                                </p>
                            </div>
                        </div>
                        <p className={`text-xs mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            Redirecting to dashboard in a few seconds...
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                        >
                            Return to Dashboard
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                        <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Verification Needed
                        </h2>
                        <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {errorMsg}
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/auth')}
                                className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center"
                            >
                                <LogIn className="h-4 w-4 mr-2" />
                                Log In Again
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className={`w-full py-3 px-6 font-semibold rounded-xl transition-colors ${darkMode
                                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    }`}
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
}
