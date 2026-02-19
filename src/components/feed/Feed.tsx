import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PostCard } from '../posts/PostCard';
import { CreatePost } from '../posts/CreatePost';
import { Post } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';

export function Feed() {
  const { user, darkMode } = useAuthStore();
  const { posts, getFilteredPosts, addPost, fetchPosts, isLoadingPosts } = useAppStore();
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [feedFilter, setFeedFilter] = useState<'my-sport' | 'all-sports'>('all-sports');

  // Fetch real posts from Supabase on mount
  useEffect(() => {
    if (user) {
      fetchPosts(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      const userPosts = feedFilter === 'my-sport'
        ? getFilteredPosts(user.sportsCategory)
        : [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setFilteredPosts(userPosts);
    }
  }, [user, posts, getFilteredPosts, feedFilter]);

  const handlePostCreated = (newPost: Post) => {
    addPost(newPost);
  };

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto dark:bg-black min-h-screen p-4"
    >
      {/* Feed Filter */}
      <div className={`rounded-lg shadow-md p-4 mb-6 ${darkMode ? 'dark-card' : 'bg-white'}`}>
        <div className="flex items-center justify-center space-x-4 flex-wrap">
          <button
            onClick={() => setFeedFilter('my-sport')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors btn-press ${feedFilter === 'my-sport'
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            My Sport ({user.sportsCategory.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())})
          </button>
          <button
            onClick={() => setFeedFilter('all-sports')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors btn-press ${feedFilter === 'all-sports'
              ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            All Sports
          </button>
        </div>
      </div>

      {/* Hide CreatePost for experts — they can moderate but not create */}
      {user.role !== 'expert' && <CreatePost onPostCreated={handlePostCreated} />}

      <div className="space-y-6">
        {isLoadingPosts ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading posts...</p>
          </div>
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No posts yet</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {feedFilter === 'my-sport'
                ? `No posts from ${user.sportsCategory.replace('-', ' ')} coaches yet.`
                : 'No posts from any sport yet.'
              }
              {user.role === 'coach' && ' Be the first to share something amazing!'}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}