import React, { useState, useEffect } from 'react';
import { statutoryMaintenanceService } from '@/lib/statutoryService';
import { Document, DOCUMENT_TYPES } from '@/types/statutory';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import SearchInput from '@/components/ui/SearchInput';

interface DocumentsTabProps {
  organizationId: string;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ organizationId }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    document_type: 'other' as const,
    file: null as File | null,
    tags: [] as string[]
  });

  useEffect(() => {
    fetchDocuments();
  }, [organizationId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const docs = await statutoryMaintenanceService.documents.getDocuments(organizationId);
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadForm.file) return;

    try {
      // Upload file to Supabase Storage
      const uploadResult = await statutoryMaintenanceService.documents.uploadFile(
        uploadForm.file,
        organizationId,
        uploadForm.document_type
      );

      // Create document record
      const documentData = {
        organization_id: organizationId,
        title: uploadForm.title,
        description: uploadForm.description,
        document_type: uploadForm.document_type,
        file_name: uploadForm.file.name,
        file_path: uploadResult.path,
        file_size: uploadForm.file.size,
        mime_type: uploadForm.file.type,
        tags: uploadForm.tags
      };

      await statutoryMaintenanceService.documents.createDocument(documentData);
      
      setShowUploadModal(false);
      setUploadForm({
        title: '',
        description: '',
        document_type: 'other',
        file: null,
        tags: []
      });
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await statutoryMaintenanceService.documents.deleteDocument(id);
        fetchDocuments();
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  };

  const handlePreviewDocument = (document: Document) => {
    setSelectedDocument(document);
    setShowPreviewModal(true);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📈';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || doc.document_type === filterType;
    const matchesStatus = !filterStatus || doc.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) {
    return <LoadingSpinner message="Loading documents..." />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
          <p className="text-gray-600">Document repository and file management</p>
        </div>
        <Button
          onClick={() => setShowUploadModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
        >
          + Upload Document
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <SearchInput
              placeholder="Search documents..."
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              {DOCUMENT_TYPES.map(type => (
                <option key={type} value={type}>{type.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <EmptyState
          title="No Documents Found"
          description={documents.length === 0 
            ? "Get started by uploading your first document." 
            : "No documents match your current filters."}
          icon="📄"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map(doc => (
            <div key={doc.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl">{getFileIcon(doc.mime_type || '')}</div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handlePreviewDocument(doc)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                  >
                    View
                  </Button>
                  <Button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Delete
                  </Button>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">{doc.title}</h3>
              
              {doc.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{doc.description}</p>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type:</span>
                  <span className="font-medium">{doc.document_type.replace('_', ' ').toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Size:</span>
                  <span className="font-medium">{doc.file_size ? formatFileSize(doc.file_size) : 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Version:</span>
                  <span className="font-medium">{doc.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Uploaded:</span>
                  <span className="font-medium">{new Date(doc.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {doc.tags && doc.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {doc.tags.map(tag => (
                    <span key={tag} className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {doc.expiry_date && (
                <div className="mt-3 p-2 bg-yellow-50 rounded text-xs">
                  <span className="text-yellow-800">Expires: {new Date(doc.expiry_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Document"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Title *</label>
            <Input
              type="text"
              value={uploadForm.title}
              onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
              placeholder="Enter document title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              placeholder="Enter document description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document Type *</label>
              <select
                value={uploadForm.document_type}
                onChange={(e) => setUploadForm({ ...uploadForm, document_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {DOCUMENT_TYPES.map(type => (
                  <option key={type} value={type}>{type.replace('_', ' ').toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <Input
                type="date"
                onChange={(e) => setUploadForm({ ...uploadForm, expiry_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
            <input
              type="file"
              onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG</p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button
            onClick={() => setShowUploadModal(false)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleFileUpload}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            disabled={!uploadForm.title || !uploadForm.file}
          >
            Upload Document
          </Button>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={selectedDocument?.title || 'Document Preview'}
      >
        {selectedDocument && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-6xl mb-4">{getFileIcon(selectedDocument.mime_type || '')}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{selectedDocument.title}</h3>
              {selectedDocument.description && (
                <p className="text-gray-600 mb-4">{selectedDocument.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">File Name:</span>
                <p className="font-medium">{selectedDocument.file_name}</p>
              </div>
              <div>
                <span className="text-gray-500">File Size:</span>
                <p className="font-medium">{selectedDocument.file_size ? formatFileSize(selectedDocument.file_size) : 'Unknown'}</p>
              </div>
              <div>
                <span className="text-gray-500">Document Type:</span>
                <p className="font-medium">{selectedDocument.document_type.replace('_', ' ').toUpperCase()}</p>
              </div>
              <div>
                <span className="text-gray-500">Version:</span>
                <p className="font-medium">{selectedDocument.version}</p>
              </div>
              <div>
                <span className="text-gray-500">Uploaded:</span>
                <p className="font-medium">{new Date(selectedDocument.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <p className="font-medium">{selectedDocument.status.toUpperCase()}</p>
              </div>
            </div>

            {selectedDocument.tags && selectedDocument.tags.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-500">Tags:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedDocument.tags.map(tag => (
                    <span key={tag} className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <Button
                onClick={() => window.open(selectedDocument.file_path, '_blank')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
              >
                Download Document
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DocumentsTab; 