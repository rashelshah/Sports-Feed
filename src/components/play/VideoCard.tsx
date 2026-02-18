import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Clock, Eye, Heart, Lock, Coins, Share, X, Unlock, Trash2 } from 'lucide-react';
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
  const { user, darkMode } = useAuthStore();
  const { likeVideo, watchVideo, purchasedVideoIds, fetchUserTokens, fetchPurchasedVideos, fetchVideos } = useAppStore();
  const [showPlayer, setShowPlayer] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isLiked, setIsLiked] = useState(video.isLiked);
  const [likesCount, setLikesCount] = useState(video.likes);

  const isExpert = user?.role === 'expert' || user?.role === 'admin' || user?.role === 'administrator';
  const isPremium = video.type === 'premium' && video.tokenCost > 0;
  const isPurchased = purchasedVideoIds.includes(video.id);
  // Expert bypasses premium lock — sees all content as unlocked
  const isLocked = isPremium && !isPurchased && !isExpert;

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleCardClick = () => {
    if (!user) return;
    if (isLocked) {
      setShowUnlockModal(true);
    } else {
      handlePlay();
    }
  };

  const handlePlay = () => {
    if (!user) return;
    watchVideo(video.id, user.id);
    setShowPlayer(true);
  };

  const handleUnlock = async () => {
    if (!user) return;
    if (userTokens.balance < video.tokenCost) {
      toast.error(`Insufficient tokens! You need ${video.tokenCost} tokens.`);
      return;
    }

    setIsUnlocking(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/videos/${video.id}/purchase`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        if (data.alreadyOwned) {
          toast.success('Video already unlocked!');
        } else {
          toast.success(`Unlocked "${video.title}" for ${video.tokenCost} tokens!`);
        }
        // Refresh purchases and balance
        await Promise.all([
          fetchPurchasedVideos(),
          fetchUserTokens(user.id),
        ]);
        setShowUnlockModal(false);
        // Auto-play after unlock
        handlePlay();
      } else {
        toast.error(data.error || 'Failed to unlock video');
      }
    } catch (err) {
      console.error('Error purchasing video:', err);
      toast.error('Failed to unlock video. Please try again.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete video "${video.title}"? This action cannot be undone.`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/videos/${video.id}`,
        { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        toast.success('Video deleted — moderation action logged');
        fetchVideos();
      } else {
        toast.error(data.error || 'Failed to delete video');
      }
    } catch {
      toast.error('Failed to delete video');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800';
      case 'intermediate': return darkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-800';
      case 'advanced': return darkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800';
      default: return darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'coco': return darkMode ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-800';
      case 'martial-arts': return darkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800';
      case 'calorie-fight': return darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800';
      default: return darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -5 }}
        onClick={handleCardClick}
        className={`rounded-lg shadow-md overflow-hidden cursor-pointer ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
      >
        {/* Thumbnail */}
        <div className="relative">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className={`w-full h-48 object-cover transition-all duration-300 ${isLocked ? 'blur-md scale-105' : ''}`}
          />

          {/* Lock overlay for premium unpurchased */}
          {isLocked && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
              <Lock className="h-10 w-10 text-white mb-2" />
              <span className="text-white font-semibold text-sm">Premium Content</span>
              <span className="text-yellow-300 text-xs mt-1 flex items-center">
                <Coins className="h-3 w-3 mr-1" />
                {video.tokenCost} tokens to unlock
              </span>
            </div>
          )}

          {/* Play Button Overlay — only for unlocked/free */}
          {!isLocked && (
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); handlePlay(); }}
                className={`bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-4 transition-all transform hover:scale-110 ${darkMode ? 'bg-gray-800 bg-opacity-90' : ''}`}
              >
                <Play className={`h-8 w-8 ml-1 ${darkMode ? 'text-white' : 'text-gray-800'}`} />
              </button>
            </div>
          )}

          {/* Duration */}
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {formatDuration(video.duration)}
          </div>

          {/* Premium Badge */}
          {isPremium && (
            <div className={`absolute top-2 left-2 ${isPurchased ? 'bg-green-500' : 'bg-purple-500'} text-white px-2 py-1 rounded-full text-xs flex items-center`}>
              {isPurchased ? (
                <><Unlock className="h-3 w-3 mr-1" />Unlocked</>
              ) : (
                <><Lock className="h-3 w-3 mr-1" />{video.tokenCost} tokens</>
              )}
            </div>
          )}

          {/* Free Badge */}
          {video.type === 'free' && (
            <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
              FREE
            </div>
          )}

          {/* Expert Delete Button */}
          {isExpert && (
            <button
              onClick={handleDelete}
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full shadow-lg transition-colors z-10"
              title="Delete video (Expert moderation)"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className={`font-semibold line-clamp-2 flex-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{video.title}</h3>
          </div>

          <p className={`text-sm mb-3 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{video.description}</p>

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
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{video.coach.fullName}</span>
            {video.coach.isVerified && (
              <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>

          {/* Stats and Actions */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{video.views.toLocaleString()}</span>
              </div>
              <button
                onClick={handleLike}
                className={`flex items-center space-x-1 transition-colors ${isLiked ? 'text-red-500' : darkMode ? 'hover:text-red-400' : 'hover:text-red-500'
                  }`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likesCount}</span>
              </button>
              <button
                onClick={handleShare}
                className={`flex items-center space-x-1 transition-colors ${darkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-500 hover:text-blue-500'}`}
              >
                <Share className="h-4 w-4" />
                <span>Share</span>
              </button>
            </div>

            {isLocked ? (
              <Button
                onClick={() => { setShowUnlockModal(true); }}
                size="sm"
                variant="secondary"
              >
                <Lock className="h-4 w-4 mr-1" />
                {video.tokenCost}
              </Button>
            ) : (
              <Button
                onClick={() => { handlePlay(); }}
                size="sm"
                variant="primary"
              >
                <Play className="h-4 w-4 mr-1" />
                Watch
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Unlock Confirmation Modal */}
      <AnimatePresence>
        {showUnlockModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
            onClick={() => setShowUnlockModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`rounded-xl shadow-2xl p-6 max-w-sm w-full ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Unlock Premium Video
                </h3>
                <button onClick={() => setShowUnlockModal(false)} className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-32 object-cover rounded-lg blur-sm"
                />
              </div>

              <p className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{video.title}</p>
              <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>by {video.coach.fullName}</p>

              <div className={`rounded-lg p-3 mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Cost:</span>
                  <span className="flex items-center text-yellow-500 font-bold">
                    <Coins className="h-4 w-4 mr-1" />
                    {video.tokenCost} tokens
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Your Balance:</span>
                  <span className={`font-bold ${userTokens.balance >= video.tokenCost ? 'text-green-500' : 'text-red-500'}`}>
                    {userTokens.balance} tokens
                  </span>
                </div>
              </div>

              {userTokens.balance < video.tokenCost && (
                <p className="text-red-500 text-sm mb-3">
                  You need {video.tokenCost - userTokens.balance} more tokens to unlock this video.
                </p>
              )}

              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowUnlockModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUnlock}
                  variant="primary"
                  className="flex-1"
                  disabled={userTokens.balance < video.tokenCost || isUnlocking}
                >
                  {isUnlocking ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Unlocking...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Unlock className="h-4 w-4 mr-1" />
                      Unlock Video
                    </span>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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