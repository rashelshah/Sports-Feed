import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Plus, X } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import toast from 'react-hot-toast';

interface CreateMembershipModalProps {
  coachId: string;
  onClose: () => void;
}

export function CreateMembershipModal({ coachId, onClose }: CreateMembershipModalProps) {
  const { user } = useAuthStore();
  const { addMembership } = useAppStore();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 100,
    duration: 30,
    benefits: [''],
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addBenefit = () => {
    setFormData(prev => ({
      ...prev,
      benefits: [...prev.benefits, '']
    }));
  };

  const removeBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  const updateBenefit = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.map((benefit, i) => i === index ? value : benefit)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !formData.name.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const validBenefits = formData.benefits.filter(benefit => benefit.trim());
    if (validBenefits.length === 0) {
      toast.error('Please add at least one benefit');
      return;
    }

    if (formData.price < 1) {
      toast.error('Price must be at least 1 token');
      return;
    }

    if (formData.duration < 1) {
      toast.error('Duration must be at least 1 day');
      return;
    }

    setIsCreating(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newMembership = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        price: formData.price,
        duration: formData.duration,
        benefits: validBenefits,
        coachId: user.id,
        coach: user,
        isActive: true,
      };

      addMembership(newMembership);
      toast.success(`Membership "${formData.name}" created successfully!`);
      onClose();
    } catch (error) {
      toast.error('Failed to create membership. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Star className="h-6 w-6 text-purple-500 mr-2" />
            Create Membership
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <p className="text-gray-600 text-center">
            Create exclusive membership programs for your followers to access premium content
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Membership Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Premium Training Program"
              required
            />

            <Input
              label="Price (Tokens)"
              type="number"
              value={formData.price}
              onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
              placeholder="100"
              min="1"
              required
            />
          </div>

          <Input
            label="Duration (Days)"
            type="number"
            value={formData.duration}
            onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
            placeholder="30"
            min="1"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what members will get access to..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={4}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Membership Benefits *
              </label>
              <Button
                type="button"
                onClick={addBenefit}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Benefit
              </Button>
            </div>

            <div className="space-y-3">
              {formData.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={benefit}
                    onChange={(e) => updateBenefit(index, e.target.value)}
                    placeholder="e.g., Access to all premium videos"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {formData.benefits.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBenefit(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Members will have access to all your content for {formData.duration} days after purchasing this membership for {formData.price} tokens.
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isCreating}
              className="flex-1"
              size="lg"
            >
              {isCreating ? 'Creating...' : 'Create Membership'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
