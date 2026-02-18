import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

type LoginFormData = yup.InferType<typeof schema>;

interface LoginFormProps {
  onLoginSuccess: () => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const { login, isLoading, darkMode } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      onLoginSuccess();
    } catch (error: any) {
      toast.error(error?.message ?? 'Invalid credentials. Please try again.');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(onSubmit)(e);
  };


  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleFormSubmit}
      className="space-y-6"
    >
      <div>
        <h2 className={`text-3xl font-bold mb-6 text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>Welcome Back</h2>

        <div className="space-y-4">
          {/* Email */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Email
            </label>
            <input
              type="email"
              {...register('email')}
              placeholder="Enter your email"
              className={`w-full px-3 py-2 border rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent input-glow ${errors.email
                  ? (darkMode ? 'border-red-500 bg-red-900/20' : 'border-red-300 bg-red-50')
                  : (darkMode
                    ? 'border-gray-600 bg-gray-700 text-white hover:border-gray-500 placeholder-gray-400'
                    : 'border-gray-300 bg-white hover:border-gray-400')
                }`}
            />
            {errors.email && (
              <p className={`mt-1 text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{errors.email.message}</p>
            )}
          </div>

          {/* Password with toggle */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="Enter your password"
                className={`w-full px-3 py-2 pr-10 border rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent input-glow ${errors.password
                    ? (darkMode ? 'border-red-500 bg-red-900/20' : 'border-red-300 bg-red-50')
                    : (darkMode
                      ? 'border-gray-600 bg-gray-700 text-white hover:border-gray-500 placeholder-gray-400'
                      : 'border-gray-300 bg-white hover:border-gray-400')
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className={`mt-1 text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{errors.password.message}</p>
            )}
          </div>
        </div>
      </div>

      <Button
        type="submit"
        loading={isLoading}
        className="w-full btn-press"
        size="lg"
      >
        Sign In
      </Button>

      <div className="text-center">
        <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
          Forgot your password?
        </a>
      </div>
    </motion.form>
  );
}