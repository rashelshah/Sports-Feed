import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle, Clock, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { VerificationDocument } from '../../types';
import toast from 'react-hot-toast';

interface DocumentUploadProps {
  onUploadComplete: () => void;
}

export function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (file: File, documentType: 'certificate' | 'id' | 'license') => {
    setUploading(true);
    
    try {
      // Mock file upload - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newDocument: VerificationDocument = {
        id: Date.now().toString(),
        userId: '1',
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        documentType,
        status: 'pending',
        uploadedAt: new Date().toISOString(),
      };
      
      setDocuments(prev => [...prev, newDocument]);
      toast.success('Document uploaded successfully');
    } catch (error) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Document Verification</h2>
        <p className="text-gray-600">
          Upload your certificates and documents for expert verification
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {['certificate', 'id', 'license'].map((type) => (
          <div key={type} className="relative">
            <input
              type="file"
              id={type}
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(file, type as 'certificate' | 'id' | 'license');
                }
              }}
            />
            <label
              htmlFor={type}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700 capitalize">
                {type === 'id' ? 'ID Document' : type}
              </span>
              <span className="text-xs text-gray-500 mt-1">
                PDF, JPG, PNG up to 10MB
              </span>
            </label>
          </div>
        ))}
      </div>

      {documents.length > 0 && (
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-semibold text-gray-900">Uploaded Documents</h3>
          {documents.map((doc) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{doc.fileName}</p>
                  <p className="text-sm text-gray-500 capitalize">{doc.documentType}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(doc.status)}`}>
                  {getStatusIcon(doc.status)}
                  <span className="capitalize">{doc.status}</span>
                </div>
                
                <button
                  type="button"
                  onClick={() => removeDocument(doc.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center pt-6 border-t">
        <p className="text-sm text-gray-600">
          {documents.length}/3 documents uploaded
        </p>
        
        <Button
          onClick={onUploadComplete}
          disabled={documents.length === 0 || uploading}
          loading={uploading}
        >
          Submit for Review
        </Button>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Your account will be pending until an expert reviews and approves your documents.
          You'll receive an email notification once verification is complete.
        </p>
      </div>
    </motion.div>
  );
}