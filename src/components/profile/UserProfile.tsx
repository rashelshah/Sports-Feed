import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Settings, CreditCard as Edit, Users, UserPlus, Share, Upload, Clock, CheckCircle, XCircle, Camera } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { PostCard } from '../posts/PostCard';
import { EditProfileModal } from './EditProfileModal';
import { FollowersModal } from './FollowersModal';
import { SettingsModal } from './SettingsModal';
import { EvidenceUpload } from '../verification/EvidenceUpload';
import { Button } from '../ui/Button';

import toast from 'react-hot-toast';
import { useFollowers, useFollowing } from '../../hooks/useFollow';
import { supabase } from '../../lib/supabase';

/** Compress image via off-screen canvas → returns base64 data URL */
function compressImage(file: File, maxWidth: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas not supported')); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function UserProfile() {
  const { user, darkMode } = useAuthStore();
  const { getUserPosts, getSharedPosts, updateUserInStore } = useAppStore();
  const [activeTab, setActiveTab] = useState<'posts' | 'shared'>('posts');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<'followers' | 'following'>('followers');
  const [showSettings, setShowSettings] = useState(false);
  const [showEvidenceUpload, setShowEvidenceUpload] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Use hooks for followers/following - provides instant counts from API
  const { followers, isLoading: followersLoading } = useFollowers(user?.id, 50);
  const { following, isLoading: followingLoading } = useFollowing(user?.id, 50);

  if (!user) return null;

  const userPosts = getUserPosts(user.id);
  const sharedPosts = getSharedPosts(user.id);
  const displayPosts = activeTab === 'posts' ? userPosts : sharedPosts;
  const canUploadCover = user.role !== 'admin' && user.role !== 'expert' && user.role !== 'administrator';

  const handleFollowersClick = () => {
    setFollowersModalType('followers');
    setShowFollowersModal(true);
  };

  const handleFollowingClick = () => {
    setFollowersModalType('following');
    setShowFollowersModal(true);
  };

  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/profile/${user.username}`;
    const shareText = `Check out ${user.fullName}'s profile on TubeLight Feed! ${user.role === 'coach' ? 'Professional Coach' : 'Athlete'} in ${user.sportsCategory.replace('-', ' ')}`;

    if (navigator.share) {
      navigator.share({
        title: `${user.fullName} - TubeLight Feed`,
        text: shareText,
        url: profileUrl,
      }).catch(() => {
        navigator.clipboard.writeText(profileUrl).then(() => {
          toast.success('Profile link copied to clipboard!');
        });
      });
    } else {
      navigator.clipboard.writeText(profileUrl).then(() => {
        toast.success('Profile link copied to clipboard!');
      });
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Cover image must be less than 5MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setIsUploadingCover(true);
    try {
      // Compress image via canvas → base64 data URL
      const dataUrl = await compressImage(file, 1200, 0.7);

      // Update profile in database directly
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cover_photo: dataUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        // Column might not exist — give helpful message
        if (updateError.message?.includes('cover_photo') || updateError.code === '42703') {
          toast.error('Please add a "cover_photo" text column to your profiles table in Supabase.');
        } else {
          toast.error('Failed to update cover photo');
        }
        return;
      }

      // Update local state
      const updatedUser = { ...user, coverPhoto: dataUrl };
      updateUserInStore(updatedUser);

      toast.success('Cover photo updated!');
    } catch (error: any) {
      console.error('Cover upload failed:', error);
      toast.error(error.message || 'Failed to upload cover photo');
    } finally {
      setIsUploadingCover(false);
      // Reset the file input
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const getVerificationBadge = () => {
    if (!user.isVerified) return null;
    const badgeColor = user.role === 'coach' ? 'text-purple-500' : 'text-blue-500';
    return (
      <svg className={`w-5 h-5 ${badgeColor}`} fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  return (
    <div className={`max-w-4xl mx-auto p-4 md:p-6 min-h-screen ${darkMode ? 'bg-black' : ''}`}>
      {/* ====== Facebook-Style Cover Photo Section ====== */}
      <div className="relative mb-14 md:mb-16">
        {/* Cover Image */}
        <div className="cover-photo-container">
          {user.coverPhoto ? (
            <img
              src={user.coverPhoto}
              alt="Cover"
              className="cover-img w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full ${darkMode ? 'bg-[#161616]' : 'bg-gray-200'}`} />
          )}
          <div className="cover-photo-overlay" />

          {/* Camera Upload Button — top-right */}
          {canUploadCover && (
            <>
              <button
                onClick={() => coverInputRef.current?.click()}
                className="cover-upload-btn"
                disabled={isUploadingCover}
                title="Upload cover photo"
              >
                {isUploadingCover ? (
                  <span className="animate-spin text-sm">⏳</span>
                ) : (
                  <Camera className="h-5 w-5" />
                )}
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
              />
            </>
          )}
        </div>

        {/* Profile Avatar — overlapping bottom-left */}
        <div className="cover-avatar">
          <img
            src={user.profileImage || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400'}
            alt={user.fullName}
          />
        </div>
      </div>

      {/* ====== Profile Info Section (below cover) ====== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-6 mb-6 ${darkMode ? 'surface-1' : 'bg-white shadow-md'}`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.fullName}</h1>
              {getVerificationBadge()}
            </div>
            <p className={`mb-1 ${darkMode ? 'text-secondary-d' : 'text-gray-600'}`}>@{user.username}</p>
            <p className={`text-sm capitalize mb-3 ${darkMode ? 'text-muted-d' : 'text-gray-500'}`}>{user.sportsCategory.replace('-', ' ')}</p>
            {user.bio && (
              <p className={`mb-4 ${darkMode ? 'text-secondary-d' : 'text-gray-700'}`}>{user.bio}</p>
            )}

            {/* Stats */}
            <div className="flex items-center space-x-6 mb-4">
              <div className="text-center">
                <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{userPosts.length}</p>
                <p className={`text-sm ${darkMode ? 'text-muted-d' : 'text-gray-500'}`}>Posts</p>
              </div>
              <button
                onClick={handleFollowersClick}
                className={`text-center px-2 py-1 rounded transition-colors ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
              >
                <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {followersLoading ? '...' : followers.length}
                </p>
                <p className={`text-sm ${darkMode ? 'text-muted-d' : 'text-gray-500'}`}>Followers</p>
              </button>
              <button
                onClick={handleFollowingClick}
                className={`text-center px-2 py-1 rounded transition-colors ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
              >
                <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {followingLoading ? '...' : following.length}
                </p>
                <p className={`text-sm ${darkMode ? 'text-muted-d' : 'text-gray-500'}`}>Following</p>
              </button>
            </div>

            {/* Verification Status */}
            {user.role === 'aspirant' && (
              <div className={`mb-4 p-3 rounded-lg border ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {user.verificationStatus === 'approved' && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {user.verificationStatus === 'rejected' && <XCircle className="h-5 w-5 text-red-500" />}
                    {user.verificationStatus === 'pending' && <Clock className="h-5 w-5 text-yellow-500" />}
                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Verification Status:
                      <span className={`ml-2 capitalize ${user.verificationStatus === 'approved' ? 'text-green-600' :
                        user.verificationStatus === 'rejected' ? 'text-red-600' :
                          'text-yellow-600'
                        }`}>
                        {user.verificationStatus}
                      </span>
                    </span>
                  </div>
                  {user.verificationStatus === 'pending' && (
                    <Button
                      onClick={() => setShowEvidenceUpload(true)}
                      size="sm"
                      variant="outline"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Evidence
                    </Button>
                  )}
                </div>
                {user.sportRole && (
                  <p className={`text-sm mt-2 ${darkMode ? 'text-secondary-d' : 'text-gray-600'}`}>
                    <strong>Sport Role:</strong> {user.sportRole.name}
                    {user.sportRole.isProfessional && <span className="text-blue-600 ml-1">(Professional)</span>}
                  </p>
                )}
              </div>
            )}

            {/* Sport Interests for Fans */}
            {user.role === 'fan' && user.sportInterests && user.sportInterests.length > 0 && (
              <div className="mb-4">
                <h3 className={`text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Sport Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {user.sportInterests.map((interest, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <button
                onClick={() => setShowEditModal(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${darkMode
                  ? 'border-white/20 text-white hover:bg-white/10'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Edit className="h-4 w-4 flex-shrink-0" />
                <span className="hidden xs:inline sm:inline">Edit Profile</span>
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${darkMode
                  ? 'border-white/20 text-white hover:bg-white/10'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Settings className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Settings</span>
              </button>
              <button
                onClick={handleShareProfile}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${darkMode
                  ? 'border-white/20 text-white hover:bg-white/10'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Share className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ====== Content Tabs ====== */}
      <div className={`rounded-2xl overflow-hidden ${darkMode ? 'surface-1' : 'bg-white shadow-md'}`}>
        {/* Tab Headers */}
        <div className={`border-b ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
          <nav className="flex">
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'posts'
                ? 'border-blue-500 text-blue-500'
                : darkMode
                  ? 'border-transparent text-white/50 hover:text-white/70 hover:border-white/20'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Posts ({userPosts.length})
            </button>
            <button
              onClick={() => setActiveTab('shared')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'shared'
                ? 'border-blue-500 text-blue-500'
                : darkMode
                  ? 'border-transparent text-white/50 hover:text-white/70 hover:border-white/20'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Shared ({sharedPosts.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {displayPosts.length > 0 ? (
            <div className="space-y-6">
              {displayPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className={`mb-4 ${darkMode ? 'text-white/30' : 'text-gray-400'}`}>
                {activeTab === 'posts' ? (
                  <Users className="h-12 w-12 mx-auto" />
                ) : (
                  <UserPlus className="h-12 w-12 mx-auto" />
                )}
              </div>
              <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {activeTab === 'posts' ? 'No posts yet' : 'No shared posts yet'}
              </h3>
              <p className={`${darkMode ? 'text-muted-d' : 'text-gray-500'}`}>
                {activeTab === 'posts'
                  ? 'Start sharing your thoughts and experiences!'
                  : 'Share posts from other users to see them here.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showEditModal && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {showFollowersModal && (
        <FollowersModal
          users={followersModalType === 'followers' ? followers : following}
          type={followersModalType}
          onClose={() => setShowFollowersModal(false)}
          onUserUnfollowed={(userId) => {
            // The useFollowing hook will auto-refresh
          }}
        />
      )}

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {showEvidenceUpload && (
        <EvidenceUpload
          onClose={() => setShowEvidenceUpload(false)}
          sportRole={user.sportRole}
        />
      )}
    </div>
  );
}