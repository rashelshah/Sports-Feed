import React, { useState, useEffect } from 'react';
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
  const { user } = useAuthStore();
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<PendingVerification | null>(null);
  const [filter, setFilter] = useState<'all' | 'ai-approved' | 'ai-rejected' | 'manual-review'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Mock data for pending verifications
    setPendingVerifications([
      {
        id: '1',
        user: {
          id: '9',
          email: 'aspirant@fitness.com',
          username: 'fitnessaspirant',
          fullName: 'Jordan Smith',
          role: 'aspirant',
          sportsCategory: 'calorie-fight',
          gender: 'non-binary',
          isVerified: false,
          profileImage: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
          bio: 'Aspiring personal trainer working towards certification',
          followers: 12,
          following: 35,
          posts: 2,
          createdAt: '2024-02-15T00:00:00Z',
          accessibilityNeeds: [],
          preferredAccommodations: [],
          sportRole: {
            id: 'cf-1',
            name: 'Personal Trainer',
            category: 'calorie-fight',
            description: 'Certified personal trainer',
            isProfessional: true,
            requiresEvidence: true,
            evidenceTypes: ['certificate', 'license']
          },
          sportInterests: [],
          isProfessional: true,
          verificationStatus: 'pending',
          evidenceDocuments: [],
        },
        evidenceDocuments: [
          {
            id: '1',
            userId: '9',
            fileName: 'personal_trainer_certificate.pdf',
            fileUrl: '#',
            documentType: 'certificate',
            sportRole: 'cf-1',
            description: 'Personal Trainer Certification',
            uploadedAt: '2024-02-15T10:00:00Z',
            status: 'pending',
            aiAnalysis: {
              confidence: 0.85,
              detectedText: 'Personal Trainer Certification from National Academy of Sports Medicine',
              suggestedAction: 'approve',
              analysisDate: '2024-02-15T10:05:00Z',
            }
          },
          {
            id: '2',
            userId: '9',
            fileName: 'cpr_certification.jpg',
            fileUrl: '#',
            documentType: 'certificate',
            sportRole: 'cf-1',
            description: 'CPR Certification',
            uploadedAt: '2024-02-15T10:01:00Z',
            status: 'pending',
            aiAnalysis: {
              confidence: 0.92,
              detectedText: 'CPR Certification from American Red Cross',
              suggestedAction: 'approve',
              analysisDate: '2024-02-15T10:06:00Z',
            }
          }
        ],
        submittedAt: '2024-02-15T10:00:00Z',
        sportRole: {
          id: 'cf-1',
          name: 'Personal Trainer',
          category: 'calorie-fight',
          description: 'Certified personal trainer',
          isProfessional: true,
          requiresEvidence: true,
          evidenceTypes: ['certificate', 'license']
        }
      }
    ]);
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Verification Dashboard</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterOption.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
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
                      <h3 className="font-semibold text-gray-900">{verification.user.fullName}</h3>
                      <p className="text-sm text-gray-600">{verification.user.email}</p>
                      <p className="text-sm text-gray-500">
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
                      <p className="text-xs text-gray-500 mt-1">
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
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pending verifications</h3>
              <p className="text-gray-600">All verification requests have been processed.</p>
            </div>
          )}
        </div>

        {/* Verification Detail Modal */}
        {selectedVerification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Review Verification: {selectedVerification.user.fullName}
                </h3>
                <button
                  onClick={() => setSelectedVerification(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Close verification details"
                  aria-label="Close verification details"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {/* User Info */}
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <div className="flex items-center space-x-4">
                  <img
                    src={selectedVerification.user.profileImage || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400'}
                    alt={selectedVerification.user.fullName}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-blue-900">{selectedVerification.user.fullName}</h4>
                    <p className="text-blue-800">{selectedVerification.user.email}</p>
                    <p className="text-blue-700 text-sm">
                      Applying for: {selectedVerification.sportRole.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Evidence Documents */}
              <div className="space-y-4 mb-6">
                <h4 className="font-semibold text-gray-900">Evidence Documents</h4>
                {selectedVerification.evidenceDocuments.map((doc) => (
                  <div key={doc.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <File className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="font-medium text-gray-900">{doc.fileName}</p>
                          <p className="text-sm text-gray-600">{doc.description}</p>
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
                      <div className="bg-white p-3 rounded border">
                        <p className="text-sm text-gray-700">
                          <strong>AI Analysis:</strong> {doc.aiAnalysis.detectedText}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
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
                  className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
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
