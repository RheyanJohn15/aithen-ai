'use client';

import { useState } from 'react';
import { Database, Upload, Play, History, GitBranch, FileText, CheckCircle, Clock, XCircle, Plus, Search, Filter, Loader2, Trash2 } from 'lucide-react';
import { Modal, Input, Textarea, Button, FileUpload, FileList, type UploadedFile } from '@/components/common';

// Types
interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  currentVersion: string;
  totalVersions: number;
  totalDatasets: number;
  lastUpdated: string;
  status: 'active' | 'training' | 'error';
}

interface DatasetVersion {
  id: string;
  version: string;
  knowledgeBaseId: string;
  createdAt: string;
  createdBy: string;
  fileCount: number;
  totalSize: string;
  status: 'ready' | 'processing' | 'error';
  description?: string;
}

interface TrainingJob {
  id: string;
  knowledgeBaseId: string;
  versionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt: string;
  completedAt?: string;
  modelName?: string;
}

export default function DatasetsAndTraining() {
  const [activeTab, setActiveTab] = useState<'knowledge-bases' | 'training-jobs'>('knowledge-bases');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [selectedKB, setSelectedKB] = useState<string | null>(null);
  const [kbName, setKbName] = useState('');
  const [kbDescription, setKbDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Mock data - replace with actual API calls
  const knowledgeBases: KnowledgeBase[] = [
    {
      id: '1',
      name: 'Product Knowledge Base',
      description: 'Internal product documentation and FAQs',
      currentVersion: 'v2.3.1',
      totalVersions: 12,
      totalDatasets: 45,
      lastUpdated: '2024-01-15',
      status: 'active',
    },
    {
      id: '2',
      name: 'Customer Support KB',
      description: 'Customer support articles and troubleshooting guides',
      currentVersion: 'v1.8.0',
      totalVersions: 8,
      totalDatasets: 32,
      lastUpdated: '2024-01-10',
      status: 'training',
    },
  ];

  const trainingJobs: TrainingJob[] = [
    {
      id: '1',
      knowledgeBaseId: '2',
      versionId: 'v1.8.0',
      status: 'running',
      progress: 65,
      startedAt: '2024-01-15T10:30:00Z',
    },
    {
      id: '2',
      knowledgeBaseId: '1',
      versionId: 'v2.3.0',
      status: 'completed',
      progress: 100,
      startedAt: '2024-01-12T14:20:00Z',
      completedAt: '2024-01-12T16:45:00Z',
      modelName: 'product-kb-v2.3.0',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
      case 'ready':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'training':
      case 'running':
      case 'processing':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'error':
      case 'failed':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
      case 'ready':
        return <CheckCircle className="w-4 h-4" />;
      case 'training':
      case 'running':
      case 'processing':
        return <Clock className="w-4 h-4 animate-spin" />;
      case 'error':
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleFilesSelected = (files: File[]) => {
    const newFiles: UploadedFile[] = files.map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      file,
      status: 'pending' as const,
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleCreateKB = async () => {
    if (!kbName.trim()) {
      alert('Please enter a knowledge base name');
      return;
    }
    if (uploadedFiles.length === 0) {
      alert('Please upload at least one file');
      return;
    }

    setIsCreating(true);
    
    // Simulate file upload progress
    const filesWithProgress = uploadedFiles.map((file) => ({
      ...file,
      status: 'uploading' as const,
      progress: 0,
    }));
    setUploadedFiles(filesWithProgress);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadedFiles((prev) =>
        prev.map((file) => {
          if (file.status === 'uploading' && file.progress !== undefined) {
            const newProgress = Math.min(file.progress + 10, 100);
            return {
              ...file,
              progress: newProgress,
              status: newProgress === 100 ? 'success' : 'uploading',
            };
          }
          return file;
        })
      );
    }, 300);

    // Simulate API call delay
    setTimeout(() => {
      clearInterval(progressInterval);
      setIsCreating(false);
      
      // Reset form and close modal
      setKbName('');
      setKbDescription('');
      setUploadedFiles([]);
      setShowUploadModal(false);
      
      // In a real app, you would refresh the knowledge bases list here
      alert(`Knowledge Base "${kbName}" created successfully!`);
    }, 3000);
  };

  const handleCloseModal = () => {
    if (!isCreating) {
      setShowUploadModal(false);
      setKbName('');
      setKbDescription('');
      setUploadedFiles([]);
    }
  };

  // Mock files for a knowledge base (replace with API call)
  const getKBFiles = (kbId: string) => {
    // Dummy file data
    return [
      { id: '1', name: 'product-manual-v1.pdf', size: 2456789, uploadedAt: '2024-01-15', status: 'ready' },
      { id: '2', name: 'faq-document.md', size: 123456, uploadedAt: '2024-01-14', status: 'ready' },
      { id: '3', name: 'api-reference.json', size: 456789, uploadedAt: '2024-01-13', status: 'ready' },
      { id: '4', name: 'user-guide.pdf', size: 3456789, uploadedAt: '2024-01-12', status: 'ready' },
    ];
  };

  const selectedKBFiles = selectedKB ? getKBFiles(selectedKB) : [];
  const selectedKBName = selectedKB ? knowledgeBases.find(kb => kb.id === selectedKB)?.name : '';

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Datasets & Training</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Manage knowledge bases, version datasets, and train custom AI models
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-[var(--color-aithen-teal)] hover:bg-[var(--color-aithen-teal-dark)] text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Knowledge Base</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('knowledge-bases')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'knowledge-bases'
                ? 'border-[var(--color-aithen-teal)] text-[var(--color-aithen-teal)] dark:text-[var(--color-aithen-teal-light)]'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4" />
              <span>Knowledge Bases</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('training-jobs')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'training-jobs'
                ? 'border-[var(--color-aithen-teal)] text-[var(--color-aithen-teal)] dark:text-[var(--color-aithen-teal-light)]'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Play className="w-4 h-4" />
              <span>Training Jobs</span>
            </div>
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex items-center space-x-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search knowledge bases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-aithen-teal)]/30 focus:border-[var(--color-aithen-teal)]"
          />
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <Filter className="w-4 h-4" />
          <span>Filter</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'knowledge-bases' && (
        <div className="space-y-4">
          {knowledgeBases.map((kb) => (
            <div
              key={kb.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Database className="w-5 h-5 text-[var(--color-aithen-teal)]" />
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">{kb.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(kb.status)}`}>
                      <span className="flex items-center space-x-1">
                        {getStatusIcon(kb.status)}
                        <span className="capitalize">{kb.status}</span>
                      </span>
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{kb.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Version</p>
                      <div className="flex items-center space-x-1">
                        <GitBranch className="w-3.5 h-3.5 text-gray-400" />
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{kb.currentVersion}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Versions</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{kb.totalVersions}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Datasets</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{kb.totalDatasets}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last Updated</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{kb.lastUpdated}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 flex-wrap gap-1.5">
                    <button 
                      onClick={() => {
                        setSelectedKB(kb.id);
                        setShowFilesModal(true);
                      }}
                      className="flex items-center space-x-1 px-2.5 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Manage Files</span>
                    </button>
                    <button className="flex items-center space-x-1 px-2.5 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <History className="w-3.5 h-3.5" />
                      <span>Versions</span>
                    </button>
                    <button className="flex items-center space-x-1 px-2.5 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Add Files</span>
                    </button>
                    <button className="flex items-center space-x-1 px-2.5 py-1 text-sm bg-[var(--color-aithen-teal)]/10 dark:bg-[var(--color-aithen-teal)]/20 text-[var(--color-aithen-teal)] dark:text-[var(--color-aithen-teal-light)] rounded-lg hover:bg-[var(--color-aithen-teal)]/20 dark:hover:bg-[var(--color-aithen-teal)]/30 transition-colors">
                      <Play className="w-3.5 h-3.5" />
                      <span>Train</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {knowledgeBases.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <Database className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No knowledge bases yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Create your first knowledge base to get started</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-[var(--color-aithen-teal)] hover:bg-[var(--color-aithen-teal-dark)] text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Knowledge Base</span>
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'training-jobs' && (
        <div className="space-y-4">
          {trainingJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      Training Job #{job.id}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(job.status)}`}>
                      <span className="flex items-center space-x-1">
                        {getStatusIcon(job.status)}
                        <span className="capitalize">{job.status}</span>
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>Version: {job.versionId}</span>
                    <span>Started: {new Date(job.startedAt).toLocaleDateString()}</span>
                    {job.completedAt && (
                      <span>Completed: {new Date(job.completedAt).toLocaleDateString()}</span>
                    )}
                    {job.modelName && <span>Model: {job.modelName}</span>}
                  </div>
                </div>
              </div>

              {job.status === 'running' && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{job.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-[var(--color-aithen-teal)] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                {job.status === 'completed' && (
                  <button className="flex items-center space-x-1.5 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <FileText className="w-4 h-4" />
                    <span>View Model</span>
                  </button>
                )}
                {(job.status === 'running' || job.status === 'pending') && (
                  <button className="flex items-center space-x-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <XCircle className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {trainingJobs.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <Play className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No training jobs yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Start training a model from a knowledge base</p>
            </div>
          )}
        </div>
      )}

      {/* Create Knowledge Base Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={handleCloseModal}
        title="Create Knowledge Base"
        size="lg"
        closeOnOverlayClick={!isCreating}
        closeOnEscape={!isCreating}
        footer={
          <div className="flex justify-end space-x-1.5">
            <Button
              variant="outline"
              onClick={handleCloseModal}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateKB}
              disabled={isCreating || !kbName.trim() || uploadedFiles.length === 0}
              isLoading={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Knowledge Base Info */}
          <div className="space-y-3">
            <Input
              id="kb-name"
              label="Name"
              type="text"
              value={kbName}
              onChange={(e) => setKbName(e.target.value)}
              placeholder="e.g., Product Documentation"
              disabled={isCreating}
              required
            />

            <Textarea
              id="kb-description"
              label="Description"
              value={kbDescription}
              onChange={(e) => setKbDescription(e.target.value)}
              placeholder="Brief description of this knowledge base..."
              rows={2}
              disabled={isCreating}
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Upload Files <span className="text-red-500">*</span>
            </label>
            <FileUpload
              onFilesSelected={handleFilesSelected}
              multiple={true}
              maxFiles={50}
              maxFileSize={100}
              acceptedFileTypes={['.pdf', '.doc', '.docx', '.txt', '.md', '.json', '.csv', '.xls', '.xlsx']}
            />
          </div>

          {/* File List */}
          {uploadedFiles.length > 0 && (
            <div>
              <FileList
                files={uploadedFiles}
                onRemove={handleRemoveFile}
                showProgress={true}
              />
            </div>
          )}

          {/* Info */}
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> Files will be processed and embedded after creation. You can add more files later or create a new version.
            </p>
          </div>
        </div>
      </Modal>

      {/* File Management Modal */}
      <Modal
        isOpen={showFilesModal}
        onClose={() => {
          setShowFilesModal(false);
          setSelectedKB(null);
        }}
        title={`Manage Files - ${selectedKBName || 'Knowledge Base'}`}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {selectedKBFiles.length} file{selectedKBFiles.length !== 1 ? 's' : ''} total
            </div>
            <div className="flex justify-end space-x-1.5">
              <button
                onClick={() => {
                  setShowFilesModal(false);
                  setSelectedKB(null);
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-3">
          {/* Upload New Files */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Add More Files
            </label>
            <FileUpload
              onFilesSelected={(files) => {
                // Handle new file uploads here
                console.log('New files to upload:', files);
              }}
              multiple={true}
              maxFiles={50}
              maxFileSize={100}
            />
          </div>

          {/* Existing Files List */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Existing Files
            </label>
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {selectedKBFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Uploaded {file.uploadedAt}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      file.status === 'ready' 
                        ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                        : 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
                    }`}>
                      {file.status}
                    </span>
                    <button
                      className="p-1 rounded text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      aria-label={`Delete ${file.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {selectedKBFiles.length === 0 && (
                <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                  No files uploaded yet
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
