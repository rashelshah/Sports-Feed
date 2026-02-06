import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Users, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { User } from '../../types';
import { Button } from '../ui/Button';

export function DiscoverPage() {
  const { user } = useAuthStore();
  const { users, isFollowing, followUser, unfollowUser } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'coaches' | 'users'>('all');
  const [sportFilter, setSportFilter] = useState<'all' | 'coco' | 'martial-arts' | 'calorie-fight'>('all');

  if (!user) return null;

  const allUsers = users.filter(u => u.id !== user.id);

  const searchResults = allUsers.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.bio?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterType === 'all' ||
                         (filterType === 'coaches' && u.role === 'coach') ||
                         (filterType === 'users' && u.role === 'user');

    const matchesSport = sportFilter === 'all' || u.sportsCategory === sportFilter;

    return matchesSearch && matchesFilter && matchesSport;
  });

  const handleFollow = (userId: string) => {
    if (!user) return;

    if (isFollowing(user.id, userId)) {
      unfollowUser(user.id, userId);
    } else {
      followUser(user.id, userId);
    }
  };

  const getVerificationBadge = (targetUser: User) => {
    if (!targetUser.isVerified) return null;
    
    const badgeColor = targetUser.role === 'coach' ? 'text-purple-500' : 'text-blue-500';
    
    return (
      <svg className={`w-4 h-4 ${badgeColor}`} fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Discover Sports Community
        </h1>
        
        {/* Search and Filter */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search athletes and coaches from all sports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Role Filter */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 self-center">Role:</span>
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('coaches')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'coaches'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Coaches
            </button>
            <button
              onClick={() => setFilterType('users')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'users'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Athletes
            </button>
          </div>
          
          {/* Sport Filter */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 self-center">Sport:</span>
            <button
              onClick={() => setSportFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sportFilter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Sports
            </button>
            <button
              onClick={() => setSportFilter('coco')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sportFilter === 'coco'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Coco
            </button>
            <button
              onClick={() => setSportFilter('martial-arts')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sportFilter === 'martial-arts'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Martial Arts
            </button>
            <button
              onClick={() => setSportFilter('calorie-fight')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sportFilter === 'calorie-fight'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Calorie Fight
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{allUsers.length}</p>
            <p className="text-sm text-blue-600">Total Members</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">
              {allUsers.filter(u => u.role === 'coach').length}
            </p>
            <p className="text-sm text-purple-600">Coaches</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <Users className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">
              {allUsers.filter(u => u.role === 'user').length}
            </p>
            <p className="text-sm text-green-600">Athletes</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <TrendingUp className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-600">3</p>
            <p className="text-sm text-yellow-600">Sports</p>
          </div>
        </div>
      </div>

      {/* User Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {searchResults.map((targetUser) => (
          <motion.div
            key={targetUser.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -5 }}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
              <img
                src={targetUser.profileImage}
                alt={targetUser.fullName}
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 h-20 w-20 rounded-full border-4 border-white object-cover"
              />
            </div>
            
            <div className="pt-12 p-6 text-center">
              <div className="flex items-center justify-center space-x-1 mb-2">
                <h3 className="font-semibold text-gray-900">{targetUser.fullName}</h3>
                {getVerificationBadge(targetUser)}
              </div>
              
              <p className="text-gray-600 text-sm mb-1">@{targetUser.username}</p>
              
              <div className="flex flex-col items-center space-y-1 mb-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  targetUser.role === 'coach' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {targetUser.role.charAt(0).toUpperCase() + targetUser.role.slice(1)}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  targetUser.sportsCategory === 'coco' ? 'bg-orange-100 text-orange-800' :
                  targetUser.sportsCategory === 'martial-arts' ? 'bg-red-100 text-red-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {targetUser.sportsCategory.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
              
              {targetUser.bio && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{targetUser.bio}</p>
              )}
              
              <div className="flex justify-center space-x-4 mb-4 text-sm">
                <div className="text-center">
                  <p className="font-bold text-gray-900">{targetUser.posts}</p>
                  <p className="text-gray-600">Posts</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-900">{targetUser.followers}</p>
                  <p className="text-gray-600">Followers</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-900">{targetUser.following}</p>
                  <p className="text-gray-600">Following</p>
                </div>
              </div>
              
              <Button
                onClick={() => handleFollow(targetUser.id)}
                size="sm"
                className="w-full"
                variant={targetUser.role === 'coach' ? 'secondary' : 'primary'}
              >
                {user && isFollowing(user.id, targetUser.id) ? 'Following' : 'Follow'}
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {searchResults.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-white rounded-lg shadow-md"
        >
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-600">
            Try adjusting your search or filter criteria
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}