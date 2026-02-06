export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: 'user' | 'coach' | 'expert' | 'fan' | 'aspirant' | 'administrator';
  sportsCategory: 'coco' | 'martial-arts' | 'calorie-fight' | 'adaptive-sports' | 'unstructured-sports';
  gender: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
  isVerified: boolean;
  profileImage?: string;
  bio?: string;
  followers: number;
  following: number;
  posts: number;
  createdAt: string;
  sharedPosts?: string[]; // Array of post IDs that user has shared
  documents?: VerificationDocument[];
  accessibilityNeeds?: string[];
  preferredAccommodations?: string[];
  // New fields for Fan/Aspirant roles
  sportRole?: SportRole;
  evidenceDocuments?: EvidenceDocument[];
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  isProfessional?: boolean;
  sportInterests?: string[];
}

export interface VerificationDocument {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  documentType: 'certificate' | 'id' | 'license';
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  comments?: string;
}

export interface SportRole {
  id: string;
  name: string;
  category: 'coco' | 'martial-arts' | 'calorie-fight' | 'adaptive-sports' | 'unstructured-sports';
  description: string;
  isProfessional: boolean;
  requiresEvidence: boolean;
  evidenceTypes: string[];
}

export interface EvidenceDocument {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  documentType: 'certificate' | 'license' | 'award' | 'competition-result' | 'training-record' | 'other';
  sportRole: string;
  description: string;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  reviewedBy?: string;
  comments?: string;
  aiAnalysis?: {
    confidence: number;
    detectedText: string;
    suggestedAction: 'approve' | 'reject' | 'manual-review';
    analysisDate: string;
  };
}

export interface Post {
  id: string;
  userId: string;
  user: User;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  user: User;
  content: string;
  likes: number;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'video';
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number; // in seconds
  coachId: string;
  coach: User;
  category: 'coco' | 'martial-arts' | 'calorie-fight';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'free' | 'premium';
  tokenCost: number; // 0 for free videos
  views: number;
  likes: number;
  isLiked: boolean;
  tags: string[];
  createdAt: string;
}

export interface Membership {
  id: string;
  name: string;
  description: string;
  price: number; // in tokens
  duration: number; // in days
  benefits: string[];
  coachId: string;
  coach: User;
  isActive: boolean;
}

export interface UserTokens {
  userId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  transactions: TokenTransaction[];
}

export interface TokenTransaction {
  id: string;
  userId: string;
  type: 'earned' | 'spent' | 'purchased';
  amount: number;
  reason: string;
  description: string;
  createdAt: string;
}

export interface LocationCheckIn {
  id: string;
  userId: string;
  user: User;
  locationId: string;
  locationName: string;
  latitude: number;
  longitude: number;
  checkInType: 'event' | 'practice' | 'general';
  eventId?: string;
  duration?: number; // in minutes
  createdAt: string;
}

export interface SafeLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  safetyFeatures: ('women-safe' | 'disability-friendly' | 'accessible-parking' | 'accessible-entrance' | 'accessible-restrooms' | 'well-lit' | 'security-present')[];
  verifiedBy: string[];
  reportedBy: string;
  lastVerified: string;
  description?: string;
  sportsAvailable: string[];
  averageRating: number;
  totalRatings: number;
}

export interface HeatMapData {
  latitude: number;
  longitude: number;
  intensity: number; // 0-1 scale
  type: 'activity' | 'safety' | 'women-safe' | 'disability-friendly';
  timestamp: string;
  userCount: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  location: {
    name: string;
    latitude: number;
    longitude: number;
    address: string;
  };
  startTime: string;
  endTime: string;
  organizerId: string;
  organizer: User;
  category: 'coco' | 'martial-arts' | 'calorie-fight' | 'adaptive-sports' | 'unstructured-sports';
  maxParticipants?: number;
  currentParticipants: number;
  isWomenOnly: boolean;
  accessibilityFeatures: string[];
  tokenCost: number;
  isActive: boolean;
  createdAt: string;
}