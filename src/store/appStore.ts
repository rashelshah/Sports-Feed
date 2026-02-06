import { create } from 'zustand';
import { User, Post, Comment, Message, Conversation, Video, Membership, UserTokens, TokenTransaction, LocationCheckIn, SafeLocation, HeatMapData, Event } from '../types';

interface AppState {
  currentView: 'home' | 'discover' | 'notifications' | 'messages' | 'profile' | 'expert' | 'play' | 'map';
  posts: Post[];
  users: User[];
  comments: Comment[];
  conversations: Conversation[];
  messages: Message[];
  notifications: Notification[];
  videos: Video[];
  memberships: Membership[];
  userTokens: UserTokens[];
  userFollowing: { followerId: string; followingId: string }[];
  setCurrentView: (view: AppState['currentView']) => void;
  addPost: (post: Post) => void;
  updatePostContent: (postId: string, content: string) => void;
  deletePost: (postId: string) => void;
  updatePostLikes: (postId: string, likes: number, isLiked: boolean) => void;
  updatePostShares: (postId: string, shares: number) => void;
  addSharedPost: (userId: string, postId: string) => void;
  getSharedPosts: (userId: string) => Post[];
  addComment: (comment: Comment) => void;
  getPostComments: (postId: string) => Comment[];
  getFilteredPosts: (userSportsCategory: string) => Post[];
  getFilteredUsers: (userSportsCategory: string) => User[];
  getUserPosts: (userId: string) => Post[];
  getUserFollowers: (userId: string) => User[];
  getUserFollowing: (userId: string) => User[];
  addMessage: (message: Message) => void;
  getConversations: (userId: string, userSportsCategory: string | 'all') => Conversation[];
  addNotification: (notification: Notification) => void;
  markNotificationAsRead: (notificationId: string) => void;
  updateUserInStore: (updatedUser: User) => void;
  followUser: (userId: string, targetUserId: string) => void;
  unfollowUser: (userId: string, targetUserId: string) => void;
  isFollowing: (userId: string, targetUserId: string) => boolean;
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
  watchAd: (userId: string) => void;
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

// Mock data for different sports categories
const mockUsers: User[] = [
  {
    id: '8',
    email: 'coach2@martial.com',
    username: 'martialcoach2',
    fullName: 'Sarah Johnson',
    role: 'coach',
    sportsCategory: 'martial-arts',
    isVerified: true,
    profileImage: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=400',
    bio: 'Professional martial arts instructor with 10+ years experience',
    followers: 2500,
    following: 150,
    posts: 89,
    sharedPosts: [],
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '9',
    email: 'coach2@calorie.com',
    username: 'caloriecoach2',
    fullName: 'Mike Chen',
    role: 'coach',
    sportsCategory: 'calorie-fight',
    isVerified: true,
    profileImage: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=400',
    bio: 'Certified fitness trainer specializing in calorie burning workouts',
    followers: 1800,
    following: 200,
    posts: 156,
    sharedPosts: [],
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '10',
    email: 'coach2@coco.com',
    username: 'cococoach2',
    fullName: 'Alex Rodriguez',
    role: 'coach',
    sportsCategory: 'coco',
    isVerified: true,
    profileImage: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400',
    bio: 'Coco sport specialist and performance coach',
    followers: 1200,
    following: 80,
    posts: 67,
    sharedPosts: [],
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '11',
    email: 'user2@martial.com',
    username: 'martialuser2',
    fullName: 'Emma Davis',
    role: 'user',
    sportsCategory: 'martial-arts',
    isVerified: false,
    profileImage: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
    bio: 'Martial arts enthusiast, always learning',
    followers: 150,
    following: 45,
    posts: 12,
    sharedPosts: [],
    createdAt: '2024-02-01T00:00:00Z',
  },
  {
    id: '12',
    email: 'user2@calorie.com',
    username: 'calorieuser2',
    fullName: 'John Smith',
    role: 'user',
    sportsCategory: 'calorie-fight',
    isVerified: false,
    profileImage: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400',
    bio: 'Fitness enthusiast on a weight loss journey',
    followers: 89,
    following: 67,
    posts: 8,
    sharedPosts: [],
    createdAt: '2024-02-15T00:00:00Z',
  },
  {
    id: '13',
    email: 'user2@coco.com',
    username: 'cocouser2',
    fullName: 'Maria Garcia',
    role: 'user',
    sportsCategory: 'coco',
    isVerified: false,
    profileImage: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=400',
    bio: 'Coco enthusiast, learning from the best',
    followers: 67,
    following: 34,
    posts: 3,
    sharedPosts: [],
    createdAt: '2024-02-20T00:00:00Z',
  },
];

const mockPosts: Post[] = [
  {
    id: '1',
    userId: '8',
    user: mockUsers[0],
    content: 'Remember, consistency is key in martial arts training. Here\'s a quick warm-up routine that will prepare your body for intensive training. Practice these movements daily! 🥋',
    mediaUrl: 'https://images.pexels.com/photos/4752861/pexels-photo-4752861.jpeg?auto=compress&cs=tinysrgb&w=800',
    mediaType: 'image',
    likes: 234,
    comments: 18,
    shares: 12,
    isLiked: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    userId: '9',
    user: mockUsers[1],
    content: 'New HIIT workout video is live! This 20-minute session will help you burn calories efficiently. Perfect for busy schedules. Who\'s joining me? 💪',
    mediaUrl: 'https://images.pexels.com/photos/1552252/pexels-photo-1552252.jpeg?auto=compress&cs=tinysrgb&w=800',
    mediaType: 'image',
    likes: 456,
    comments: 32,
    shares: 28,
    isLiked: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3',
    userId: '10',
    user: mockUsers[2],
    content: 'Coco training session complete! Focus on technique and breathing. Remember, it\'s not about speed, it\'s about precision and control. 🎯',
    mediaUrl: 'https://images.pexels.com/photos/1552106/pexels-photo-1552106.jpeg?auto=compress&cs=tinysrgb&w=800',
    mediaType: 'image',
    likes: 189,
    comments: 15,
    shares: 8,
    isLiked: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

const mockNotifications: Notification[] = [
  // Start with empty notifications - they will be generated by user actions
];

export const useAppStore = create<AppState>((set, get) => ({
  currentView: 'home',
  posts: mockPosts,
  users: mockUsers,
  comments: [],
  conversations: [],
  messages: [],
  notifications: mockNotifications,
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

  addComment: (comment) => {
    set((state) => ({
      comments: [...state.comments, comment],
      posts: state.posts.map(post =>
        post.id === comment.postId
          ? { ...post, comments: post.comments + 1 }
          : post
      ),
    }));
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
      post.user.sportsCategory === userSportsCategory
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

  getUserFollowers: (userId) => {
    const { users } = get();
    // Mock followers - in a real app this would come from a followers relationship table
    return users.filter(user => user.id !== userId).slice(0, 3);
  },

  getUserFollowing: (userId) => {
    const { users } = get();
    // Mock following - in a real app this would come from a following relationship table
    return users.filter(user => user.id !== userId).slice(0, 2);
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

  followUser: (userId: string, targetUserId: string) => {
    set((state) => {
      // Add to following relationship
      const newFollowing = { followerId: userId, followingId: targetUserId };
      const updatedUserFollowing = [...state.userFollowing, newFollowing];
      
      // Update user counts
      const updatedUsers = state.users.map(user => {
        if (user.id === userId) {
          return { ...user, following: user.following + 1 };
        }
        if (user.id === targetUserId) {
          return { ...user, followers: user.followers + 1 };
        }
        return user;
      });
      
      return { userFollowing: updatedUserFollowing, users: updatedUsers };
    });
  },

  unfollowUser: (userId: string, targetUserId: string) => {
    set((state) => {
      // Remove from following relationship
      const updatedUserFollowing = state.userFollowing.filter(
        uf => !(uf.followerId === userId && uf.followingId === targetUserId)
      );
      
      // Update user counts
      const updatedUsers = state.users.map(user => {
        if (user.id === userId) {
          return { ...user, following: Math.max(0, user.following - 1) };
        }
        if (user.id === targetUserId) {
          return { ...user, followers: Math.max(0, user.followers - 1) };
        }
        return user;
      });
      
      return { userFollowing: updatedUserFollowing, users: updatedUsers };
    });
  },

  isFollowing: (userId: string, targetUserId: string) => {
    const { userFollowing } = get();
    return userFollowing.some(
      uf => uf.followerId === userId && uf.followingId === targetUserId
    );
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