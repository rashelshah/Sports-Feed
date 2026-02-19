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
  const { user: currentUser, darkMode } = useAuthStore();
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
    const shareText = `Check out ${profile.full_name}'s profile on TubeLight Feed! ${profile.role === 'coach' ? 'Professional Coach' : 'Athlete'} in ${profile.sports_category.replace('-', ' ')}`;

    if (navigator.share) {
      navigator.share({
        title: `${profile.full_name} - TubeLight Feed`,
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
      <div className={`max-w-4xl mx-auto p-6 flex items-center justify-center min-h-[400px] ${darkMode ? 'bg-black' : ''}`}>
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={`max-w-4xl mx-auto p-6 ${darkMode ? 'bg-black min-h-screen' : ''}`}>
        <div className={`rounded-lg shadow-md p-8 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Profile not found</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className={`max-w-4xl mx-auto p-6 ${darkMode ? 'bg-black min-h-screen' : ''}`}>
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-lg shadow-md p-6 mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
          {/* Profile Image */}
          <div className="relative">
            <img
              src={profile.profile_image || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400'}
              alt={profile.full_name}
              className={`h-24 w-24 rounded-full object-cover border-4 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}
            />
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{profile.full_name}</h1>
              {getVerificationBadge()}
            </div>
            <p className={darkMode ? 'text-gray-400 mb-1' : 'text-gray-600 mb-1'}>@{profile.username}</p>
            <p className={`text-sm capitalize mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{profile.sports_category.replace('-', ' ')}</p>
            {profile.bio && (
              <p className={darkMode ? 'text-gray-300 mb-4' : 'text-gray-700 mb-4'}>{profile.bio}</p>
            )}

            {/* Stats */}
            <div className="flex items-center space-x-6 mb-4">
              <div className="text-center">
                <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{profile.posts}</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Posts</p>
              </div>
              <button
                onClick={handleFollowersClick}
                className={`text-center px-2 py-1 rounded transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
              >
                <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{profile.followers}</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Followers</p>
              </button>
              <button
                onClick={handleFollowingClick}
                className={`text-center px-2 py-1 rounded transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
              >
                <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{profile.following}</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Following</p>
              </button>
            </div>

            {/* Sport Interests for Fans */}
            {profile.role === 'fan' && profile.sport_interests && profile.sport_interests.length > 0 && (
              <div className="mb-4">
                <h3 className={`text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Sport Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.sport_interests.map((interest, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 text-xs rounded-full ${darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'}`}
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
                    className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${darkMode
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
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
                className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium border transition-colors ${darkMode
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Share className="h-5 w-5" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content Tabs */}
      <div className={`rounded-lg shadow-md overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Tab Headers */}
        <div className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <nav className="flex">
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'posts'
                ? 'border-blue-500 text-blue-600'
                : (darkMode ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')
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
            <div className={darkMode ? 'text-gray-600 mb-4' : 'text-gray-400 mb-4'}>
              <Users className="h-12 w-12 mx-auto" />
            </div>
            <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Posts</h3>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
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
