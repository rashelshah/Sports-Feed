import { create } from 'zustand';
import { User, Post, Comment, Message, Conversation, Video, Membership, UserTokens, TokenTransaction, LocationCheckIn, SafeLocation, HeatMapData, Event } from '../types';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// Helper: map a raw Supabase profile/user row to the frontend User type
function mapDbUserToUser(row: any): User {
  return {
    id: row.id,
    email: row.email ?? '',
    username: row.username ?? row.name ?? '',
    fullName: row.full_name ?? row.name ?? '',
    role: row.role ?? 'user',
    sportsCategory: row.sports_category ?? 'coco',
    gender: row.gender ?? 'prefer-not-to-say',
    isVerified: row.is_verified ?? (row.verification_status === 'approved') ?? false,
    profileImage: row.profile_image ?? row.profile_image ?? undefined,
    bio: row.bio ?? undefined,
    followers: row.followers_count ?? row.followers ?? 0,
    following: row.following_count ?? row.following ?? 0,
    posts: row.posts_count ?? row.posts ?? 0,
    createdAt: row.created_at ?? new Date().toISOString(),
    sharedPosts: [],
    accessibilityNeeds: row.accessibility_needs ?? [],
    preferredAccommodations: row.preferred_accommodations ?? [],
    sportRole: row.sport_role ?? undefined,
    sportInterests: row.sport_interests ?? [],
    isProfessional: row.is_professional ?? false,
    verificationStatus: row.verification_status ?? 'approved',
  };
}

// Helper: map a raw Supabase post row to the frontend Post type
function mapDbPostToPost(row: any, currentUserId?: string): Post {
  // Handle author being an array (PostgREST can return this with views)
  const rawAuthor = row.author;
  const author = Array.isArray(rawAuthor) ? rawAuthor[0] : rawAuthor;
  return {
    id: row.id,
    userId: row.author_id,
    user: author ? mapDbUserToUser(author) : {
      id: row.author_id,
      email: '',
      username: 'unknown',
      fullName: 'Unknown User',
      role: 'user',
      sportsCategory: 'coco',
      gender: 'prefer-not-to-say',
      isVerified: false,
      followers: 0,
      following: 0,
      posts: 0,
      createdAt: new Date().toISOString(),
    },
    content: row.content ?? '',
    mediaUrl: row.media_urls?.[0] ?? undefined,
    mediaType: row.media_urls?.[0] ? 'image' : undefined,
    likes: typeof row.likes === 'number' ? row.likes : row.likes?.[0]?.count ?? row.likes_count ?? 0,
    comments: typeof row.comments === 'number' ? row.comments : row.comments?.[0]?.count ?? row.comments_count ?? 0,
    shares: typeof row.shares === 'number' ? row.shares : row.shares?.[0]?.count ?? row.shares_count ?? 0,
    isLiked: currentUserId ? (row.user_liked?.some?.((l: any) => l.user_id === currentUserId) ?? row.isLikedByUser ?? false) : false,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

interface AppState {
  currentView: 'home' | 'discover' | 'notifications' | 'messages' | 'profile' | 'expert' | 'play' | 'map';
  posts: Post[];
  users: User[];
  isLoadingPosts: boolean;
  isLoadingUsers: boolean;
  comments: Comment[];
  conversations: Conversation[];
  messages: Message[];
  notifications: Notification[];
  videos: Video[];
  memberships: Membership[];
  userTokens: UserTokens[];
  userFollowing: { followerId: string; followingId: string }[];
  setCurrentView: (view: AppState['currentView']) => void;
  fetchPosts: (currentUserId?: string) => Promise<void>;
  fetchUsers: () => Promise<void>;
  addPost: (post: Post) => void;
  updatePostContent: (postId: string, content: string) => void;
  deletePost: (postId: string) => void;
  updatePostLikes: (postId: string, likes: number, isLiked: boolean) => void;
  updatePostShares: (postId: string, shares: number) => void;
  addSharedPost: (userId: string, postId: string) => void;
  getSharedPosts: (userId: string) => Post[];
  addComment: (postId: string, content: string) => Promise<any>;
  getPostComments: (postId: string) => Comment[];
  getFilteredPosts: (userSportsCategory: string) => Post[];
  getFilteredUsers: (userSportsCategory: string) => User[];
  getUserPosts: (userId: string) => Post[];
  getUserFollowers: (userId: string) => Promise<User[]>;
  getUserFollowing: (userId: string) => Promise<User[]>;
  addMessage: (message: Message) => void;
  getConversations: (userId: string, userSportsCategory: string | 'all') => Conversation[];
  addNotification: (notification: Notification) => void;
  markNotificationAsRead: (notificationId: string) => void;
  updateUserInStore: (updatedUser: User) => void;
  followUser: (userId: string, targetUserId: string) => Promise<void>;
  unfollowUser: (userId: string, targetUserId: string) => Promise<void>;
  isFollowing: (userId: string, targetUserId: string) => Promise<boolean>;
  likePost: (postId: string, userId: string) => Promise<void>;
  watchAd: (userId: string) => void;
  addVideo: (video: Video) => void;
  getVideosByCategory: (category: string) => Video[];
  getVideosByCoach: (coachId: string) => Video[];
  likeVideo: (videoId: string, userId: string) => void;
  watchVideo: (videoId: string, userId: string) => void;
  getUserTokens: (userId: string) => UserTokens;
  addTokens: (userId: string, amount: number, reason: string, description: string) => void;
  spendTokens: (userId: string, amount: number, reason: string, description: string) => boolean;
  purchaseTokens: (userId: string, amount: number, price: number) => void;
  addMembership: (membership: Membership) => void;
  getMembershipsByCoach: (coachId: string) => Membership[];
  livestreams: any[];
  addLivestream: (livestream: any) => void;
  getLivestreams: (category: string) => any[];
  // Map and location features
  locationCheckIns: LocationCheckIn[];
  safeLocations: SafeLocation[];
  heatMapData: HeatMapData[];
  events: Event[];
  addLocationCheckIn: (checkIn: LocationCheckIn) => void;
  addSafeLocation: (location: SafeLocation) => void;
  updateHeatMapData: (data: HeatMapData) => void;
  addEvent: (event: Event) => void;
  getEventsByLocation: (locationId: string) => Event[];
  getEventsByCategory: (category: string) => Event[];
}

interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'verification';
  message: string;
  isRead: boolean;
  createdAt: string;
  fromUser?: User;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentView: 'home',
  posts: [],
  users: [],
  isLoadingPosts: false,
  isLoadingUsers: false,
  comments: [],
  conversations: [],
  messages: [],
  notifications: [],
  videos: [],
  memberships: [],
  userTokens: [],
  userFollowing: [],
  livestreams: [],
  locationCheckIns: [],
  safeLocations: [],
  heatMapData: [],
  events: [],

  setCurrentView: (view) => set({ currentView: view }),

  // Fetch real posts from Supabase
  fetchPosts: async (currentUserId?: string) => {
    const { isLoadingPosts } = get();
    if (isLoadingPosts) return;
    set({ isLoadingPosts: true });
    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!author_id(
            id,
            email,
            username,
            full_name,
            role,
            sports_category,
            gender,
            profile_image,
            bio,
            created_at
          ),
          likes:post_likes(count),
          shares:post_shares(count),
          comments(count),
          user_liked:post_likes(
            user_id
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Failed to fetch posts:', error);
        set({ isLoadingPosts: false });
        return;
      }

      const mappedPosts = (posts || []).map((p: any) => mapDbPostToPost(p, currentUserId));
      set({ posts: mappedPosts, isLoadingPosts: false });
    } catch (err) {
      console.error('Error fetching posts:', err);
      set({ isLoadingPosts: false });
    }
  },

  // Fetch real users from Supabase
  fetchUsers: async () => {
    const { isLoadingUsers } = get();
    if (isLoadingUsers) return;
    set({ isLoadingUsers: true });
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Failed to fetch users:', error);
        set({ isLoadingUsers: false });
        return;
      }

      const mappedUsers = (users || []).map((u: any) => mapDbUserToUser(u));
      set({ users: mappedUsers, isLoadingUsers: false });
    } catch (err) {
      console.error('Error fetching users:', err);
      set({ isLoadingUsers: false });
    }
  },

  addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),

  updatePostContent: (postId, content) => {
    set((state) => ({
      posts: state.posts.map(post =>
        post.id === postId ? { ...post, content } : post
      ),
    }));
  },

  deletePost: (postId) => {
    set((state) => ({
      posts: state.posts.filter(post => post.id !== postId),
      comments: state.comments.filter(comment => comment.postId !== postId),
    }));
  },

  updatePostLikes: (postId, likes, isLiked) => {
    set((state) => ({
      posts: state.posts.map(post =>
        post.id === postId
          ? { ...post, likes, isLiked }
          : post
      ),
    }));
  },

  updatePostShares: (postId, shares) => {
    set((state) => ({
      posts: state.posts.map(post =>
        post.id === postId
          ? { ...post, shares }
          : post
      ),
    }));
  },

  addSharedPost: (userId, postId) => {
    set((state) => {
      // Update users array
      const updatedUsers = state.users.map(user =>
        user.id === userId
          ? { ...user, sharedPosts: [...(user.sharedPosts || []), postId] }
          : user
      );

      return { users: updatedUsers };
    });
  },

  getSharedPosts: (userId) => {
    const state = get();
    const user = state.users.find(u => u.id === userId);
    if (!user?.sharedPosts || user.sharedPosts.length === 0) return [];

    return state.posts.filter(post => user.sharedPosts?.includes(post.id));
  },

  getPostComments: (postId) => {
    const { comments } = get();
    return comments
      .filter(comment => comment.postId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  getFilteredPosts: (userSportsCategory) => {
    const { posts } = get();
    return posts.filter(post =>
      post.user?.sportsCategory === userSportsCategory
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getFilteredUsers: (userSportsCategory) => {
    const { users } = get();
    return users.filter(user => user.sportsCategory === userSportsCategory);
  },

  getUserPosts: (userId) => {
    const { posts } = get();
    return posts.filter(post => post.userId === userId);
  },

  getUserFollowers: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_following')
        .select(`
          follower:profiles!follower_id(
            id, email, username, full_name, role, sports_category, gender,
            profile_image, profile_image, bio, is_verified, verification_status,
            followers, following, posts, created_at
          )
        `)
        .eq('following_id', userId);

      if (error || !data) {
        console.error('Failed to fetch followers:', error);
        return [];
      }
      return data.map((row: any) => mapDbUserToUser(row.follower)).filter(Boolean);
    } catch (err) {
      console.error('Error fetching followers:', err);
      return [];
    }
  },

  getUserFollowing: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_following')
        .select(`
          following:profiles!following_id(
            id, email, username, full_name, role, sports_category, gender,
            profile_image, profile_image, bio, is_verified, verification_status,
            followers, following, posts, created_at
          )
        `)
        .eq('follower_id', userId);

      if (error || !data) {
        console.error('Failed to fetch following:', error);
        return [];
      }
      return data.map((row: any) => mapDbUserToUser(row.following)).filter(Boolean);
    } catch (err) {
      console.error('Error fetching following:', err);
      return [];
    }
  },

  addMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message] }));
  },

  getConversations: (userId, userSportsCategory) => {
    const { users, messages } = get();
    const filteredUsers = users.filter(user =>
      (userSportsCategory === 'all' || user.sportsCategory === userSportsCategory) && user.id !== userId
    );

    const conversations: Conversation[] = filteredUsers.map(otherUser => {
      const conversationMessages = messages.filter(msg =>
        (msg.senderId === userId && msg.receiverId === otherUser.id) ||
        (msg.senderId === otherUser.id && msg.receiverId === userId)
      );

      const lastMessage = conversationMessages.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      const unreadCount = conversationMessages.filter(msg =>
        msg.receiverId === userId && !msg.isRead
      ).length;

      return {
        id: `conv-${userId}-${otherUser.id}`,
        participants: [otherUser],
        lastMessage,
        unreadCount,
        updatedAt: lastMessage?.createdAt || new Date().toISOString(),
      };
    });

    return conversations.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  addNotification: (notification) => {
    set((state) => ({ notifications: [notification, ...state.notifications] }));
  },

  markNotificationAsRead: (notificationId) => {
    set((state) => ({
      notifications: state.notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      ),
    }));
  },

  updateUserInStore: (updatedUser: User) => {
    set((state) => ({
      users: state.users.map(user =>
        user.id === updatedUser.id ? updatedUser : user
      ),
    }));
  },

  followUser: async (userId: string, targetUserId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('You must be logged in to follow users');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: targetUserId })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to follow user');
      }

      // Refresh users to update follower/following counts
      await get().fetchUsers();
      toast.success(data.message || 'Successfully followed user');
    } catch (error: any) {
      console.error('Follow error:', error);
      toast.error(error.message || 'Failed to follow user');
    }
  },

  unfollowUser: async (userId: string, targetUserId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('You must be logged in to unfollow users');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/follow/${targetUserId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to unfollow user');
      }

      // Refresh users to update follower/following counts
      await get().fetchUsers();
      toast.success(data.message || 'Successfully unfollowed user');
    } catch (error: any) {
      console.error('Unfollow error:', error);
      toast.error(error.message || 'Failed to unfollow user');
    }
  },

  isFollowing: async (userId: string, targetUserId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/follow-status/${targetUserId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      return data.success ? data.isFollowing : false;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  },

  likePost: async (postId: string, userId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('You must be logged in to like posts');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to like post');
      }

      // Update post in local state
      set(state => ({
        posts: state.posts.map(p =>
          p.id === postId
            ? { ...p, likes: p.likes + (data.liked ? 1 : -1), isLiked: data.liked }
            : p
        )
      }));
    } catch (error: any) {
      console.error('Like error:', error);
      toast.error(error.message || 'Failed to like post');
    }
  },

  addComment: async (postId: string, content: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('You must be logged in to comment');
        return null;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to add comment');
      }

      // Update comment count in local state
      set(state => ({
        posts: state.posts.map(p =>
          p.id === postId
            ? { ...p, comments: p.comments + 1 }
            : p
        )
      }));

      return data.comment;
    } catch (error: any) {
      console.error('Comment error:', error);
      toast.error(error.message || 'Failed to add comment');
      return null;
    }
  },

  // Video functions
  addVideo: (video) => set((state) => ({ videos: [video, ...state.videos] })),

  getVideosByCategory: (category) => {
    const { videos } = get();
    if (category === 'all') return videos;
    return videos.filter(video => video.category === category);
  },

  getVideosByCoach: (coachId) => {
    const { videos } = get();
    return videos.filter(video => video.coachId === coachId);
  },

  likeVideo: (videoId, userId) => {
    const { addTokens } = get();

    // Award tokens for liking videos
    addTokens(userId, 2, 'earned', 'Liked video');

    set((state) => ({
      videos: state.videos.map(video =>
        video.id === videoId
          ? {
            ...video,
            likes: video.isLiked ? video.likes - 1 : video.likes + 1,
            isLiked: !video.isLiked
          }
          : video
      ),
    }));
  },

  watchVideo: (videoId, userId) => {
    // Award tokens for watching videos
    const { addTokens } = get();
    addTokens(userId, 5, 'earned', 'Watched video');

    // Increment view count
    set((state) => ({
      videos: state.videos.map(video =>
        video.id === videoId
          ? { ...video, views: video.views + 1 }
          : video
      ),
    }));
  },

  // Token functions
  getUserTokens: (userId) => {
    const { userTokens } = get();
    let userToken = userTokens.find(ut => ut.userId === userId);

    if (!userToken) {
      // Create initial token balance for new user
      userToken = {
        userId,
        balance: 100, // Starting bonus
        totalEarned: 100,
        totalSpent: 0,
        transactions: [{
          id: Date.now().toString(),
          userId,
          type: 'earned',
          amount: 100,
          reason: 'earned',
          description: 'Welcome bonus',
          createdAt: new Date().toISOString(),
        }],
      };

      set((state) => ({
        userTokens: [...state.userTokens, userToken!]
      }));
    }

    return userToken;
  },

  addTokens: (userId, amount, reason, description) => {
    set((state) => {
      const existingTokenIndex = state.userTokens.findIndex(ut => ut.userId === userId);

      const transaction: TokenTransaction = {
        id: Date.now().toString(),
        userId,
        type: reason as 'earned' | 'spent' | 'purchased',
        amount,
        reason,
        description,
        createdAt: new Date().toISOString(),
      };

      if (existingTokenIndex >= 0) {
        const updatedTokens = [...state.userTokens];
        updatedTokens[existingTokenIndex] = {
          ...updatedTokens[existingTokenIndex],
          balance: updatedTokens[existingTokenIndex].balance + amount,
          totalEarned: updatedTokens[existingTokenIndex].totalEarned + amount,
          transactions: [transaction, ...updatedTokens[existingTokenIndex].transactions],
        };
        return { userTokens: updatedTokens };
      } else {
        const newUserToken: UserTokens = {
          userId,
          balance: 100 + amount, // Welcome bonus + earned amount
          totalEarned: 100 + amount,
          totalSpent: 0,
          transactions: [transaction],
        };
        return { userTokens: [...state.userTokens, newUserToken] };
      }
    });
  },

  spendTokens: (userId, amount, reason, description) => {
    const { userTokens } = get();
    const userToken = userTokens.find(ut => ut.userId === userId);

    if (!userToken || userToken.balance < amount) {
      return false; // Insufficient tokens
    }

    set((state) => {
      const transaction: TokenTransaction = {
        id: Date.now().toString(),
        userId,
        type: 'spent',
        amount: -amount,
        reason,
        description,
        createdAt: new Date().toISOString(),
      };

      return {
        userTokens: state.userTokens.map(ut =>
          ut.userId === userId
            ? {
              ...ut,
              balance: ut.balance - amount,
              totalSpent: ut.totalSpent + amount,
              transactions: [transaction, ...ut.transactions],
            }
            : ut
        ),
      };
    });

    return true;
  },

  purchaseTokens: (userId, amount, price) => {
    const { addTokens } = get();
    addTokens(userId, amount, 'purchased', `Purchased ${amount} tokens for $${price}`);
  },

  // Membership functions
  addMembership: (membership) => set((state) => ({
    memberships: [...state.memberships, membership]
  })),

  getMembershipsByCoach: (coachId) => {
    const { memberships } = get();
    return memberships.filter(membership => membership.coachId === coachId);
  },

  watchAd: (userId: string) => {
    const { addTokens } = get();
    addTokens(userId, 10, 'earned', 'Watched advertisement');
  },

  // Livestream functions
  addLivestream: (livestream) => set((state) => ({
    livestreams: [...state.livestreams, livestream]
  })),

  getLivestreams: (category) => {
    const { livestreams } = get();
    if (category === 'all') return livestreams;
    return livestreams.filter(stream => stream.category === category);
  },

  // Map and location functions
  addLocationCheckIn: (checkIn) => set((state) => ({
    locationCheckIns: [checkIn, ...state.locationCheckIns]
  })),

  addSafeLocation: (location) => set((state) => ({
    safeLocations: [location, ...state.safeLocations]
  })),

  updateHeatMapData: (data) => set((state) => {
    const existingIndex = state.heatMapData.findIndex(
      item => item.latitude === data.latitude && item.longitude === data.longitude && item.type === data.type
    );

    if (existingIndex >= 0) {
      const updatedData = [...state.heatMapData];
      updatedData[existingIndex] = data;
      return { heatMapData: updatedData };
    } else {
      return { heatMapData: [...state.heatMapData, data] };
    }
  }),

  addEvent: (event) => set((state) => ({
    events: [event, ...state.events]
  })),

  getEventsByLocation: (locationId) => {
    const { events } = get();
    return events.filter(event => event.location.latitude && event.location.longitude);
  },

  getEventsByCategory: (category) => {
    const { events } = get();
    if (category === 'all') return events;
    return events.filter(event => event.category === category);
  },
}));