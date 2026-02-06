import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, CreditCard as Edit, Users, UserPlus, Share, Shield, Upload, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { PostCard } from '../posts/PostCard';
import { EditProfileModal } from './EditProfileModal';
import { FollowersModal } from './FollowersModal';
import { SettingsModal } from './SettingsModal';
import { EvidenceUpload } from '../verification/EvidenceUpload';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

export function UserProfile() {
  const { user } = useAuthStore();
  const { posts, getUserPosts, getSharedPosts, getUserFollowers, getUserFollowing } = useAppStore();
  const [activeTab, setActiveTab] = useState<'posts' | 'shared'>('posts');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<'followers' | 'following'>('followers');
  const [showSettings, setShowSettings] = useState(false);
  const [showEvidenceUpload, setShowEvidenceUpload] = useState(false);

  if (!user) return null;

  const userPosts = getUserPosts(user.id);
  const sharedPosts = getSharedPosts(user.id);
  const followers = getUserFollowers(user.id);
  const following = getUserFollowing(user.id);

  const displayPosts = activeTab === 'posts' ? userPosts : sharedPosts;

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
    const shareText = `Check out ${user.fullName}'s profile on SportsFeed! ${user.role === 'coach' ? 'Professional Coach' : 'Athlete'} in ${user.sportsCategory.replace('-', ' ')}`;
    
    if (navigator.share) {
      navigator.share({
        title: `${user.fullName} - SportsFeed`,
        text: shareText,
        url: profileUrl,
      }).catch(() => {
        // Fallback to clipboard if share fails
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
    <div className="max-w-4xl mx-auto p-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-md p-6 mb-6"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
          {/* Profile Image */}
          <div className="relative">
            <img
              src={user.profileImage || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400'}
              alt={user.fullName}
              className="h-24 w-24 rounded-full object-cover border-4 border-gray-100"
            />
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{user.fullName}</h1>
              {getVerificationBadge()}
            </div>
            <p className="text-gray-600 mb-1">@{user.username}</p>
            <p className="text-sm text-gray-500 capitalize mb-3">{user.sportsCategory.replace('-', ' ')}</p>
            {user.bio && (
              <p className="text-gray-700 mb-4">{user.bio}</p>
            )}

            {/* Stats */}
            <div className="flex items-center space-x-6 mb-4">
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{userPosts.length}</p>
                <p className="text-sm text-gray-500">Posts</p>
              </div>
              <button
                onClick={handleFollowersClick}
                className="text-center hover:bg-gray-50 px-2 py-1 rounded transition-colors"
              >
                <p className="text-xl font-bold text-gray-900">{followers.length}</p>
                <p className="text-sm text-gray-500">Followers</p>
              </button>
              <button
                onClick={handleFollowingClick}
                className="text-center hover:bg-gray-50 px-2 py-1 rounded transition-colors"
              >
                <p className="text-xl font-bold text-gray-900">{following.length}</p>
                <p className="text-sm text-gray-500">Following</p>
              </button>
            </div>

            {/* Verification Status */}
            {user.role === 'aspirant' && (
              <div className="mb-4 p-3 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {user.verificationStatus === 'approved' && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {user.verificationStatus === 'rejected' && <XCircle className="h-5 w-5 text-red-500" />}
                    {user.verificationStatus === 'pending' && <Clock className="h-5 w-5 text-yellow-500" />}
                    <span className="font-medium text-gray-900">
                      Verification Status: 
                      <span className={`ml-2 capitalize ${
                        user.verificationStatus === 'approved' ? 'text-green-600' :
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
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Sport Role:</strong> {user.sportRole.name} 
                    {user.sportRole.isProfessional && <span className="text-blue-600 ml-1">(Professional)</span>}
                  </p>
                )}
              </div>
            )}

            {/* Sport Interests for Fans */}
            {user.role === 'fan' && user.sportInterests && user.sportInterests.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Sport Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {user.sportInterests.map((interest, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setShowEditModal(true)}
                variant="outline"
                size="sm"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button 
                onClick={() => setShowSettings(true)}
                variant="outline" 
                size="sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button 
                onClick={handleShareProfile}
                variant="outline" 
                size="sm"
              >
                <Share className="h-4 w-4 mr-2" />
                Share Profile
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Tab Headers */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'posts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Posts ({userPosts.length})
            </button>
            <button
              onClick={() => setActiveTab('shared')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'shared'
                  ? 'border-blue-500 text-blue-600'
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
              <div className="text-gray-400 mb-4">
                {activeTab === 'posts' ? (
                  <Users className="h-12 w-12 mx-auto" />
                ) : (
                  <UserPlus className="h-12 w-12 mx-auto" />
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === 'posts' ? 'No posts yet' : 'No shared posts yet'}
              </h3>
              <p className="text-gray-500">
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