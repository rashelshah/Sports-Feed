import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, Shield } from 'lucide-react';
import { SignupForm } from '../components/auth/SignupForm';
import { LoginForm } from '../components/auth/LoginForm';
import { useAuthStore } from '../store/authStore';

type AuthStep = 'login' | 'signup';

export function AuthPage() {
  const [currentStep, setCurrentStep] = useState<AuthStep>('login');
  const { darkMode } = useAuthStore();

  const renderStep = () => {
    try {
      switch (currentStep) {
        case 'signup':
          return <SignupForm onSignupSuccess={() => setCurrentStep('login')} />;
        default:
          return <LoginForm onLoginSuccess={() => {}} />;
      }
    } catch (error) {
      console.error('Error rendering auth step:', error);
      return <div className="text-red-500 p-4">Error loading form. Please refresh the page.</div>;
    }
  };


  return (
    <div className={`min-h-screen w-full overflow-x-hidden flex items-center justify-center p-4 sm:p-6 lg:p-8 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
        : 'bg-gradient-to-br from-blue-50 to-purple-50'
    }`}>
      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
          {/* Left Side - Branding */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left order-2 lg:order-1"
          >
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 lg:mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Welcome to{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SportsFeed
              </span>
            </h1>
            
            <p className={`text-lg sm:text-xl mb-6 lg:mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Connect with certified coaches, share your journey, and level up your athletic performance.
            </p>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-center lg:justify-start space-x-3">
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 flex-shrink-0" />
                <span className={`text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Learn from verified coaches</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start space-x-3">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 flex-shrink-0" />
                <span className={`text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Connect with athletes worldwide</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start space-x-3">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 flex-shrink-0" />
                <span className={`text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Secure, verified community</span>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Auth Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`rounded-2xl shadow-xl p-6 sm:p-8 w-full order-1 lg:order-2 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
          >
            <div className="min-h-[300px] sm:min-h-[400px]">
              {renderStep()}
            </div>
            
            <div className="mt-6 text-center">
              {currentStep === 'login' ? (
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Don't have an account?{' '}
                  <button
                    onClick={() => setCurrentStep('signup')}
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Already have an account?{' '}
                  <button
                    onClick={() => setCurrentStep('login')}
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}