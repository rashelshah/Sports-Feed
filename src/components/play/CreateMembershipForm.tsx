import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Plus, X } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import toast from 'react-hot-toast';

interface CreateMembershipFormProps {
  coachId: string;
}

export function CreateMembershipForm({ coachId }: CreateMembershipFormProps) {
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

    setIsCreating(true);

    try {
      // Mock creation process
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
      toast.success('Membership created successfully!');
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        price: 100,
        duration: 30,
        benefits: [''],
      });
    } catch (error) {
      toast.error('Failed to create membership. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md p-8"
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Star className="h-16 w-16 text-purple-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Membership</h2>
          <p className="text-gray-600">
            Create exclusive membership programs for your followers
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Duration (Days)"
              type="number"
              value={formData.duration}
              onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
              placeholder="30"
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what members will get..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={4}
              required
            />
          </div>

          {/* Benefits */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Membership Benefits
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
                    placeholder="e.g., Access to premium videos"
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

          {/* Submit */}
          <div className="pt-4">
            <Button
              type="submit"
              loading={isCreating}
              className="w-full"
              size="lg"
              variant="secondary"
            >
              {isCreating ? 'Creating Membership...' : 'Create Membership'}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}