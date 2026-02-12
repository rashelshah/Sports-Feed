import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Share, MessageCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { FollowersModal } from './FollowersModal';
import { ProfileFollowButton } from './FollowButton';
import { useFollowers, useFollowing } from '../../hooks/useFollow';
import { findOrCreateDirectConversation } from '../../hooks/useMessaging';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

interface PublicProfileProps {
  userId: string;
}

interface ProfileData {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: string;
  sports_category: string;
  gender: string;
  profile_image?: string;
  bio?: string;
  followers: number;
  following: number;
  posts: number;
  is_verified: boolean;
  sport_interests?: string[];
}

export function PublicProfile({ userId }: PublicProfileProps) {
  const { user: currentUser } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts'>('posts');
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<'followers' | 'following'>('followers');
  const [isStartingChat, setIsStartingChat] = useState(false);

  // Use hooks for followers/following lists
  const { 
    followers 
  } = useFollowers(userId, 50);
  
  const { 
    following: followingList 
  } = useFollowing(userId, 50);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        setProfile(data as ProfileData);
      } catch (err) {
        console.error('Error fetching profile:', err);
        toast.error('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleFollowersClick = () => {
    setFollowersModalType('followers');
    setShowFollowersModal(true);
  };

  const handleFollowingClick = () => {
    setFollowersModalType('following');
    setShowFollowersModal(true);
  };

  const handleShareProfile = () => {
    if (!profile) return;

    const shareUrl = `${window.location.origin}/profile/${profile.username}`;
    const shareText = `Check out ${profile.full_name}'s profile on SportsFeed! ${profile.role === 'coach' ? 'Professional Coach' : 'Athlete'} in ${profile.sports_category.replace('-', ' ')}`;

    if (navigator.share) {
      navigator.share({
        title: `${profile.full_name} - SportsFeed`,
        text: shareText,
        url: shareUrl,
      }).catch(() => {
        navigator.clipboard.writeText(shareUrl).then(() => {
          toast.success('Profile link copied to clipboard!');
        });
      });
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast.success('Profile link copied to clipboard!');
      });
    }
  };

  const handleMessageClick = async () => {
    if (!currentUser || !profile) return;

    setIsStartingChat(true);
    try {
      const conversationId = await findOrCreateDirectConversation(currentUser.id, profile.id);
      if (conversationId) {
        // Navigate to messages page with this conversation
        window.location.href = `/messages?conversation=${conversationId}`;
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Unable to start conversation. You may need to follow this user first.');
    } finally {
      setIsStartingChat(false);
    }
  };

  const getVerificationBadge = () => {
    if (!profile?.is_verified) return null;

    const badgeColor = profile.role === 'coach' ? 'text-purple-500' : 'text-blue-500';

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

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500">Profile not found</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

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
              src={profile.profile_image || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400'}
              alt={profile.full_name}
              className="h-24 w-24 rounded-full object-cover border-4 border-gray-100"
            />
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{profile.full_name}</h1>
              {getVerificationBadge()}
            </div>
            <p className="text-gray-600 mb-1">@{profile.username}</p>
            <p className="text-sm text-gray-500 capitalize mb-3">{profile.sports_category.replace('-', ' ')}</p>
            {profile.bio && (
              <p className="text-gray-700 mb-4">{profile.bio}</p>
            )}

            {/* Stats */}
            <div className="flex items-center space-x-6 mb-4">
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{profile.posts}</p>
                <p className="text-sm text-gray-500">Posts</p>
              </div>
              <button
                onClick={handleFollowersClick}
                className="text-center hover:bg-gray-50 px-2 py-1 rounded transition-colors"
              >
                <p className="text-xl font-bold text-gray-900">{profile.followers}</p>
                <p className="text-sm text-gray-500">Followers</p>
              </button>
              <button
                onClick={handleFollowingClick}
                className="text-center hover:bg-gray-50 px-2 py-1 rounded transition-colors"
              >
                <p className="text-xl font-bold text-gray-900">{profile.following}</p>
                <p className="text-sm text-gray-500">Following</p>
              </button>
            </div>

            {/* Sport Interests for Fans */}
            {profile.role === 'fan' && profile.sport_interests && profile.sport_interests.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Sport Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.sport_interests.map((interest, index) => (
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
              {!isOwnProfile && (
                <>
                  <ProfileFollowButton
                    targetUserId={profile.id}
                    targetUserName={profile.full_name}
                    onFollowersCountChange={(increment) => {
                      // Optimistic update
                      setProfile(prev => prev ? {
                        ...prev,
                        followers: prev.followers + increment
                      } : null);
                      // Refresh profile after a short delay to sync with server
                      setTimeout(() => {
                        const refreshProfile = async () => {
                          try {
                            const { data } = await supabase
                              .from('profiles')
                              .select('*')
                              .eq('id', userId)
                              .single();
                            if (data) setProfile(data as ProfileData);
                          } catch (err) {
                            console.error('Error refreshing profile:', err);
                          }
                        };
                        refreshProfile();
                      }, 500);
                    }}
                  />
                  
                  <button
                    onClick={handleMessageClick}
                    disabled={isStartingChat}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {isStartingChat ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <MessageCircle className="h-5 w-5" />
                    )}
                    <span>Message</span>
                  </button>
                </>
              )}
              
              <button
                onClick={handleShareProfile}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Share className="h-5 w-5" />
                <span>Share</span>
              </button>
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
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'posts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Posts ({profile.posts})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Posts would be fetched and displayed here */}
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Users className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Posts</h3>
            <p className="text-gray-500">
              View all posts from this user
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showFollowersModal && (
        <FollowersModal
          users={followersModalType === 'followers' ? followers : followingList}
          type={followersModalType}
          onClose={() => setShowFollowersModal(false)}
        />
      )}
    </div>
  );
}
