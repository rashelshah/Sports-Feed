import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { User, Shield, Trophy, Heart, ChevronDown, Check, X, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuthStore } from '../../store/authStore';
import { sportRoles } from '../../data/sportRoles';
import toast from 'react-hot-toast';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Confirm password is required'),
  username: yup.string().min(3, 'Username must be at least 3 characters').required('Username is required'),
  fullName: yup.string().required('Full name is required'),
  role: yup.string().oneOf(['user', 'coach', 'fan', 'aspirant', 'administrator']).required('Role is required'),
  sportsCategory: yup.string().oneOf(['coco', 'martial-arts', 'calorie-fight', 'adaptive-sports', 'unstructured-sports']).required('Sports category is required'),
  gender: yup.string().oneOf(['male', 'female', 'non-binary', 'prefer-not-to-say']).required('Gender is required'),
  accessibilityNeeds: yup.array().of(yup.string()).default([]),
  preferredAccommodations: yup.array().of(yup.string()).default([]),
});

type SignupFormData = yup.InferType<typeof schema>;

interface SignupFormProps {
  onSignupSuccess: () => void;
}

export function SignupForm({ onSignupSuccess }: SignupFormProps) {
  const [selectedRole, setSelectedRole] = useState<'user' | 'coach' | 'fan' | 'aspirant' | 'administrator'>('user');
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | 'non-binary' | 'prefer-not-to-say'>('prefer-not-to-say');
  const [accessibilityNeeds, setAccessibilityNeeds] = useState<string[]>([]);
  const [preferredAccommodations, setPreferredAccommodations] = useState<string[]>([]);
  const [selectedSportRole, setSelectedSportRole] = useState<string>('');
  const [sportInterests, setSportInterests] = useState<string[]>([]);
  const [showAccessibilityDropdown, setShowAccessibilityDropdown] = useState(false);
  const [showAccommodationsDropdown, setShowAccommodationsDropdown] = useState(false);
  const { register: registerUser, isLoading } = useAuthStore();
  const { darkMode } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPendingPopup, setShowPendingPopup] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<SignupFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      role: 'user',
      accessibilityNeeds: [],
      preferredAccommodations: []
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      const selectedRoleData = sportRoles.find(r => r.id === selectedSportRole);

      const registrationData = {
        ...data,
        accessibilityNeeds,
        preferredAccommodations,
        sportRole: selectedRoleData,
        sportInterests,
        isProfessional: selectedRoleData?.isProfessional || false,
        verificationStatus: (selectedRoleData?.requiresEvidence ? 'pending' : 'approved') as 'pending' | 'approved' | 'rejected',
      };

      await registerUser(registrationData);

      if (selectedRoleData?.requiresEvidence) {
        toast.success('Registration successful! Please upload your evidence documents for verification.');
      } else {
        toast.success('Registration successful! Your account is ready to use.');
      }

      onSignupSuccess();
    } catch (error: any) {
      if (error?.message === 'PENDING_COACH') {
        // Show pending coach popup
        setShowPendingPopup(true);
        return;
      }
      toast.error(error?.message ?? 'Registration failed. Please try again.');
    }
  };

  const handleRoleSelect = (role: 'user' | 'coach' | 'fan' | 'aspirant' | 'administrator') => {
    setSelectedRole(role as any);
    setValue('role', role as any);
    // Reset sport role and interests when changing roles
    setSelectedSportRole('');
    setSportInterests([]);
  };

  return (
    <>
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <div>
          <h2 className={`text-3xl font-bold mb-6 text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>Join TubeLight Feed</h2>

          {/* Role Selection */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Select Your Role<span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRoleSelect('user')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedRole === 'user'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : darkMode
                    ? 'border-gray-600 hover:border-gray-500 bg-gray-800'
                    : 'border-gray-300 hover:border-gray-400 bg-white'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <User className={`h-6 w-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <div>
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>User</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Follow coaches and interact</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRoleSelect('coach')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedRole === 'coach'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                  : darkMode
                    ? 'border-gray-600 hover:border-gray-500 bg-gray-800'
                    : 'border-gray-300 hover:border-gray-400 bg-white'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <Shield className={`h-6 w-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  <div>
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Coach</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Create content and teach</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRoleSelect('fan')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedRole === 'fan'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                  : darkMode
                    ? 'border-gray-600 hover:border-gray-500 bg-gray-800'
                    : 'border-gray-300 hover:border-gray-400 bg-white'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <Heart className={`h-6 w-6 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                  <div>
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Fan</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Support and follow sports</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRoleSelect('aspirant')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedRole === 'aspirant'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30'
                  : darkMode
                    ? 'border-gray-600 hover:border-gray-500 bg-gray-800'
                    : 'border-gray-300 hover:border-gray-400 bg-white'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <Trophy className={`h-6 w-6 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                  <div>
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Aspirant</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Aspiring athlete or player</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Sports Category */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Sports Category<span className="text-red-500 ml-0.5">*</span>
            </label>
            <select
              {...register('sportsCategory')}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'border-gray-300'
                }`}
            >
              <option value="">Select a category</option>
              <option value="coco">Coco</option>
              <option value="martial-arts">Martial Arts</option>
              <option value="calorie-fight">Calorie Fight</option>
              <option value="adaptive-sports">Adaptive Sports</option>
              <option value="unstructured-sports">Unstructured Sports</option>
            </select>
            {errors.sportsCategory && (
              <p className={`mt-1 text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{errors.sportsCategory.message}</p>
            )}
          </div>

          {/* Sport Role Selection (for Aspirants) */}
          {selectedRole === 'aspirant' && (
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Sport Role / Position
              </label>
              <select
                value={selectedSportRole}
                onChange={(e) => setSelectedSportRole(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'border-gray-300'
                  }`}
                title="Select your sport role"
              >
                <option value="">Select your sport role</option>
                {sportRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name} {role.isProfessional ? '(Professional)' : '(Non-Professional)'}
                  </option>
                ))}
              </select>
              {selectedSportRole && (
                <div className={`mt-2 p-3 rounded-lg ${darkMode ? 'bg-orange-900/30' : 'bg-orange-50'}`}>
                  <p className={`text-sm ${darkMode ? 'text-orange-300' : 'text-orange-800'}`}>
                    <strong>Note:</strong> {sportRoles.find(r => r.id === selectedSportRole)?.description}
                  </p>
                  {sportRoles.find(r => r.id === selectedSportRole)?.requiresEvidence && (
                    <p className={`text-sm mt-1 ${darkMode ? 'text-orange-400' : 'text-orange-700'}`}>
                      <strong>Evidence Required:</strong> You'll need to upload certificates or documents for verification.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Sport Interests (for Fans) */}
          {selectedRole === 'fan' && (
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Sport Interests (Optional)
              </label>
              <div className="space-y-2">
                {[
                  'Martial Arts',
                  'Fitness & Training',
                  'Coco Sports',
                  'Adaptive Sports',
                  'Unstructured Sports',
                  'Competition Watching',
                  'Training Videos',
                  'Sports News',
                  'Equipment Reviews',
                  'Nutrition & Health'
                ].map((interest) => (
                  <label key={interest} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={sportInterests.includes(interest)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSportInterests([...sportInterests, interest]);
                        } else {
                          setSportInterests(sportInterests.filter(i => i !== interest));
                        }
                      }}
                      className={`rounded ${darkMode ? 'border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500' : 'border-gray-300 text-green-600 focus:ring-green-500'}`}
                    />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{interest}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Gender Selection */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Gender Identity<span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'non-binary', label: 'Non-binary' },
                { value: 'prefer-not-to-say', label: 'Prefer not to say' }
              ].map((option) => (
                <motion.button
                  key={option.value}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedGender(option.value as any);
                    setValue('gender', option.value as any);
                  }}
                  className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${selectedGender === option.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : darkMode
                      ? 'border-gray-600 hover:border-gray-500 text-gray-300'
                      : 'border-gray-300 hover:border-gray-400 text-gray-700'
                    }`}
                >
                  {option.label}
                </motion.button>
              ))}
            </div>
            {errors.gender && (
              <p className={`mt-1 text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{errors.gender.message}</p>
            )}
          </div>

          {/* Accessibility Needs - Custom Multi-Select */}
          <div className="mb-6 relative">
            <label className={`block text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Accessibility Needs (Optional)
            </label>
            <button
              type="button"
              onClick={() => setShowAccessibilityDropdown(!showAccessibilityDropdown)}
              className={`w-full px-4 py-3 border-2 rounded-lg flex items-center justify-between transition-all ${showAccessibilityDropdown
                ? 'border-blue-500 ring-2 ring-blue-200'
                : darkMode
                  ? 'border-gray-600 hover:border-gray-500 bg-gray-800'
                  : 'border-gray-300 hover:border-gray-400 bg-white'
                }`}
            >
              <span className={`text-sm ${accessibilityNeeds.length === 0 ? (darkMode ? 'text-gray-500' : 'text-gray-400') : (darkMode ? 'text-white' : 'text-gray-900')}`}>
                {accessibilityNeeds.length === 0 ? 'Select accessibility needs...' : `${accessibilityNeeds.length} selected`}
              </span>
              <ChevronDown className={`h-5 w-5 transition-transform ${showAccessibilityDropdown ? 'rotate-180' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>

            {showAccessibilityDropdown && (
              <div className={`absolute z-50 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-auto ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                }`}>
                <div className="p-2">
                  {[
                    'Wheelchair accessible',
                    'Visual impairment support',
                    'Hearing impairment support',
                    'Mobility assistance',
                    'Cognitive support',
                    'Sensory-friendly environment',
                    'Sign language interpreter',
                    'Assistive technology'
                  ].map((need) => (
                    <label
                      key={need}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${accessibilityNeeds.includes(need)
                        ? 'bg-blue-500 border-blue-500'
                        : darkMode
                          ? 'border-gray-500'
                          : 'border-gray-300'
                        }`}>
                        {accessibilityNeeds.includes(need) && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={accessibilityNeeds.includes(need)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAccessibilityNeeds([...accessibilityNeeds, need]);
                            setValue('accessibilityNeeds', [...accessibilityNeeds, need]);
                          } else {
                            const updated = accessibilityNeeds.filter(n => n !== need);
                            setAccessibilityNeeds(updated);
                            setValue('accessibilityNeeds', updated);
                          }
                        }}
                        className="hidden"
                      />
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{need}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {accessibilityNeeds.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {accessibilityNeeds.map((need) => (
                  <motion.span
                    key={need}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${darkMode
                      ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30'
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                  >
                    {need}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = accessibilityNeeds.filter(n => n !== need);
                        setAccessibilityNeeds(updated);
                        setValue('accessibilityNeeds', updated);
                      }}
                      className={`ml-2 p-0.5 rounded-full hover:bg-red-500/20 hover:text-red-500 transition-colors ${darkMode ? 'text-blue-300' : 'text-blue-600'
                        }`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.span>
                ))}
              </div>
            )}
          </div>

          {/* Preferred Accommodations - Custom Multi-Select */}
          <div className="mb-6 relative">
            <label className={`block text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Preferred Accommodations (Optional)
            </label>
            <button
              type="button"
              onClick={() => setShowAccommodationsDropdown(!showAccommodationsDropdown)}
              className={`w-full px-4 py-3 border-2 rounded-lg flex items-center justify-between transition-all ${showAccommodationsDropdown
                ? 'border-green-500 ring-2 ring-green-200'
                : darkMode
                  ? 'border-gray-600 hover:border-gray-500 bg-gray-800'
                  : 'border-gray-300 hover:border-gray-400 bg-white'
                }`}
            >
              <span className={`text-sm ${preferredAccommodations.length === 0 ? (darkMode ? 'text-gray-500' : 'text-gray-400') : (darkMode ? 'text-white' : 'text-gray-900')}`}>
                {preferredAccommodations.length === 0 ? 'Select preferred accommodations...' : `${preferredAccommodations.length} selected`}
              </span>
              <ChevronDown className={`h-5 w-5 transition-transform ${showAccommodationsDropdown ? 'rotate-180' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>

            {showAccommodationsDropdown && (
              <div className={`absolute z-50 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-auto ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                }`}>
                <div className="p-2">
                  {[
                    'Quiet spaces',
                    'Flexible scheduling',
                    'Modified equipment',
                    'Personal assistant',
                    'Transportation assistance',
                    'Dietary accommodations',
                    'Extended time for activities',
                    'One-on-one instruction'
                  ].map((accommodation) => (
                    <label
                      key={accommodation}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${preferredAccommodations.includes(accommodation)
                        ? 'bg-green-500 border-green-500'
                        : darkMode
                          ? 'border-gray-500'
                          : 'border-gray-300'
                        }`}>
                        {preferredAccommodations.includes(accommodation) && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={preferredAccommodations.includes(accommodation)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPreferredAccommodations([...preferredAccommodations, accommodation]);
                            setValue('preferredAccommodations', [...preferredAccommodations, accommodation]);
                          } else {
                            const updated = preferredAccommodations.filter(a => a !== accommodation);
                            setPreferredAccommodations(updated);
                            setValue('preferredAccommodations', updated);
                          }
                        }}
                        className="hidden"
                      />
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{accommodation}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {preferredAccommodations.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {preferredAccommodations.map((accommodation) => (
                  <motion.span
                    key={accommodation}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${darkMode
                      ? 'bg-green-600/30 text-green-300 border border-green-500/30'
                      : 'bg-green-100 text-green-700 border border-green-200'
                      }`}
                  >
                    {accommodation}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = preferredAccommodations.filter(a => a !== accommodation);
                        setPreferredAccommodations(updated);
                        setValue('preferredAccommodations', updated);
                      }}
                      className={`ml-2 p-0.5 rounded-full hover:bg-red-500/20 hover:text-red-500 transition-colors ${darkMode ? 'text-green-300' : 'text-green-600'
                        }`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              showRequired
              {...register('fullName')}
              error={errors.fullName?.message}
              placeholder="Enter your full name"
            />

            <Input
              label="Username"
              showRequired
              {...register('username')}
              error={errors.username?.message}
              placeholder="Choose a username"
            />
          </div>

          <Input
            label="Email"
            type="email"
            showRequired
            {...register('email')}
            error={errors.email?.message}
            placeholder="Enter your email"
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              showRequired
              {...register('password')}
              error={errors.password?.message}
              placeholder="Create a password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="password-toggle"
              style={{ top: '38px' }}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              showRequired
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="password-toggle"
              style={{ top: '38px' }}
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <input type="hidden" {...register('role')} />
          <input type="hidden" {...register('gender')} />
        </div>

        <Button
          type="submit"
          loading={isLoading}
          className="w-full"
          size="lg"
        >
          Create Account
        </Button>

        <p className={`text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          After registration, you'll need to upload verification documents for expert review.
        </p>
      </motion.form>

      {/* Pending Coach Approval Popup */}
      {
        showPendingPopup && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl ${darkMode ? 'bg-[#111] border border-white/10' : 'bg-white border border-gray-200'
                }`}
            >
              <div className="text-5xl mb-4">🕒</div>
              <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Your account is under review
              </h3>
              <p className={`text-sm mb-6 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Our experts will verify your details before approval. You'll be notified once approved.
              </p>
              <button
                onClick={() => {
                  setShowPendingPopup(false);
                  onSignupSuccess();
                }}
                className="w-full py-2.5 rounded-xl bg-white text-black font-medium hover:bg-gray-100 transition-colors"
              >
                OK
              </button>
            </motion.div>
          </div>
        )
      }
    </>
  );
}