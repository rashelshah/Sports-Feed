import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Video } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { aiService } from '../../services/aiService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import toast from 'react-hot-toast';

interface UploadVideoModalProps {
  onClose: () => void;
  coachId: string;
}

export function UploadVideoModal({ onClose, coachId }: UploadVideoModalProps) {
  const { user } = useAuthStore();
  const { addVideo } = useAppStore();
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: user?.sportsCategory || 'martial-arts',
    difficulty: 'beginner',
    type: 'free',
    tokenCost: 0,
    tags: '',
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !videoFile || !thumbnailFile) {
      toast.error('Please fill in all required fields and select files');
      return;
    }

    setIsUploading(true);

    try {
      // AI Content Filtering & Abuse Detection for title and description
      const fullContent = `${formData.title} ${formData.description} ${formData.tags}`;
      
      const [filterResult, abuseResult] = await Promise.all([
        aiService.filterMultilingualContent(fullContent, 'video-description'),
        aiService.detectAbuse(fullContent, 'text')
      ]);

      // Check for abusive content
      if (abuseResult.isAbusive) {
        if (abuseResult.severity === 'critical' || abuseResult.severity === 'high') {
          toast.error('Video content contains inappropriate material. Please revise.');
          setIsUploading(false);
          return;
        }
        toast.error('Video may contain questionable content. Please review.');
      }

      // Check content filtering
      if (!filterResult.isSafe) {
        toast.error(filterResult.reason || 'Content needs moderation');
        setIsUploading(false);
        return;
      }

      // Mock upload process
      await new Promise(resolve => setTimeout(resolve, 3000));

      const newVideo = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description,
        thumbnailUrl: URL.createObjectURL(thumbnailFile),
        videoUrl: URL.createObjectURL(videoFile),
        duration: 600, // Mock duration
        coachId: user.id,
        coach: user,
        category: formData.category as 'coco' | 'martial-arts' | 'calorie-fight',
        difficulty: formData.difficulty as 'beginner' | 'intermediate' | 'advanced',
        type: formData.type as 'free' | 'premium',
        tokenCost: formData.type === 'premium' ? formData.tokenCost : 0,
        views: 0,
        likes: 0,
        isLiked: false,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        createdAt: new Date().toISOString(),
      };

      addVideo(newVideo);
      toast.success('Video uploaded successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to upload video. Please try again.');
    } finally {
      setIsUploading(false);
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
          <h2 className="text-xl font-bold text-gray-900">Upload Video</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Close"
            aria-label="Close upload modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <Input
              label="Video Title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter video title"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your video content..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                required
              />
            </div>
          </div>

          {/* File Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="video-upload"
                  required
                />
                <label htmlFor="video-upload" className="cursor-pointer">
                  <Video className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {videoFile ? videoFile.name : 'Click to upload video'}
                  </p>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thumbnail
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="thumbnail-upload"
                  required
                />
                <label htmlFor="thumbnail-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {thumbnailFile ? thumbnailFile.name : 'Click to upload thumbnail'}
                  </p>
                </label>
              </div>
            </div>
          </div>

          {/* Video Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category-select"
                aria-label="Video category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="coco">Coco</option>
                <option value="martial-arts">Martial Arts</option>
                <option value="calorie-fight">Calorie Fight</option>
              </select>
            </div>

            <div>
              <label htmlFor="difficulty-select" className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty
              </label>
              <select
                id="difficulty-select"
                aria-label="Video difficulty level"
                value={formData.difficulty}
                onChange={(e) => handleInputChange('difficulty', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video Type
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="free"
                    checked={formData.type === 'free'}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="mr-2"
                  />
                  Free
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="premium"
                    checked={formData.type === 'premium'}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="mr-2"
                  />
                  Premium
                </label>
              </div>
            </div>

            {formData.type === 'premium' && (
              <Input
                label="Token Cost"
                type="number"
                value={formData.tokenCost}
                onChange={(e) => handleInputChange('tokenCost', parseInt(e.target.value) || 0)}
                placeholder="Enter token cost"
                min="1"
                required
              />
            )}
          </div>

          {/* Tags */}
          <Input
            label="Tags (comma-separated)"
            value={formData.tags}
            onChange={(e) => handleInputChange('tags', e.target.value)}
            placeholder="e.g., warm-up, basics, flexibility"
          />

          {/* Submit */}
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
              loading={isUploading}
              className="flex-1"
            >
              {isUploading ? 'Uploading...' : 'Upload Video'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}