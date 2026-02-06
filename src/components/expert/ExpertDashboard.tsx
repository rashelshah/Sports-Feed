import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, X, Clock, FileText, User } from 'lucide-react';
import { VerificationDocument } from '../../types';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

const mockPendingDocuments: VerificationDocument[] = [
  {
    id: '1',
    userId: '4',
    fileName: 'martial_arts_certificate.pdf',
    fileUrl: '#',
    documentType: 'certificate',
    status: 'pending',
    uploadedAt: new Date().toISOString(),
  },
  {
    id: '2',
    userId: '5',
    fileName: 'coaching_license.jpg',
    fileUrl: '#',
    documentType: 'license',
    status: 'pending',
    uploadedAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

export function ExpertDashboard() {
  const [documents, setDocuments] = useState<VerificationDocument[]>(mockPendingDocuments);
  const [selectedDoc, setSelectedDoc] = useState<VerificationDocument | null>(null);

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
      className="max-w-6xl mx-auto p-6"
    >
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Expert Dashboard</h1>
          <p className="text-gray-600">Review and verify user documents</p>
          
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
        </div>

        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents for Review</h2>
          
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No documents to review</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <motion.div
                  key={doc.id}
                  layout
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{doc.fileName}</p>
                        <p className="text-sm text-gray-600 capitalize">{doc.documentType}</p>
                        <p className="text-xs text-gray-500">
                          Uploaded {new Date(doc.uploadedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        doc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {doc.status}
                      </span>
                      
                      {doc.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReview(doc.id, 'approved')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReview(doc.id, 'rejected', 'Document quality insufficient')}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {doc.comments && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{doc.comments}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}