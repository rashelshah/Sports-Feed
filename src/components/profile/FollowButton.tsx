import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { useFollowStatus } from '../../hooks/useFollow';
import { useAuthStore } from '../../store/authStore';

interface FollowButtonProps {
  targetUserId: string;
  targetUserName?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
  showIcon?: boolean;
  className?: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
  targetUserId,
  targetUserName,
  size = 'md',
  variant = 'primary',
  showIcon = true,
  className = '',
  onFollowChange,
}: FollowButtonProps) {
  const { user } = useAuthStore();
  const { isFollowing, isLoading, isChecking, follow, unfollow } = useFollowStatus(targetUserId);

  // Don't show follow button for own profile
  if (user?.id === targetUserId) {
    return null;
  }

  const handleClick = async () => {
    let success: boolean;

    if (isFollowing) {
      success = await unfollow();
    } else {
      success = await follow();
    }

    if (success && onFollowChange) {
      onFollowChange(!isFollowing);
    }
  };

  // Size configurations
  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  // Variant configurations - use gray/disabled style while checking
  const variantClasses = {
    primary: isChecking
      ? 'bg-gray-200 text-gray-500 cursor-wait'
      : isFollowing
        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
        : 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: isChecking
      ? 'bg-gray-200 text-gray-500 cursor-wait'
      : isFollowing
        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        : 'bg-gray-900 text-white hover:bg-gray-800',
    outline: isChecking
      ? 'bg-gray-200 text-gray-500 cursor-wait'
      : isFollowing
        ? 'border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
        : 'border-2 border-blue-500 text-blue-500 hover:bg-blue-50',
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20,
  };

  const isDisabled = isLoading;

  return (
    <motion.button
      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
      whileTap={{ scale: isDisabled ? 1 : 0.98 }}
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2
        font-medium rounded-full
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      aria-label={isFollowing ? `Unfollow ${targetUserName || 'user'}` : `Follow ${targetUserName || 'user'}`}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" size={iconSizes[size]} />
      ) : (
        <>
          {showIcon && (
            isFollowing ? (
              <UserCheck size={iconSizes[size]} />
            ) : (
              <UserPlus size={iconSizes[size]} />
            )
          )}
          <span>{isFollowing ? 'Following' : 'Follow'}</span>
        </>
      )}
    </motion.button>
  );
}

/**
 * Compact follow button for use in lists/cards
 */
export function FollowButtonCompact({
  targetUserId,
  className = '',
  onFollowChange,
}: {
  targetUserId: string;
  className?: string;
  onFollowChange?: (isFollowing: boolean) => void;
}) {
  const { user } = useAuthStore();
  const { isFollowing, isLoading, follow, unfollow } = useFollowStatus(targetUserId);

  if (user?.id === targetUserId) {
    return null;
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('FollowButton clicked, current isFollowing:', isFollowing);
    let success: boolean;
    if (isFollowing) {
      console.log('Attempting to unfollow...');
      success = await unfollow();
      console.log('Unfollow result:', success);
      if (success && onFollowChange) {
        onFollowChange(false);
      }
    } else {
      console.log('Attempting to follow...');
      success = await follow();
      console.log('Follow result:', success);
      if (success && onFollowChange) {
        onFollowChange(true);
      }
    }
  };

  return (
    <motion.button
      whileHover={{ scale: isLoading ? 1 : 1.05 }}
      whileTap={{ scale: isLoading ? 1 : 0.95 }}
      onClick={handleClick}
      disabled={isLoading}
      className={`
        px-3 py-1 text-xs font-medium rounded-full
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${
          isFollowing
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }
        ${className}
      `}
    >
      {isLoading ? (
        <Loader2 className="animate-spin inline" size={12} />
      ) : (
        isFollowing ? 'Following' : 'Follow'
      )}
    </motion.button>
  );
}

/**
 * Follow button specifically for profile header
 */
export function ProfileFollowButton({
  targetUserId,
  targetUserName,
  onFollowersCountChange,
}: {
  targetUserId: string;
  targetUserName: string;
  onFollowersCountChange?: (increment: number) => void;
}) {
  const { user } = useAuthStore();
  const { isFollowing, isLoading, follow, unfollow } = useFollowStatus(targetUserId);

  if (user?.id === targetUserId) {
    return null;
  }

  const handleClick = async () => {
    let success: boolean;

    if (isFollowing) {
      success = await unfollow();
      if (success && onFollowersCountChange) {
        onFollowersCountChange(-1);
      }
    } else {
      success = await follow();
      if (success && onFollowersCountChange) {
        onFollowersCountChange(1);
      }
    }
  };

  return (
    <motion.button
      whileHover={{ scale: isLoading ? 1 : 1.02 }}
      whileTap={{ scale: isLoading ? 1 : 0.98 }}
      onClick={handleClick}
      disabled={isLoading}
      aria-label={isFollowing ? `Unfollow ${targetUserName}` : `Follow ${targetUserName}`}
      className={`
        inline-flex items-center justify-center gap-2
        px-6 py-2.5 rounded-lg font-medium
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${
          isFollowing
            ? 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200'
            : 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm hover:shadow-md'
        }
      `}
    >
      {isLoading ? (
        <>
          <Loader2 className="animate-spin" size={18} />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {isFollowing ? (
            <UserCheck size={18} />
          ) : (
            <UserPlus size={18} />
          )}
          <span>{isFollowing ? 'Following' : 'Follow'}</span>
        </>
      )}
    </motion.button>
  );
}
