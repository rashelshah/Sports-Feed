import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export function TokenPurchaseCancel() {
    const navigate = useNavigate();
    const { darkMode } = useAuthStore();

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`max-w-md w-full rounded-2xl shadow-xl p-8 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
            >
                <XCircle className={`h-16 w-16 mx-auto mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Purchase Cancelled
                </h2>
                <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    No worries! Your card has not been charged. You can purchase tokens anytime.
                </p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                >
                    Return to Dashboard
                </button>
            </motion.div>
        </div>
    );
}
