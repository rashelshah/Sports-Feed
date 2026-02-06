import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, Shield } from 'lucide-react';
import { SignupForm } from '../components/auth/SignupForm';
import { LoginForm } from '../components/auth/LoginForm';

type AuthStep = 'login' | 'signup';

export function AuthPage() {
  const [currentStep, setCurrentStep] = useState<AuthStep>('login');

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SportsFeed
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8">
              Connect with certified coaches, share your journey, and level up your athletic performance.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Trophy className="h-6 w-6 text-yellow-500" />
                <span className="text-gray-700">Learn from verified coaches</span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="h-6 w-6 text-blue-500" />
                <span className="text-gray-700">Connect with athletes worldwide</span>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="h-6 w-6 text-green-500" />
                <span className="text-gray-700">Secure, verified community</span>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Auth Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="min-h-[400px]">
              {renderStep()}
            </div>
            
            <div className="mt-6 text-center">
              {currentStep === 'login' ? (
                <p className="text-gray-600">
                  Don't have an account?{' '}
                  <button
                    onClick={() => setCurrentStep('signup')}
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p className="text-gray-600">
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