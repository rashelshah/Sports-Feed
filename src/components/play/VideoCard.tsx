import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, Eye, Heart, Lock, Coins, Share } from 'lucide-react';
import { Video, UserTokens } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { Button } from '../ui/Button';
import { VideoPlayerModal } from './VideoPlayerModal';
import { WatchAdModal } from './WatchAdModal';
import toast from 'react-hot-toast';

interface VideoCardProps {
  video: Video;
  userTokens: UserTokens;
}

export function VideoCard({ video, userTokens }: VideoCardProps) {
  const { user } = useAuthStore();
  const { likeVideo, spendTokens, watchVideo } = useAppStore();
  const [showPlayer, setShowPlayer] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [isLiked, setIsLiked] = useState(video.isLiked);
  const [likesCount, setLikesCount] = useState(video.likes);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePlay = () => {
    if (!user) return;

    if (video.type === 'premium' && video.tokenCost > 0) {
      if (userTokens.balance < video.tokenCost) {
        toast.error(`Insufficient tokens! You need ${video.tokenCost} tokens to watch this video.`);
        return;
      }
      
      const success = spendTokens(user.id, video.tokenCost, 'spent', `Watched premium video: ${video.title}`);
      if (!success) {
        toast.error('Failed to process payment. Please try again.');
        return;
      }
      
      toast.success(`Spent ${video.tokenCost} tokens to unlock video!`);
    }

    // Award tokens for watching (even premium videos give some back)
    watchVideo(video.id, user.id);
    setShowPlayer(true);
  };

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
    if (!user) return;
    
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
        // Fallback to clipboard
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`).then(() => {
          toast.success('Video link copied to clipboard!');
        });
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`).then(() => {
        toast.success('Video link copied to clipboard!');
      }).catch(() => {
        toast.success('Video shared!');
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'coco': return 'bg-orange-100 text-orange-800';
      case 'martial-arts': return 'bg-red-100 text-red-800';
      case 'calorie-fight': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -5 }}
        className="bg-white rounded-lg shadow-md overflow-hidden"
      >
        {/* Thumbnail */}
        <div className="relative">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-48 object-cover"
          />
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <button
              onClick={handlePlay}
              className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-4 transition-all transform hover:scale-110"
            >
              <Play className="h-8 w-8 text-gray-800 ml-1" />
            </button>
          </div>
          
          {/* Duration */}
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {formatDuration(video.duration)}
          </div>
          
          {/* Premium Badge */}
          {video.type === 'premium' && (
            <div className="absolute top-2 left-2 bg-purple-500 text-white px-2 py-1 rounded-full text-xs flex items-center">
              <Lock className="h-3 w-3 mr-1" />
              {video.tokenCost} tokens
            </div>
          )}
          
          {/* Free Badge */}
          {video.type === 'free' && (
            <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
              FREE
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">{video.title}</h3>
          </div>
          
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{video.description}</p>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(video.category)}`}>
              {video.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(video.difficulty)}`}>
              {video.difficulty.charAt(0).toUpperCase() + video.difficulty.slice(1)}
            </span>
          </div>
          
          {/* Coach Info */}
          <div className="flex items-center space-x-2 mb-3">
            <img
              src={video.coach.profileImage}
              alt={video.coach.fullName}
              className="h-6 w-6 rounded-full object-cover"
            />
            <span className="text-sm text-gray-700">{video.coach.fullName}</span>
            {video.coach.isVerified && (
              <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          
          {/* Stats and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{video.views.toLocaleString()}</span>
              </div>
              <button
                onClick={handleLike}
                className={`flex items-center space-x-1 transition-colors ${
                  isLiked ? 'text-red-500' : 'hover:text-red-500'
                }`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likesCount}</span>
              </button>
              <button
                onClick={handleShare}
                className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
              >
                <Share className="h-4 w-4" />
                <span>Share</span>
              </button>
            </div>
            
            <Button
              onClick={handlePlay}
              size="sm"
              variant={video.type === 'premium' ? 'secondary' : 'primary'}
            >
              {video.type === 'premium' ? (
                <>
                  <Coins className="h-4 w-4 mr-1" />
                  {video.tokenCost}
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Watch
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Video Player Modal */}
      {showPlayer && (
        <VideoPlayerModal
          video={video}
          onClose={() => setShowPlayer(false)}
        />
      )}
      
      {/* Watch Ad Modal */}
      {showAdModal && (
        <WatchAdModal
          onClose={() => setShowAdModal(false)}
          userId={user?.id || ''}
        />
      )}
    </>
  );
}