import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, X, Clock, FileText } from 'lucide-react';
import { VerificationDocument } from '../../types';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export function ExpertDashboard() {
  const { darkMode } = useAuthStore();
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<VerificationDocument | null>(null);

  // Fetch real pending documents from Supabase
  useEffect(() => {
    async function fetchDocuments() {
      try {
        const { data, error } = await supabase
          .from('verification_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Failed to fetch verification documents:', error);
          return;
        }

        const mapped = (data || []).map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          fileName: d.file_name ?? d.document_name ?? 'Unknown',
          fileUrl: d.file_url ?? d.document_url ?? '#',
          documentType: d.document_type ?? 'certificate',
          status: d.status ?? 'pending',
          uploadedAt: d.created_at ?? new Date().toISOString(),
          reviewedAt: d.reviewed_at,
          reviewedBy: d.reviewed_by,
          comments: d.comments,
        }));
        setDocuments(mapped);
      } catch (err) {
        console.error('Error fetching documents:', err);
      }
    }
    fetchDocuments();
  }, []);

  const handleReview = async (documentId: string, status: 'approved' | 'rejected', comments?: string) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setDocuments(prev =>
        prev.map(doc =>
          doc.id === documentId
            ? {
              ...doc,
              status,
              comments,
              reviewedAt: new Date().toISOString(),
              reviewedBy: 'Expert Reviewer',
            }
            : doc
        )
      );

      toast.success(`Document ${status} successfully`);
      setSelectedDoc(null);
    } catch (error) {
      toast.error('Failed to update document status');
    }
  };

  const pendingCount = documents.filter(doc => doc.status === 'pending').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`max-w-6xl mx-auto p-6 ${darkMode ? 'bg-gray-900 min-h-screen' : ''}`}
    >
      <div className="bg-white rounded-lg shadow-md">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Expert Review Dashboard</h1>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Review and verify user-submitted documents</p>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                <p className="text-yellow-600 text-sm">Pending Reviews</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-green-600">
                  {documents.filter(doc => doc.status === 'approved').length}
                </p>
                <p className="text-green-600 text-sm">Approved</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center">
              <X className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-red-600">
                  {documents.filter(doc => doc.status === 'rejected').length}
                </p>
                <p className="text-red-600 text-sm">Rejected</p>
              </div>
            </div>
          </div>
        </div>

        <div className={`rounded-lg shadow-md overflow-hidden ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
          <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Documents</h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className={`h-12 w-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>No documents yet</h3>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Documents will appear here when users submit them.</p>
              </div>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className={`p-6 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <FileText className={`h-6 w-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                      </div>
                      <div>
                        <h3 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{doc.fileName}</h3>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {doc.documentType} • {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                        doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {doc.status}
                      </span>
                      
                      {doc.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleReview(doc.id, 'approved')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReview(doc.id, 'rejected')}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}