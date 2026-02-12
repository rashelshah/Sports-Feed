import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[];
  connect: (userId: string) => void;
  disconnect: () => void;
  sendMessage: (data: any) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  onlineUsers: [],

  connect: (userId: string) => {
    // Prevent duplicate connections
    const existingSocket = get().socket;
    if (existingSocket?.connected) return;

    // Get JWT token from localStorage for socket authentication
    const token = localStorage.getItem('token');

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      auth: { token, userId },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected successfully');
      set({ isConnected: true });
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      set({ isConnected: false });
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        set({ socket: null });
      }
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
      set({ isConnected: false });
    });

    socket.on('online-users', (users: string[]) => {
      set({ onlineUsers: users });
    });

    socket.on('usersOnline', (users: string[]) => {
      set({ onlineUsers: users });
    });

    // ─── Notification listeners ───────────────────────────────────
    socket.on('newNotification', (notification: any) => {
      console.log('[Socket] New notification received:', notification);
      // Dynamically import appStore to avoid circular dependency issues
      const { useAppStore } = require('./appStore');
      const addNotification = useAppStore.getState().addNotification;

      // Map backend snake_case notification to frontend Notification interface
      const mapped = {
        id: notification.id,
        userId: notification.user_id,
        type: notification.type || 'system',
        message: notification.message || notification.title || 'New notification',
        isRead: notification.is_read || false,
        createdAt: notification.created_at || new Date().toISOString(),
        fromUser: notification.from_user ? {
          id: notification.from_user.id,
          username: notification.from_user.username || notification.from_user.name || '',
          fullName: notification.from_user.name || notification.from_user.full_name || '',
          email: '',
          profileImage: notification.from_user.avatar_url || notification.from_user.profile_image || null,
          sportsCategory: 'unstructured-sports' as const,
          gender: 'prefer-not-to-say' as const,
          role: notification.from_user.role || 'athlete',
          isVerified: notification.from_user.is_verified || false,
          bio: '',
          followers: 0,
          following: 0,
          posts: 0,
          createdAt: '',
        } : undefined,
      };

      addNotification(mapped);
    });

    socket.on('notificationRead', (notificationId: string) => {
      const { useAppStore } = require('./appStore');
      useAppStore.getState().markNotificationAsRead(notificationId);
    });

    socket.on('notificationMarkedRead', (data: { notificationId: string }) => {
      const { useAppStore } = require('./appStore');
      useAppStore.getState().markNotificationAsRead(data.notificationId);
    });

    socket.on('notificationDeleted', (notificationId: string) => {
      const { useAppStore } = require('./appStore');
      useAppStore.getState().removeNotification(notificationId);
    });

    socket.on('notificationsCleared', () => {
      const { useAppStore } = require('./appStore');
      useAppStore.getState().clearNotifications();
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      set({ socket: null, isConnected: false, onlineUsers: [] });
    }
  },

  sendMessage: (data: any) => {
    const { socket } = get();
    if (socket) {
      socket.emit('message', data);
    }
  },

  joinRoom: (roomId: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit('join-room', roomId);
    }
  },

  leaveRoom: (roomId: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit('leave-room', roomId);
    }
  },
}));