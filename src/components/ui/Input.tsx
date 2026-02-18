import { forwardRef } from 'react';
import { useAuthStore } from '../../store/authStore';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showRequired?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, showRequired, className = '', ...props }, ref) => {
    const { darkMode } = useAuthStore();

    return (
      <div className="w-full">
        {label && (
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {label}{showRequired && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-3 py-2 border rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent input-glow ${error
            ? (darkMode ? 'border-red-500 bg-red-900/20' : 'border-red-300 bg-red-50')
            : (darkMode
              ? 'border-gray-600 bg-gray-700 text-white hover:border-gray-500 placeholder-gray-400'
              : 'border-gray-300 bg-white hover:border-gray-400')
            } ${className}`}
          {...props}
        />
        {error && (
          <p className={`mt-1 text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
        )}
        {helperText && !error && (
          <p className={`mt-1 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{helperText}</p>
        )}
      </div>
    );
  }
);