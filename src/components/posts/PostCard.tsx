import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share, MoreHorizontal, Send, Volume2, Edit, Trash2, Check, X, Loader2 } from 'lucide-react';
import { Post } from '../../types';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useAuthStore();
  const { likePost, updatePostShares, addSharedPost, addComment, getPostComments, addNotification, updatePostContent, deletePost } = useAppStore();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [sharesCount, setSharesCount] = useState(post.shares);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fetchedComments, setFetchedComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const localComments = getPostComments(post.id);

  // Fetch comments from API when comments section is opened
  useEffect(() => {
    if (!showComments) return;

    const fetchComments = async () => {
      setIsLoadingComments(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/posts/${post.id}/comments`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await response.json();
        if (data.success && data.comments) {
          const mapped = data.comments.map((c: any) => ({
            id: c.id,
            postId: post.id,
            userId: c.user?.id || c.user_id,
            user: {
              id: c.user?.id || c.user_id,
              username: c.user?.username || c.user?.name || 'Unknown',
              fullName: c.user?.name || 'Unknown',
              email: '',
              profileImage: c.user?.avatar_url || null,
              sportsCategory: 'unstructured-sports',
              gender: 'prefer-not-to-say' as const,
              role: c.user?.role || 'athlete',
              isVerified: c.user?.is_verified || false,
              bio: '',
              followers: 0,
              following: 0,
              posts: 0,
              createdAt: c.created_at
            },
            content: c.content,
            likes: 0,
            createdAt: c.created_at
          }));
          setFetchedComments(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch comments:', err);
      } finally {
        setIsLoadingComments(false);
      }
    };

    fetchComments();
  }, [showComments, post.id]);

  // Merge fetched comments with locally added comments (avoid duplicates)
  const allComments = [...fetchedComments];
  localComments.forEach(lc => {
    if (!allComments.find(fc => fc.id === lc.id)) {
      allComments.push(lc);
    }
  });
  const comments = allComments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const handleLike = async () => {
    if (!user) {
      toast.error('You must be logged in to like posts');
      return;
    }

    const newIsLiked = !isLiked;
    const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1;

    // Optimistic update
    setIsLiked(newIsLiked);
    setLikesCount(newLikesCount);

    try {
      // Call API to persist the like
      await likePost(post.id, user.id);
    } catch (error) {
      // Revert on error
      setIsLiked(!newIsLiked);
      setLikesCount(likesCount);
    }
  };

  const handleShare = () => {
    if (!user) return;

    const shareUrl = `${window.location.origin}/post/${post.id}`;
    const shareText = `Check out this post by ${post.user.fullName}: "${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}"`;

    // Helper to increment share count and notify only after actual share
    const onShareSuccess = (message: string) => {
      const newSharesCount = sharesCount + 1;
      setSharesCount(newSharesCount);
      updatePostShares(post.id, newSharesCount);
      addSharedPost(user.id, post.id);
      toast.success(message);

      // Add notification if not own post
      if (user.id !== post.userId) {
        addNotification({
          id: Date.now().toString(),
          userId: post.userId,
          type: 'share',
          message: `${user.fullName} shared your post`,
          isRead: false,
          createdAt: new Date().toISOString(),
          fromUser: user,
        });
      }
    };

    if (navigator.share) {
      navigator.share({
        title: `Post by ${post.user.fullName}`,
        text: shareText,
        url: shareUrl,
      }).then(() => {
        onShareSuccess('Post shared successfully!');
      }).catch(() => {
        // User cancelled native share — fallback to clipboard
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`).then(() => {
          onShareSuccess('Post link copied to clipboard!');
        });
      });
    } else {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`).then(() => {
        onShareSuccess('Post link copied to clipboard!');
      }).catch(() => {
        // Even clipboard failed, but we still count it
        onShareSuccess('Post shared!');
      });
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim() || !user) return;

    setIsCommenting(true);

    try {
      // Call the API to add comment
      const comment = await addComment(post.id, newComment.trim());

      if (comment) {
        setNewComment('');
        toast.success('Comment added!');
      }
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsCommenting(false);
    }
  };
  const getVerificationBadge = () => {
    if (!post.user.isVerified) return null;

    const badgeColor = post.user.role === 'coach' ? 'text-purple-500' : 'text-blue-500';

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
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6 post-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <img
            src={post.user.profileImage || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400'}
            alt={post.user.fullName}
            className="h-10 w-10 rounded-full object-cover"
          />
          <div>
            <div className="flex items-center space-x-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">{post.user.username}</h3>
              {getVerificationBadge()}

            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{post.user.sportsCategory.replace('-', ' ')}</p>
          </div>
        </div>

        <div className="relative">
          <button
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Post options"
            aria-label="Post options"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
          {menuOpen && user && (user.id === post.userId || user.role === 'administrator' || user.role === 'admin' || user.role === 'expert') && (
            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
              <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                onClick={() => { setIsEditing(true); setMenuOpen(false); }}
              >
                <Edit className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="dark:text-gray-200">Edit text</span>
              </button>
              <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={async () => {
                  if (confirm('Delete this post?')) {
                    setIsDeleting(true);
                    try {
                      await deletePost(post.id);
                      // Show moderation message for expert deletion
                      if (user.role === 'expert' && user.id !== post.userId) {
                        toast.success('Post removed by moderation');
                      }
                    } finally {
                      setIsDeleting(false);
                    }
                  }
                  setMenuOpen(false);
                }}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>{isDeleting ? 'Deleting...' : 'Delete post'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
            <div className="flex items-center space-x-2 justify-end">
              <button
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center space-x-1"
                onClick={() => { setIsEditing(false); setEditedContent(post.content); }}
                title="Cancel"
                aria-label="Cancel edit"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
              <button
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={async () => {
                  setIsSavingEdit(true);
                  try {
                    await updatePostContent(post.id, editedContent);
                    setIsEditing(false);
                  } finally {
                    setIsSavingEdit(false);
                  }
                }}
                disabled={isSavingEdit}
                title="Save"
                aria-label="Save edit"
              >
                {isSavingEdit ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <span>{isSavingEdit ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </div>
        ) : (
          post.content && <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{post.content}</p>
        )}
      </div>

      {/* Voice Note */}
      {post.audioUrl && (
        <div className="px-4 pb-3">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/30 dark:to-blue-900/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 bg-green-500 p-2 rounded-full">
                <Volume2 className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Voice Note</p>
                <audio
                  src={post.audioUrl}
                  controls
                  className="w-full h-10"
                  style={{ maxWidth: '100%' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media */}
      {post.mediaUrl && post.mediaType !== 'audio' && (
        <div className="relative">
          {post.mediaType === 'video' ? (
            <video
              src={post.mediaUrl}
              className="w-full h-80 object-cover"
              controls
            />
          ) : (
            <img
              src={post.mediaUrl}
              alt="Post content"
              className="w-full h-80 object-cover"
            />
          )}
        </div>
      )}

      {/* Audio as primary media (no separate audioUrl) */}
      {post.mediaUrl && post.mediaType === 'audio' && !post.audioUrl && (
        <div className="px-4 pb-3">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/30 dark:to-blue-900/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 bg-green-500 p-2 rounded-full">
                <Volume2 className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Voice Note</p>
                <audio
                  src={post.mediaUrl}
                  controls
                  className="w-full h-10"
                  style={{ maxWidth: '100%' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3 sm:space-x-6">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleLike}
              className={`flex items-center space-x-1.5 sm:space-x-2 transition-colors ${isLiked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
                }`}
            >
              <Heart className={`h-5 w-5 sm:h-6 sm:w-6 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{likesCount}</span>
            </motion.button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-1.5 sm:space-x-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-sm font-medium">{post.comments}</span>
            </button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
              className="flex items-center space-x-1.5 sm:space-x-2 text-gray-500 dark:text-gray-400 hover:text-green-500 transition-colors"
            >
              <Share className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-sm font-medium">{sharesCount}</span>
            </motion.button>
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(post.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      {/* Comments Section */}
      {showComments && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-gray-100 dark:border-gray-700 p-4"
        >
          {/* Comment Form */}
          {user && (
            <form onSubmit={handleComment} className="mb-4">
              <div className="flex items-start space-x-3">
                <img
                  src={user.profileImage || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400'}
                  alt={user.fullName}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!newComment.trim()}
                      loading={isCommenting}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Comment
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* Comments List */}
          <div className="space-y-3">
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start space-x-3"
              >
                <img
                  src={comment.user.profileImage || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400'}
                  alt={comment.user.fullName}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center space-x-1 mb-1">
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{comment.user.fullName}</p>
                      {comment.user.isVerified && (
                        <svg className={`w-3 h-3 ${comment.user.role === 'coach' ? 'text-purple-500' : 'text-blue-500'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-3">
                    {new Date(comment.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </motion.div>
            ))}

            {isLoadingComments ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-400 dark:text-gray-500 text-sm">Loading comments...</p>
              </div>
            ) : comments.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                No comments yet. Be the first to comment!
              </p>
            ) : null}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}