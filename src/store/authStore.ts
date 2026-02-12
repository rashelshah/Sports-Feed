import { create } from 'zustand';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  darkMode: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  initSession: () => Promise<void>;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
}

interface RegisterData {
  email: string;
  password: string;
  username: string;
  fullName: string;
  role: 'user' | 'coach' | 'fan' | 'aspirant' | 'administrator';
  sportsCategory: 'coco' | 'martial-arts' | 'calorie-fight' | 'adaptive-sports' | 'unstructured-sports';
  gender: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
  accessibilityNeeds?: string[];
  preferredAccommodations?: string[];
  sportRole?: any;
  sportInterests?: string[];
  isProfessional?: boolean;
  verificationStatus?: 'pending' | 'approved' | 'rejected';
}

function mapProfileToUser(profile: Record<string, any>): User {
  return {
    id: profile.id,
    email: profile.email,
    username: profile.username,
    fullName: profile.full_name,
    role: profile.role,
    sportsCategory: profile.sports_category,
    gender: profile.gender,
    isVerified: profile.verification_status === 'approved',
    profileImage: profile.profile_image,
    bio: profile.bio,
    followers: profile.followers ?? 0,
    following: profile.following ?? 0,
    posts: profile.posts ?? 0,
    createdAt: profile.created_at,
    accessibilityNeeds: profile.accessibility_needs ?? [],
    preferredAccommodations: profile.preferred_accommodations ?? [],
    sportRole: profile.sport_role,
    sportInterests: profile.sport_interests ?? [],
    isProfessional: profile.is_professional ?? false,
    verificationStatus: profile.verification_status ?? 'approved',
    evidenceDocuments: profile.evidence_documents ?? [],
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  darkMode: localStorage.getItem('darkMode') === 'true',

  initSession: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          // Save token to localStorage
          if (session.access_token) {
            localStorage.setItem('token', session.access_token);
          }
          set({ user: mapProfileToUser(profile), isAuthenticated: true });
        }
      }
    } catch (error) {
      console.error('Session init failed:', error);
    } finally {
      set({ isInitialized: true });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error('Login failed');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('User profile not found. Please sign up first.');
      }

      const user = mapProfileToUser(profile);

      // Save the access token to localStorage for API requests
      if (data.session?.access_token) {
        localStorage.setItem('token', data.session.access_token);
      }

      set({ user, isAuthenticated: true, isLoading: false });
      return;
    } catch (error: any) {
      const message = error?.message?.includes('Invalid login credentials')
        ? 'Invalid email or password. Please try again.'
        : error?.message ?? 'Login failed. Please try again.';
      throw new Error(message);
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (userData: RegisterData) => {
    set({ isLoading: true });
    try {
      const role = userData.role === 'administrator' ? 'user' : userData.role;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            username: userData.username,
            full_name: userData.fullName,
            role,
            sports_category: userData.sportsCategory,
            gender: userData.gender,
            accessibility_needs: userData.accessibilityNeeds ?? [],
            preferred_accommodations: userData.preferredAccommodations ?? [],
            sport_role: userData.sportRole ?? null,
            sport_interests: userData.sportInterests ?? [],
            is_professional: userData.isProfessional ?? false,
            verification_status: userData.verificationStatus ?? 'approved',
          },
        },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Registration failed');

      const user = authData.user;

      const { error: profileInsertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email ?? userData.email,
          username: userData.username,
          full_name: userData.fullName,
          role,
          sports_category: userData.sportsCategory,
          gender: userData.gender,
          accessibility_needs: userData.accessibilityNeeds ?? [],
          preferred_accommodations: userData.preferredAccommodations ?? [],
          sport_role: userData.sportRole ?? null,
          sport_interests: userData.sportInterests ?? [],
          is_professional: userData.isProfessional ?? false,
          verification_status: userData.verificationStatus ?? 'approved',
        });

      if (profileInsertError) {
        if (profileInsertError.message.includes('duplicate') || profileInsertError.code === '23505') {
          throw new Error('Username or email already exists. Please try a different one.');
        }
        throw new Error(profileInsertError.message);
      }

      const fetchedProfile = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchedProfile.data) {
        const mappedUser = mapProfileToUser(fetchedProfile.data);

        // Save token to localStorage
        if (authData.session?.access_token) {
          localStorage.setItem('token', authData.session.access_token);
        }

        set({ user: mappedUser, isAuthenticated: true, isLoading: false });
      } else if (!authData.session) {
        throw new Error('Please check your email to confirm your account, then log in.');
      }
    } catch (error: any) {
      const message = error?.message?.includes('already registered')
        ? 'An account with this email already exists. Please log in.'
        : error?.message ?? 'Registration failed. Please try again.';
      throw new Error(message);
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },

  updateUser: async (userData: Partial<User>) => {
    const currentUser = get().user;
    if (!currentUser) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      // Build payload with only defined values
      const payload: any = {};
      
      if (userData.fullName !== undefined && userData.fullName.trim()) {
        payload.full_name = userData.fullName.trim();
      }
      if (userData.username !== undefined && userData.username.trim()) {
        // Username must match pattern: alphanumeric and underscores only
        // Replace spaces with underscores, then remove any other invalid characters
        const cleanUsername = userData.username
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '_')           // Replace spaces with underscores
          .replace(/[^a-zA-Z0-9_]/g, '');  // Remove any other invalid chars
        
        if (cleanUsername.length >= 3) {
          payload.username = cleanUsername;
          console.log('Cleaned username:', cleanUsername);
        } else {
          console.warn('Username too short after cleaning:', cleanUsername);
        }
      }
      if (userData.bio !== undefined) {
        payload.bio = userData.bio;
      }
      if (userData.profileImage !== undefined && userData.profileImage) {
        payload.profile_image = userData.profileImage;
      }

      // Call backend API to persist changes
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('Profile update response:', data);
      if (!data.success) {
        const errorMsg = data.error || data.details || 
          (data.errors ? JSON.stringify(data.errors) : null) || 
          JSON.stringify(data) || 'Failed to update profile';
        throw new Error(errorMsg);
      }

      // Update local state with the returned user data
      const updatedUser = { ...currentUser, ...userData };
      set({ user: updatedUser });
    } catch (error: any) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  toggleDarkMode: () => {
    const newDarkMode = !get().darkMode;
    localStorage.setItem('darkMode', String(newDarkMode));
    set({ darkMode: newDarkMode });
    // Apply dark mode class to document
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  setDarkMode: (value: boolean) => {
    localStorage.setItem('darkMode', String(value));
    set({ darkMode: value });
    // Apply dark mode class to document
    if (value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
}));
