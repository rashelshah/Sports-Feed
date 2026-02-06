import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Heart, Share } from 'lucide-react';
import { Video } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

interface VideoPlayerModalProps {
  video: Video;
  onClose: () => void;
}

export function VideoPlayerModal({ video, onClose }: VideoPlayerModalProps) {
  const { user } = useAuthStore();
  const { likeVideo } = useAppStore();
  const [isLiked, setIsLiked] = useState(video.isLiked);
  const [likesCount, setLikesCount] = useState(video.likes);

  const handleLike = () => {
    if (!user) return;
    
    const newIsLiked = !isLiked;
    const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1;
    
    setIsLiked(newIsLiked);
    setLikesCount(newLikesCount);
    
    likeVideo(video.id, user.id);
    
    if (newIsLiked) {
      toast.success('Video liked! +2 tokens earned');
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/video/${video.id}`;
    const shareText = `Check out this ${video.type === 'premium' ? 'premium' : 'free'} ${video.category.replace('-', ' ')} video by ${video.coach.fullName}: "${video.title}"`;
    
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: shareText,
        url: shareUrl,
      }).then(() => {
        toast.success('Video shared successfully!');
      }).catch(() => {
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`).then(() => {
          toast.success('Video link copied to clipboard!');
        });
      });
    } else {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`).then(() => {
        toast.success('Video link copied to clipboard!');
      }).catch(() => {
        toast.success('Video shared!');
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 truncate">{video.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Video Player */}
        <div className="relative bg-black">
          <video
            src={video.videoUrl}
            poster={video.thumbnailUrl}
            controls
            autoPlay
            className="w-full h-64 md:h-96 object-contain"
          >
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Video Info */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{video.title}</h3>
              <p className="text-gray-600 mb-3">{video.description}</p>
              
              {/* Coach Info */}
              <div className="flex items-center space-x-3">
                <img
                  src={video.coach.profileImage}
                  alt={video.coach.fullName}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <div className="flex items-center space-x-1">
                    <p className="font-semibold text-gray-900">{video.coach.fullName}</p>
                    {video.coach.isVerified && (
                      <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 capitalize">{video.coach.sportsCategory.replace('-', ' ')}</p>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex space-x-2 ml-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLike}
              >
                <Heart className={`h-4 w-4 mr-1 ${isLiked ? 'fill-current text-red-500' : ''}`} />
                {likesCount}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleShare}
              >
                <Share className="h-4 w-4 mr-1" />
                Share
              </Button>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {video.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-6 text-sm text-gray-500 border-t border-gray-200 pt-4">
            <span>{video.views.toLocaleString()} views</span>
            <span>{video.likes} likes</span>
            <span className="capitalize">{video.difficulty} level</span>
            <span>{Math.floor(video.duration / 60)} minutes</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}