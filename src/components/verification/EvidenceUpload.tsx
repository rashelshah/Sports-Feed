import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, File, CheckCircle, AlertCircle, X, Eye, Download } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';
import { EvidenceDocument } from '../../types';

interface EvidenceUploadProps {
  onClose: () => void;
  sportRole?: any;
}

export function EvidenceUpload({ onClose, sportRole }: EvidenceUploadProps) {
  const { user, updateUser } = useAuthStore();
  const [uploadedFiles, setUploadedFiles] = useState<EvidenceDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    setIsUploading(true);
    
    try {
      const newDocuments: EvidenceDocument[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
          toast.error(`${file.name} is not a supported file type. Please upload JPG, PNG, or PDF files.`);
          continue;
        }
        
        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Please upload files smaller than 5MB.`);
          continue;
        }
        
        // Mock file upload - in real app, this would upload to a server
        const mockFileUrl = URL.createObjectURL(file);
        
        const document: EvidenceDocument = {
          id: Date.now().toString() + i,
          userId: user!.id,
          fileName: file.name,
          fileUrl: mockFileUrl,
          documentType: getDocumentType(file.name),
          sportRole: sportRole?.id || '',
          description: `Evidence for ${sportRole?.name || 'sport role'}`,
          uploadedAt: new Date().toISOString(),
          status: 'pending',
          aiAnalysis: {
            confidence: Math.random() * 0.4 + 0.6, // Mock confidence between 0.6-1.0
            detectedText: `Mock AI analysis for ${file.name}`,
            suggestedAction: Math.random() > 0.3 ? 'approve' : 'manual-review',
            analysisDate: new Date().toISOString(),
          }
        };
        
        newDocuments.push(document);
      }
      
      setUploadedFiles(prev => [...prev, ...newDocuments]);
      toast.success(`${newDocuments.length} file(s) uploaded successfully!`);
      
    } catch (error) {
      toast.error('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const getDocumentType = (fileName: string): 'certificate' | 'license' | 'award' | 'competition-result' | 'training-record' | 'other' => {
    const name = fileName.toLowerCase();
    if (name.includes('certificate') || name.includes('cert')) return 'certificate';
    if (name.includes('license') || name.includes('lic')) return 'license';
    if (name.includes('award') || name.includes('trophy')) return 'award';
    if (name.includes('competition') || name.includes('result')) return 'competition-result';
    if (name.includes('training') || name.includes('record')) return 'training-record';
    return 'other';
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const submitForVerification = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('Please upload at least one evidence document.');
      return;
    }
    
    try {
      // Update user with evidence documents
      const updatedUser = {
        ...user!,
        evidenceDocuments: uploadedFiles,
        verificationStatus: 'pending' as const,
        isVerified: false,
      };
      
      updateUser(updatedUser);
      
      toast.success('Evidence submitted for verification! You will be notified once reviewed.');
      onClose();
      
    } catch (error) {
      toast.error('Failed to submit evidence. Please try again.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Upload Evidence Documents</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Close evidence upload"
            aria-label="Close evidence upload"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {sportRole && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Verification Requirements</h3>
            <p className="text-blue-800 text-sm mb-2">
              <strong>Role:</strong> {sportRole.name}
            </p>
            <p className="text-blue-800 text-sm mb-2">
              <strong>Description:</strong> {sportRole.description}
            </p>
            <p className="text-blue-800 text-sm">
              <strong>Required Evidence:</strong> {sportRole.evidenceTypes.join(', ')}
            </p>
          </div>
        )}

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Upload Evidence Documents
          </h3>
          <p className="text-gray-600 mb-4">
            Drag and drop files here, or click to select files
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Supported formats: JPG, PNG, PDF (Max 5MB each)
          </p>
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            variant="outline"
          >
            {isUploading ? 'Uploading...' : 'Select Files'}
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileInput}
            className="hidden"
            aria-label="Select files to upload"
          />
        </div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Documents</h3>
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <File className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="font-medium text-gray-900">{file.fileName}</p>
                        <p className="text-sm text-gray-600">
                          {file.documentType.replace('-', ' ')} • {file.description}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(file.status)}`}>
                            {file.status}
                          </span>
                          {file.aiAnalysis && (
                            <span className="text-xs text-gray-500">
                              AI Confidence: {Math.round(file.aiAnalysis.confidence * 100)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => window.open(file.fileUrl, '_blank')}
                        className="text-blue-500 hover:text-blue-700 transition-colors"
                        title="View file"
                        aria-label="View file"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Remove file"
                        aria-label="Remove file"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {file.aiAnalysis && (
                    <div className="mt-3 p-3 bg-white rounded border">
                      <p className="text-sm text-gray-700">
                        <strong>AI Analysis:</strong> {file.aiAnalysis.detectedText}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>Suggested Action:</strong> {file.aiAnalysis.suggestedAction}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-6">
          <Button
            onClick={submitForVerification}
            disabled={uploadedFiles.length === 0}
            className="flex-1"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Submit for Verification
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Your documents will be reviewed by our verification team or AI system. 
            You'll receive a notification once the review is complete.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
