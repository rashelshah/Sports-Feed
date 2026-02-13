import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  File,
  Eye,
  Download,
  Filter,
  Search,
  Shield,
  Bot
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { EvidenceDocument, User as UserType } from '../../types';

interface VerificationDashboardProps {
  onClose: () => void;
}

interface PendingVerification {
  id: string;
  user: UserType;
  evidenceDocuments: EvidenceDocument[];
  submittedAt: string;
  sportRole: any;
}

export function VerificationDashboard({ onClose }: VerificationDashboardProps) {
  const { user, darkMode } = useAuthStore();
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<PendingVerification | null>(null);
  const [filter, setFilter] = useState<'all' | 'ai-approved' | 'ai-rejected' | 'manual-review'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Fetch real verification requests from Supabase
    async function fetchVerifications() {
      try {
        const { data, error } = await supabase
          .from('verification_requests')
          .select(`
            *,
            user:profiles!user_id(
              id, email, username, full_name, role, sports_category, gender,
              profile_image, avatar_url, bio, is_verified, verification_status,
              followers, following, posts, created_at, sport_role, sport_interests,
              is_professional, accessibility_needs, preferred_accommodations
            )
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Failed to fetch verifications:', error);
          setPendingVerifications([]);
          return;
        }

        const mapped = (data || []).map((d: any) => ({
          id: d.id,
          user: {
            id: d.user?.id ?? d.user_id,
            email: d.user?.email ?? '',
            username: d.user?.username ?? d.user?.full_name ?? '',
            fullName: d.user?.full_name ?? '',
            role: d.user?.role ?? 'user',
            sportsCategory: d.user?.sports_category ?? 'coco',
            gender: d.user?.gender ?? 'prefer-not-to-say',
            isVerified: d.user?.is_verified ?? false,
            profileImage: d.user?.profile_image ?? d.user?.avatar_url,
            bio: d.user?.bio ?? '',
            followers: d.user?.followers ?? 0,
            following: d.user?.following ?? 0,
            posts: d.user?.posts ?? 0,
            createdAt: d.user?.created_at ?? new Date().toISOString(),
            accessibilityNeeds: d.user?.accessibility_needs ?? [],
            preferredAccommodations: d.user?.preferred_accommodations ?? [],
            sportRole: d.user?.sport_role,
            sportInterests: d.user?.sport_interests ?? [],
            isProfessional: d.user?.is_professional ?? false,
            verificationStatus: d.user?.verification_status ?? 'pending',
            evidenceDocuments: [],
          } as UserType,
          evidenceDocuments: (d.evidence_documents || d.documents || []).map((doc: any) => ({
            id: doc.id ?? crypto.randomUUID(),
            userId: d.user_id,
            fileName: doc.file_name ?? doc.fileName ?? 'Document',
            fileUrl: doc.file_url ?? doc.fileUrl ?? '#',
            documentType: doc.document_type ?? doc.documentType ?? 'certificate',
            sportRole: doc.sport_role ?? '',
            description: doc.description ?? '',
            uploadedAt: doc.uploaded_at ?? doc.uploadedAt ?? d.created_at,
            status: doc.status ?? 'pending',
            aiAnalysis: doc.ai_analysis ?? doc.aiAnalysis,
          })),
          submittedAt: d.created_at ?? new Date().toISOString(),
          sportRole: d.sport_role ?? d.user?.sport_role ?? { name: 'Unknown', category: 'coco' },
        }));

        setPendingVerifications(mapped);
      } catch (err) {
        console.error('Error fetching verifications:', err);
        setPendingVerifications([]);
      }
    }
    fetchVerifications();
  }, []);

  const filteredVerifications = pendingVerifications.filter(verification => {
    const matchesSearch = verification.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      verification.user.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === 'all') return matchesSearch;

    const aiSuggestions = verification.evidenceDocuments.map(doc => doc.aiAnalysis?.suggestedAction);
    const hasApproved = aiSuggestions.includes('approve');
    const hasRejected = aiSuggestions.includes('reject');
    const hasManualReview = aiSuggestions.includes('manual-review');

    switch (filter) {
      case 'ai-approved':
        return matchesSearch && hasApproved && !hasRejected && !hasManualReview;
      case 'ai-rejected':
        return matchesSearch && hasRejected;
      case 'manual-review':
        return matchesSearch && hasManualReview;
      default:
        return matchesSearch;
    }
  });

  const handleApprove = async (verificationId: string) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setPendingVerifications(prev =>
        prev.filter(v => v.id !== verificationId)
      );

      toast.success('Verification approved successfully!');
      setSelectedVerification(null);

    } catch (error) {
      toast.error('Failed to approve verification. Please try again.');
    }
  };

  const handleReject = async (verificationId: string, reason: string) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setPendingVerifications(prev =>
        prev.filter(v => v.id !== verificationId)
      );

      toast.success('Verification rejected.');
      setSelectedVerification(null);

    } catch (error) {
      toast.error('Failed to reject verification. Please try again.');
    }
  };

  const getOverallAISuggestion = (verification: PendingVerification) => {
    const suggestions = verification.evidenceDocuments.map(doc => doc.aiAnalysis?.suggestedAction);

    if (suggestions.includes('reject')) return 'reject';
    if (suggestions.includes('manual-review')) return 'manual-review';
    if (suggestions.every(s => s === 'approve')) return 'approve';
    return 'manual-review';
  };

  const getSuggestionColor = (suggestion: string) => {
    switch (suggestion) {
      case 'approve':
        return 'bg-green-100 text-green-800';
      case 'reject':
        return 'bg-red-100 text-red-800';
      case 'manual-review':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className={`flex justify-between items-center mb-6 ${darkMode ? 'text-white' : ''}`}>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Verification Dashboard</h2>
          <button
            onClick={onClose}
            className={`transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
            title="Close verification dashboard"
            aria-label="Close verification dashboard"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'border-gray-300'
                }`}
              />
            </div>
          </div>

          <div className="flex space-x-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'ai-approved', label: 'AI Approved' },
              { id: 'ai-rejected', label: 'AI Rejected' },
              { id: 'manual-review', label: 'Manual Review' }
            ].map((filterOption) => (
              <button
                key={filterOption.id}
                onClick={() => setFilter(filterOption.id as any)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === filterOption.id
                    ? (darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700')
                    : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                  }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>

        {/* Verification List */}
        <div className="space-y-4">
          {filteredVerifications.map((verification) => {
            const aiSuggestion = getOverallAISuggestion(verification);

            return (
              <motion.div
                key={verification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-lg p-4 cursor-pointer transition-colors ${
                  darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => setSelectedVerification(verification)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={verification.user.profileImage || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400'}
                      alt={verification.user.fullName}
                      className="h-12 w-12 rounded-full object-cover"
                    />

                    <div>
                      <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{verification.user.fullName}</h3>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{verification.user.email}</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {verification.sportRole.name} • {verification.evidenceDocuments.length} documents
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSuggestionColor(aiSuggestion)}`}>
                        {aiSuggestion === 'approve' && <Bot className="h-3 w-3 mr-1" />}
                        {aiSuggestion === 'reject' && <Bot className="h-3 w-3 mr-1" />}
                        {aiSuggestion === 'manual-review' && <Shield className="h-3 w-3 mr-1" />}
                        {aiSuggestion.replace('-', ' ')}
                      </div>
                      <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {new Date(verification.submittedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVerification(verification);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {filteredVerifications.length === 0 && (
            <div className="text-center py-12">
              <Clock className={`h-12 w-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>No pending verifications</h3>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>All verification requests have been processed.</p>
            </div>
          )}
        </div>

        {/* Verification Detail Modal */}
        {selectedVerification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Review Verification: {selectedVerification.user.fullName}
                </h3>
                <button
                  onClick={() => setSelectedVerification(null)}
                  className={`transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Close verification details"
                  aria-label="Close verification details"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {/* User Info */}
              <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                <div className="flex items-center space-x-4">
                  <img
                    src={selectedVerification.user.profileImage || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400'}
                    alt={selectedVerification.user.fullName}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                  <div>
                    <h4 className={`font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>{selectedVerification.user.fullName}</h4>
                    <p className={darkMode ? 'text-blue-400' : 'text-blue-800'}>{selectedVerification.user.email}</p>
                    <p className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                      Applying for: {selectedVerification.sportRole.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Evidence Documents */}
              <div className="space-y-4 mb-6">
                <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Evidence Documents</h4>
                {selectedVerification.evidenceDocuments.map((doc) => (
                  <div key={doc.id} className={`rounded-lg p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <File className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{doc.fileName}</p>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{doc.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSuggestionColor(doc.aiAnalysis?.suggestedAction || 'manual-review')}`}>
                          {doc.aiAnalysis?.suggestedAction || 'pending'}
                        </span>
                        <Button size="sm" variant="outline" title="View document">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>

                    {doc.aiAnalysis && (
                      <div className={`p-3 rounded border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white'}`}>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <strong>AI Analysis:</strong> {doc.aiAnalysis.detectedText}
                        </p>
                        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <strong>Confidence:</strong> {Math.round(doc.aiAnalysis.confidence * 100)}%
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  onClick={() => handleApprove(selectedVerification.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={() => handleReject(selectedVerification.id, 'Insufficient evidence')}
                  variant="outline"
                  className={`flex-1 ${darkMode ? 'border-red-500 text-red-400 hover:bg-red-900/30' : 'border-red-300 text-red-700 hover:bg-red-50'}`}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
