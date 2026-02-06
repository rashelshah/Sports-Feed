import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, Eye, Heart, Star, Filter, Coins, Radio } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { VideoCard } from './VideoCard';
import { TokenWallet } from './TokenWallet';
import { MembershipCard } from './MembershipCard';
import { LivestreamCard } from './LivestreamCard';
import { UploadVideoModal } from './UploadVideoModal';
import { WatchAdModal } from './WatchAdModal';
import { CreateMembershipModal } from './CreateMembershipModal';
import { CreateLivestreamModal } from './CreateLivestreamModal';
import { WomensLounge } from './WomensLounge';
import { Button } from '../ui/Button';

export function PlayPage() {
  const { user } = useAuthStore();
  const { videos, memberships, livestreams, getVideosByCategory, getMembershipsByCoach, getUserTokens, getLivestreams } = useAppStore();
  const [activeTab, setActiveTab] = useState<'videos' | 'memberships' | 'livestreams' | 'upload' | 'womens-lounge'>('videos');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'coco' | 'martial-arts' | 'calorie-fight'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'free' | 'premium'>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateMembershipModal, setShowCreateMembershipModal] = useState(false);
  const [showCreateLivestreamModal, setShowCreateLivestreamModal] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);

  if (!user) return null;

  const userTokens = getUserTokens(user.id);
  const filteredVideos = getVideosByCategory(categoryFilter === 'all' ? 'all' : categoryFilter)
    .filter(video => typeFilter === 'all' || video.type === typeFilter);

  const displayMemberships = user.role === 'coach' ? getMembershipsByCoach(user.id) : memberships;
  const displayLivestreams = getLivestreams ? getLivestreams(categoryFilter === 'all' ? 'all' : categoryFilter) : [];

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto"
    >
      {/* Header with Token Wallet */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Play & Learn</h1>
            <p className="text-gray-600">Watch videos, earn tokens, and unlock premium content</p>
          </div>
          
          <TokenWallet tokens={userTokens} />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('videos')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'videos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Play className="h-4 w-4 inline mr-2" />
              Videos ({filteredVideos.length})
            </button>
            
            <button
              onClick={() => setActiveTab('memberships')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'memberships'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Star className="h-4 w-4 inline mr-2" />
              {user.role === 'coach' ? 'My Memberships' : 'Memberships'} ({displayMemberships.length})
            </button>

            <button
              onClick={() => setActiveTab('livestreams')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'livestreams'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Radio className="h-4 w-4 inline mr-2" />
              Livestreams ({displayLivestreams.length})
            </button>

            <button
              onClick={() => setActiveTab('womens-lounge')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'womens-lounge'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Heart className="h-4 w-4 inline mr-2" />
              Women's Lounge
            </button>

            {user.role === 'coach' && (
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'upload'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Upload Content
              </button>
            )}
          </nav>
        </div>

        {/* Filters for Videos Tab */}
        {activeTab === 'videos' && (
          <div className="p-4 border-b border-gray-100">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>
              
              {/* Category Filter */}
              <div className="flex space-x-2">
                <span className="text-sm text-gray-600">Sport:</span>
                {['all', 'coco', 'martial-arts', 'calorie-fight'].map((category) => (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter(category as any)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      categoryFilter === category
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category === 'all' ? 'All Sports' : category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </button>
                ))}
              </div>
              
              {/* Type Filter */}
              <div className="flex space-x-2">
                <span className="text-sm text-gray-600">Type:</span>
                {['all', 'free', 'premium'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type as any)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      typeFilter === type
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'videos' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
              <VideoCard key={video.id} video={video} userTokens={userTokens} />
            ))}
            
            {filteredVideos.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No videos found</h3>
                <p className="text-gray-600">Try adjusting your filters or check back later for new content.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'memberships' && (
          <div className="space-y-6">
            {user.role === 'coach' && displayMemberships.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Coach Dashboard:</strong> These are the memberships you've created. Users can purchase these to access your exclusive content.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayMemberships.map((membership) => (
                <MembershipCard key={membership.id} membership={membership} userTokens={userTokens} />
              ))}

              {displayMemberships.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {user.role === 'coach' ? 'No memberships created yet' : 'No memberships available'}
                  </h3>
                  <p className="text-gray-600">
                    {user.role === 'coach'
                      ? 'Create your first membership to offer exclusive content to your followers.'
                      : 'Check back later for exclusive membership opportunities.'}
                  </p>
                  {user.role === 'coach' && (
                    <Button
                      onClick={() => setShowCreateMembershipModal(true)}
                      className="mt-4"
                    >
                      Create Your First Membership
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'livestreams' && (
          <div className="space-y-6">
            {user.role === 'coach' && (
              <div className="bg-red-50 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-800 font-medium">
                    <strong>Start a Livestream:</strong> Connect with your audience in real-time
                  </p>
                </div>
                <Button
                  onClick={() => setShowCreateLivestreamModal(true)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Radio className="h-4 w-4 mr-2" />
                  Go Live
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayLivestreams.map((livestream: any) => (
                <LivestreamCard key={livestream.id} livestream={livestream} />
              ))}

              {displayLivestreams.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Radio className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No livestreams available
                  </h3>
                  <p className="text-gray-600">
                    {user.role === 'coach'
                      ? 'Start your first livestream to connect with your audience.'
                      : 'Check back later for live training sessions.'}
                  </p>
                  {user.role === 'coach' && (
                    <Button
                      onClick={() => setShowCreateLivestreamModal(true)}
                      className="mt-4 bg-red-600 hover:bg-red-700"
                    >
                      <Radio className="h-4 w-4 mr-2" />
                      Start Livestream
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'womens-lounge' && (
          <WomensLounge />
        )}

        {activeTab === 'upload' && user.role === 'coach' && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="max-w-md mx-auto">
              <Play className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Your Content</h2>
              <p className="text-gray-600 mb-6">
                Share your expertise with the community. Upload training videos, create membership programs, or start a livestream.
              </p>

              <div className="space-y-4">
                <Button
                  onClick={() => setShowUploadModal(true)}
                  className="w-full"
                  size="lg"
                >
                  Upload Video
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={() => setShowCreateMembershipModal(true)}
                >
                  Create Membership
                </Button>

                <Button
                  variant="outline"
                  className="w-full bg-red-50 hover:bg-red-100 text-red-700 border-red-300"
                  size="lg"
                  onClick={() => setShowCreateLivestreamModal(true)}
                >
                  <Radio className="h-5 w-5 mr-2" />
                  Start Livestream
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadVideoModal
          onClose={() => setShowUploadModal(false)}
          coachId={user.id}
        />
      )}

      {/* Create Membership Modal */}
      {showCreateMembershipModal && (
        <CreateMembershipModal
          onClose={() => setShowCreateMembershipModal(false)}
          coachId={user.id}
        />
      )}

      {/* Create Livestream Modal */}
      {showCreateLivestreamModal && (
        <CreateLivestreamModal
          onClose={() => setShowCreateLivestreamModal(false)}
        />
      )}

      {/* Watch Ad Modal */}
      {showAdModal && (
        <WatchAdModal
          onClose={() => setShowAdModal(false)}
          userId={user.id}
        />
      )}
    </motion.div>
  );
}