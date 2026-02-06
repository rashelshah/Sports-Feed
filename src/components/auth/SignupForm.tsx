import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { User, Shield, Trophy, Heart } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuthStore } from '../../store/authStore';
import { sportRoles, getSportRolesByCategory } from '../../data/sportRoles';
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
  accessibilityNeeds: yup.array().of(yup.string()),
  preferredAccommodations: yup.array().of(yup.string()),
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
  const { register: registerUser, isLoading } = useAuthStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<SignupFormData>({
    resolver: yupResolver(schema),
    defaultValues: { role: 'user' },
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
        verificationStatus: selectedRoleData?.requiresEvidence ? 'pending' : 'approved',
      };
      
      await registerUser(registrationData);
      
      if (selectedRoleData?.requiresEvidence) {
        toast.success('Registration successful! Please upload your evidence documents for verification.');
      } else {
        toast.success('Registration successful! Your account is ready to use.');
      }
      
      onSignupSuccess();
    } catch (error: any) {
      toast.error(error?.message ?? 'Registration failed. Please try again.');
    }
  };

  const handleRoleSelect = (role: 'user' | 'coach' | 'fan' | 'aspirant' | 'administrator') => {
    setSelectedRole(role);
    setValue('role', role);
    // Reset sport role and interests when changing roles
    setSelectedSportRole('');
    setSportInterests([]);
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Join SportsFeed</h2>
        
        {/* Role Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Your Role
          </label>
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleSelect('user')}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedRole === 'user'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center space-x-3">
                <User className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">User</h3>
                  <p className="text-sm text-gray-600">Follow coaches and interact</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleSelect('coach')}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedRole === 'coach'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Shield className="h-6 w-6 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Coach</h3>
                  <p className="text-sm text-gray-600">Create content and teach</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleSelect('fan')}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedRole === 'fan'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Heart className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Fan</h3>
                  <p className="text-sm text-gray-600">Support and follow sports</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleSelect('aspirant')}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedRole === 'aspirant'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Trophy className="h-6 w-6 text-orange-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Aspirant</h3>
                  <p className="text-sm text-gray-600">Aspiring athlete or player</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleSelect('administrator')}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedRole === 'administrator'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Shield className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Administrator</h3>
                  <p className="text-sm text-gray-600">Platform administrator</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Sports Category */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Sports Category
          </label>
          <select
            {...register('sportsCategory')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a category</option>
            <option value="coco">Coco</option>
            <option value="martial-arts">Martial Arts</option>
            <option value="calorie-fight">Calorie Fight</option>
            <option value="adaptive-sports">Adaptive Sports</option>
            <option value="unstructured-sports">Unstructured Sports</option>
          </select>
          {errors.sportsCategory && (
            <p className="mt-1 text-sm text-red-600">{errors.sportsCategory.message}</p>
          )}
        </div>

        {/* Sport Role Selection (for Aspirants) */}
        {selectedRole === 'aspirant' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Sport Role / Position
            </label>
            <select
              value={selectedSportRole}
              onChange={(e) => setSelectedSportRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
              <div className="mt-2 p-3 bg-orange-50 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>Note:</strong> {sportRoles.find(r => r.id === selectedSportRole)?.description}
                </p>
                {sportRoles.find(r => r.id === selectedSportRole)?.requiresEvidence && (
                  <p className="text-sm text-orange-700 mt-1">
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
            <label className="block text-sm font-medium text-gray-700 mb-3">
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
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">{interest}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Gender Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Gender Identity
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
                className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                  selectedGender === option.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400 text-gray-700'
                }`}
              >
                {option.label}
              </motion.button>
            ))}
          </div>
          {errors.gender && (
            <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
          )}
        </div>

        {/* Accessibility Needs */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Accessibility Needs (Optional)
          </label>
          <div className="space-y-2">
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
              <label key={need} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={accessibilityNeeds.includes(need)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setAccessibilityNeeds([...accessibilityNeeds, need]);
                    } else {
                      setAccessibilityNeeds(accessibilityNeeds.filter(n => n !== need));
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{need}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Preferred Accommodations */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Preferred Accommodations (Optional)
          </label>
          <div className="space-y-2">
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
              <label key={accommodation} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={preferredAccommodations.includes(accommodation)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setPreferredAccommodations([...preferredAccommodations, accommodation]);
                    } else {
                      setPreferredAccommodations(preferredAccommodations.filter(a => a !== accommodation));
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{accommodation}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            {...register('fullName')}
            error={errors.fullName?.message}
            placeholder="Enter your full name"
          />
          
          <Input
            label="Username"
            {...register('username')}
            error={errors.username?.message}
            placeholder="Choose a username"
          />
        </div>

        <Input
          label="Email"
          type="email"
          {...register('email')}
          error={errors.email?.message}
          placeholder="Enter your email"
        />

        <Input
          label="Password"
          type="password"
          {...register('password')}
          error={errors.password?.message}
          placeholder="Create a password"
        />

        <Input
          label="Confirm Password"
          type="password"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
          placeholder="Confirm your password"
        />

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

      <p className="text-sm text-gray-600 text-center">
        After registration, you'll need to upload verification documents for expert review.
      </p>
    </motion.form>
  );
}