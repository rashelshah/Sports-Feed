import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Radio, Calendar } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import toast from 'react-hot-toast';

interface CreateLivestreamModalProps {
  onClose: () => void;
}

export function CreateLivestreamModal({ onClose }: CreateLivestreamModalProps) {
  const { user } = useAuthStore();
  const { addLivestream } = useAppStore();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    isLive: false,
    scheduledTime: '',
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateYoutubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return youtubeRegex.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !formData.title.trim() || !formData.description.trim() || !formData.youtubeUrl.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!validateYoutubeUrl(formData.youtubeUrl)) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }

    if (!formData.isLive && !formData.scheduledTime) {
      toast.error('Please set a scheduled time for non-live streams');
      return;
    }

    setIsCreating(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newLivestream = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description,
        youtubeUrl: formData.youtubeUrl,
        coach: user,
        isLive: formData.isLive,
        scheduledTime: formData.scheduledTime || undefined,
        viewers: formData.isLive ? Math.floor(Math.random() * 100) + 10 : 0,
        category: user.sportsCategory,
      };

      addLivestream(newLivestream);
      toast.success(`Livestream "${formData.title}" ${formData.isLive ? 'started' : 'scheduled'} successfully!`);
      onClose();
    } catch (error) {
      toast.error('Failed to create livestream. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Radio className="h-6 w-6 text-red-500 mr-2" />
            Create Livestream
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
            Schedule or start a live stream session with your followers
          </p>

          <Input
            label="Stream Title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="e.g., Live Training Session - Advanced Techniques"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what you'll be teaching in this livestream..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
              required
            />
          </div>

          <Input
            label="YouTube URL"
            value={formData.youtubeUrl}
            onChange={(e) => handleInputChange('youtubeUrl', e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            required
          />

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>How to get your YouTube URL:</strong>
              <br />
              1. Go to YouTube Studio and create a live stream
              <br />
              2. Copy the stream URL or video ID
              <br />
              3. Paste it in the field above
            </p>
          </div>

          <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
            <input
              type="checkbox"
              id="isLive"
              checked={formData.isLive}
              onChange={(e) => handleInputChange('isLive', e.target.checked)}
              className="h-4 w-4 text-red-600 rounded focus:ring-red-500"
            />
            <label htmlFor="isLive" className="flex-1 text-gray-700 font-medium cursor-pointer">
              Start stream immediately (check if already live on YouTube)
            </label>
          </div>

          {!formData.isLive && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Scheduled Time *
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledTime}
                onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                required={!formData.isLive}
              />
            </div>
          )}

          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Make sure your YouTube stream is set to public or unlisted, and that embedding is enabled in YouTube settings.
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
              className="flex-1 bg-red-600 hover:bg-red-700"
              size="lg"
            >
              {isCreating ? 'Creating...' : formData.isLive ? 'Start Livestream' : 'Schedule Livestream'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
