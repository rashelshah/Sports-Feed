import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/?$/, '/api');

export interface UseFollowState {
  isFollowing: boolean;
  isLoading: boolean;
  isChecking: boolean;
  error: string | null;
}

export interface FollowUser {
  id: string;
  username: string;
  fullName: string;
  profileImage?: string;
  role: string;
  followedAt?: string;
}

// Helper to get auth token
const getToken = () => localStorage.getItem('token');

// Helper for API calls
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'Request failed');
  }

  return response.json();
}

/**
 * Hook to check and manage follow status for a specific user
 * @param targetUserId - The user ID to check follow status for
 */
export function useFollowStatus(targetUserId: string | null): UseFollowState & {
  follow: () => Promise<boolean>;
  unfollow: () => Promise<boolean>;
  refresh: () => Promise<void>;
} {
  const { user } = useAuthStore();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUserId = user?.id;

  // Check initial follow status
  const checkFollowStatus = useCallback(async () => {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
      setIsFollowing(false);
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    try {
      const data = await apiFetch(`/users/follow-status/${targetUserId}`);
      setIsFollowing(data.isFollowing);
    } catch (err) {
      console.error('Error checking follow status:', err);
      setError('Failed to check follow status');
    } finally {
      setIsChecking(false);
    }
  }, [currentUserId, targetUserId]);

  // Follow a user
  const follow = useCallback(async (): Promise<boolean> => {
    if (!currentUserId || !targetUserId) {
      toast.error('You must be logged in to follow users');
      return false;
    }

    if (currentUserId === targetUserId) {
      toast.error('You cannot follow yourself');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Optimistic update
      setIsFollowing(true);

      await apiFetch('/users/follow', {
        method: 'POST',
        body: JSON.stringify({ userId: targetUserId }),
      });

      toast.success('User followed successfully');
      return true;
    } catch (err: any) {
      // Rollback optimistic update
      setIsFollowing(false);
      const errorMessage = err?.message || 'Failed to follow user';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, targetUserId]);

  // Unfollow a user
  const unfollow = useCallback(async (): Promise<boolean> => {
    if (!currentUserId || !targetUserId) {
      toast.error('You must be logged in to unfollow users');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Optimistic update
      setIsFollowing(false);

      await apiFetch(`/users/follow/${targetUserId}`, {
        method: 'DELETE',
      });

      toast.success('User unfollowed successfully');
      return true;
    } catch (err: any) {
      // Rollback optimistic update
      setIsFollowing(true);
      const errorMessage = err?.message || 'Failed to unfollow user';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, targetUserId]);

  // Refresh follow status
  const refresh = useCallback(async () => {
    await checkFollowStatus();
  }, [checkFollowStatus]);

  // Initial check
  useEffect(() => {
    checkFollowStatus();
  }, [checkFollowStatus]);

  return {
    isFollowing,
    isLoading,
    isChecking,
    error,
    follow,
    unfollow,
    refresh,
  };
}

/**
 * Hook to get the list of followers for a user
 * @param userId - The user ID to get followers for (defaults to current user)
 * @param limit - Maximum number of followers to fetch
 */
export function useFollowers(userId?: string, limit: number = 50) {
  const { user: currentUser } = useAuthStore();
  const targetUserId = userId || currentUser?.id;

  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const fetchFollowers = useCallback(async (pageNum: number = 1) => {
    if (!targetUserId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiFetch(`/users/${targetUserId}/followers?page=${pageNum}&limit=${limit}`);

      const followersData = (data.followers || []).map((u: any) => ({
        id: u.id,
        username: u.username,
        fullName: u.name,
        profileImage: u.avatar_url,
        role: u.role,
      }));

      if (pageNum === 1) {
        setFollowers(followersData);
      } else {
        setFollowers((prev) => [...prev, ...followersData]);
      }

      setHasMore(data.pagination?.hasNextPage || false);
      setPage(pageNum);
    } catch (err: any) {
      console.error('Error fetching followers:', err);
      setError(err?.message || 'Failed to fetch followers');
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId, limit]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchFollowers(page + 1);
    }
  }, [fetchFollowers, page, isLoading, hasMore]);

  const refresh = useCallback(() => {
    setHasMore(true);
    fetchFollowers(1);
  }, [fetchFollowers]);

  useEffect(() => {
    if (targetUserId) {
      fetchFollowers(1);
    }
  }, [targetUserId, fetchFollowers]);

  return {
    followers,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}

/**
 * Hook to get the list of users being followed by a user
 * @param userId - The user ID to get following list for (defaults to current user)
 * @param limit - Maximum number of users to fetch
 */
export function useFollowing(userId?: string, limit: number = 50) {
  const { user: currentUser } = useAuthStore();
  const targetUserId = userId || currentUser?.id;

  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const fetchFollowing = useCallback(async (pageNum: number = 1) => {
    if (!targetUserId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiFetch(`/users/${targetUserId}/following?page=${pageNum}&limit=${limit}`);

      const followingData = (data.following || []).map((u: any) => ({
        id: u.id,
        username: u.username,
        fullName: u.name,
        profileImage: u.avatar_url,
        role: u.role,
      }));

      if (pageNum === 1) {
        setFollowing(followingData);
      } else {
        setFollowing((prev) => [...prev, ...followingData]);
      }

      setHasMore(data.pagination?.hasNextPage || false);
      setPage(pageNum);
    } catch (err: any) {
      console.error('Error fetching following:', err);
      setError(err?.message || 'Failed to fetch following list');
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId, limit]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchFollowing(page + 1);
    }
  }, [fetchFollowing, page, isLoading, hasMore]);

  const refresh = useCallback(() => {
    setHasMore(true);
    fetchFollowing(1);
  }, [fetchFollowing]);

  useEffect(() => {
    if (targetUserId) {
      fetchFollowing(1);
    }
  }, [targetUserId, fetchFollowing]);

  return {
    following,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}

/**
 * Hook to check if current user can message another user
 * @param targetUserId - The user ID to check messaging permission for
 */
export function useCanMessage(targetUserId: string | null) {
  const { user: currentUser } = useAuthStore();
  const currentUserId = currentUser?.id;

  const [canMessage, setCanMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkCanMessage = useCallback(async () => {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
      setCanMessage(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if current user follows target
      const data = await apiFetch(`/users/follow-status/${targetUserId}`);
      setCanMessage(data.isFollowing);
    } catch (err: any) {
      console.error('Error checking messaging permission:', err);
      setError(err?.message || 'Failed to check messaging permission');
      setCanMessage(false);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, targetUserId]);

  useEffect(() => {
    checkCanMessage();
  }, [checkCanMessage]);

  return {
    canMessage,
    isLoading,
    error,
    refresh: checkCanMessage,
  };
}

/**
 * Batch check follow status for multiple users
 * @param userIds - Array of user IDs to check
 */
export function useBatchFollowStatus(userIds: string[]) {
  const { user: currentUser } = useAuthStore();
  const [statuses, setStatuses] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!currentUser?.id || userIds.length === 0) return;

    const fetchStatuses = async () => {
      setIsLoading(true);
      try {
        const data = await apiFetch('/users/follow-status', {
          method: 'POST',
          body: JSON.stringify({ userIds }),
        });
        setStatuses(data.statuses || {});
      } catch (err) {
        console.error('Error fetching batch follow status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatuses();
  }, [currentUser?.id, userIds.join(',')]);

  return { statuses, isLoading };
}
