import { create } from 'zustand';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  initSession: () => Promise<void>;
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

      set({ user: mapProfileToUser(profile), isAuthenticated: true });
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

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw new Error(profileError.message);
      }

      if (profile && authData.session) {
        set({ user: mapProfileToUser(profile), isAuthenticated: true });
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

  updateUser: (userData: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      set({ user: updatedUser });
    }
  },
}));
