'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Database, Upload, Play, History, GitBranch, FileText, CheckCircle, Clock, XCircle, Plus, Search, Filter, Loader2, Trash2, TrendingUp, HardDrive, ChevronDown, ChevronUp, BarChart3, Sparkles, Zap } from 'lucide-react';
import { Modal, Input, Textarea, Button, FileUpload, Confirm } from '@/components/common';
import {
  getKnowledgeBases,
  createKnowledgeBase,
  deleteKnowledgeBase,
  getKnowledgeBaseFiles,
  uploadKnowledgeBaseFiles,
  deleteKnowledgeBaseFile,
  trainKnowledgeBase,
  getKnowledgeBaseVersions,
  deleteKnowledgeBaseVersion,
  type KnowledgeBase as APIKnowledgeBase,
  type KnowledgeBaseFile as APIKnowledgeBaseFile,
  type KnowledgeBaseVersion as APIKnowledgeBaseVersion,
} from '@/api';
import { toast } from '@/lib/toast';
import { useWebSocket, type WebSocketMessage } from '@/hooks/useWebSocket';

// Types
interface QualityMetrics {
  total_embeddings: number;
  total_chunks: number;
  embedding_dimension: number;
  total_storage_size: number;
  average_chunk_size: number;
  quality_score?: number;
}

interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  currentVersion: string;
  totalVersions: number;
  totalDatasets: number;
  lastUpdated: string;
  status: 'active' | 'training' | 'error';
  qualityMetrics?: QualityMetrics;
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

interface FileProgressDetail {
  file_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  status: 'pending' | 'processing' | 'embedding' | 'storing' | 'completed' | 'failed';
  chunks_total: number;
  chunks_done: number;
  percentage: number;
  error?: string;
  started_at?: string;
  completed_at?: string;
}

interface TrainingJob {
  id: string;
  knowledgeBaseId: string;
  knowledgeBaseName: string;
  versionId: string;
  versionString: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt: string;
  completedAt?: string;
  modelName?: string;
  currentFile?: number;
  totalFiles?: number;
  currentChunk?: number;
  totalChunks?: number;
  currentFileName?: string;
  message?: string;
  channel?: string;
  jobId?: string;
  jobIndex?: number;
  totalJobs?: number;
  fileDetails?: FileProgressDetail[];
}

export default function DatasetsAndTraining() {
  const params = useParams();
  const orgSlug = params['company-name'] as string;

  const [activeTab, setActiveTab] = useState<'knowledge-bases' | 'training-jobs'>('knowledge-bases');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [selectedKB, setSelectedKB] = useState<string | null>(null);
  const [kbName, setKbName] = useState('');
  const [kbDescription, setKbDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKBFiles, setSelectedKBFiles] = useState<Array<{ id: string; name: string; size: number; uploadedAt: string; status: string }>>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isDeletingKB, setIsDeletingKB] = useState<string | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState<string | null>(null);
  const [isTrainingKB, setIsTrainingKB] = useState<string | null>(null);
  const [showDeleteKBConfirm, setShowDeleteKBConfirm] = useState(false);
  const [showDeleteFileConfirm, setShowDeleteFileConfirm] = useState(false);
  const [kbToDelete, setKbToDelete] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [trainingChannel, setTrainingChannel] = useState<string | null>(null);
  const [trainingProgress, setTrainingProgress] = useState<{
    currentFile: number;
    totalFiles: number;
    currentChunk: number;
    totalChunks: number;
    percentage: number;
    status: string;
    currentFileName?: string;
    currentFileId?: string;
    currentFileSize?: number;
    currentFileType?: string;
    message?: string;
    jobId?: string;
    jobIndex?: number;
    totalJobs?: number;
    fileDetails?: FileProgressDetail[];
  } | null>(null);
  const [showTrainingProgress, setShowTrainingProgress] = useState(false);
  const [expandedMetricsKB, setExpandedMetricsKB] = useState<string | null>(null);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [kbVersions, setKbVersions] = useState<APIKnowledgeBaseVersion[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isDeletingVersion, setIsDeletingVersion] = useState<string | null>(null);
  const [showDeleteVersionConfirm, setShowDeleteVersionConfirm] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState<string | null>(null);
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([]);
  const [wsErrorShown, setWsErrorShown] = useState(false);

  // Load knowledge bases on mount
  useEffect(() => {
    if (orgSlug && orgSlug !== 'undefined') {
      loadKnowledgeBases();
    } else {
      console.warn('Organization slug is missing:', orgSlug);
      setIsLoading(false);
    }
  }, [orgSlug]);

  const loadKnowledgeBases = async () => {
    try {
      setIsLoading(true);
      const response = await getKnowledgeBases(orgSlug);
      
      // Handle empty or invalid response
      if (!response || !response.data) {
        console.warn('Empty response from API:', response);
        setKnowledgeBases([]);
        return;
      }
      
      // Ensure data is an array
      const dataArray = Array.isArray(response.data) ? response.data : [];
      const kbs = dataArray.map((kb: APIKnowledgeBase) => ({
        id: kb.id,
        name: kb.name,
        description: kb.description,
        currentVersion: kb.current_version,
        totalVersions: kb.total_versions,
        totalDatasets: kb.total_datasets,
        lastUpdated: kb.last_updated,
        status: kb.status as 'active' | 'training' | 'error',
        qualityMetrics: kb.quality_metrics,
      }));
      setKnowledgeBases(kbs);
      
      // Restore training jobs for knowledge bases that are training
      // Check if any KBs are training but we don't have jobs for them
      const trainingKBs = kbs.filter(kb => kb.status === 'training');
      if (trainingKBs.length > 0) {
        // Process each training KB asynchronously
        Promise.all(
          trainingKBs.map(async (kb) => {
            // Check current training jobs state
            setTrainingJobs((prevJobs) => {
              const existingJob = prevJobs.find(job => job.knowledgeBaseId === kb.id && job.status === 'running');
              if (existingJob) {
                return prevJobs; // Already have a job for this KB
              }
              return prevJobs; // Will add job below
            });
            
            // Try to get versions to find the active training version
            try {
              const versionsResponse = await getKnowledgeBaseVersions(orgSlug, kb.id);
              const versions = versionsResponse.data || [];
              const trainingVersion = versions.find((v: APIKnowledgeBaseVersion) => v.status === 'training');
              
              if (trainingVersion) {
                // Create a training job entry for this KB
                const channel = `training_${kb.id}_${trainingVersion.id}`;
                const newJob: TrainingJob = {
                  id: trainingVersion.id,
                  knowledgeBaseId: kb.id,
                  knowledgeBaseName: kb.name,
                  versionId: trainingVersion.id,
                  versionString: trainingVersion.version_string,
                  status: 'running',
                  progress: 0,
                  startedAt: trainingVersion.training_started_at,
                  channel: channel,
                };
                
                setTrainingJobs((prev) => {
                  // Don't add if already exists
                  if (prev.some(job => job.channel === channel)) {
                    return prev;
                  }
                  return [newJob, ...prev];
                });
                
                // Set the channel to reconnect WebSocket if we don't have one
                setTrainingChannel((currentChannel) => {
                  if (!currentChannel) {
                    return channel;
                  }
                  return currentChannel;
                });
              } else {
                // No training version found - KB might be stuck in training status
                // This could happen if training failed but status wasn't updated
                console.warn(`KB ${kb.id} (${kb.name}) shows as training but no training version found. The KB status may be stuck.`);
              }
            } catch (err) {
              console.warn(`Failed to load versions for KB ${kb.id}:`, err);
            }
          })
        ).catch((err) => {
          console.error('Error restoring training jobs:', err);
        });
      }
    } catch (error: any) {
      console.error('Failed to load knowledge bases:', error);
      const errorMessage = error?.message || error?.data?.error || error?.statusText || (typeof error === 'string' ? error : JSON.stringify(error)) || 'Unknown error';
      console.error('Error details:', {
        message: error?.message,
        status: error?.status,
        statusText: error?.statusText,
        data: error?.data,
        fullError: error,
        errorType: typeof error,
        errorString: String(error),
      });
      toast.error('Failed to load knowledge bases', {
        description: errorMessage,
      });
      setKnowledgeBases([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const loadKnowledgeBaseFiles = async (kbId: string) => {
    try {
      const response = await getKnowledgeBaseFiles(orgSlug, kbId);
      const files = response.data.map((file: APIKnowledgeBaseFile) => ({
        id: file.id,
        name: file.name,
        size: file.file_size,
        uploadedAt: new Date(file.created_at).toLocaleDateString(),
        status: file.status,
      }));
      setSelectedKBFiles(files);
    } catch (error: any) {
      console.error('Failed to load files:', error);
      const errorMessage = error?.message || error?.data?.error || error?.statusText || JSON.stringify(error) || 'Unknown error';
      toast.error('Failed to load files', {
        description: errorMessage,
      });
    }
  };

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

  const handleCreateKB = async () => {
    if (!kbName.trim()) {
      toast.warning('Validation Error', {
        description: 'Please enter a knowledge base name',
      });
      return;
    }

    setIsCreating(true);
    
    try {
      // Create knowledge base
      const kbResponse = await createKnowledgeBase(orgSlug, {
        name: kbName,
        description: kbDescription,
      });

      // Save name for success message before resetting
      const createdKBName = kbName;
      
      // Reset form and close modal
      setKbName('');
      setKbDescription('');
      setShowUploadModal(false);
      
      // Reload knowledge bases
      await loadKnowledgeBases();
      
      toast.success('Knowledge Base Created', {
        description: `"${createdKBName}" has been created successfully. You can add files after creation.`,
      });
    } catch (error: any) {
      console.error('Failed to create knowledge base:', error);
      const errorMessage = error?.message || error?.data?.error || 'Unknown error';
      toast.error('Failed to create knowledge base', {
        description: errorMessage,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteKB = (kbId: string) => {
    setKbToDelete(kbId);
    setShowDeleteKBConfirm(true);
  };

  const confirmDeleteKB = async () => {
    if (!kbToDelete) return;

    const kbName = knowledgeBases.find(kb => kb.id === kbToDelete)?.name || 'this knowledge base';

    try {
      setIsDeletingKB(kbToDelete);
      await deleteKnowledgeBase(orgSlug, kbToDelete);
      await loadKnowledgeBases();
      toast.success('Knowledge Base Deleted', {
        description: `"${kbName}" has been deleted successfully`,
      });
      setShowDeleteKBConfirm(false);
      setKbToDelete(null);
    } catch (error: any) {
      console.error('Failed to delete knowledge base:', error);
      const errorMessage = error?.message || error?.data?.error || 'Unknown error';
      toast.error('Failed to delete knowledge base', {
        description: errorMessage,
      });
    } finally {
      setIsDeletingKB(null);
    }
  };

  const handleCloseModal = () => {
    if (!isCreating) {
      setShowUploadModal(false);
      setKbName('');
      setKbDescription('');
    }
  };

  const handleOpenFilesModal = async (kbId: string) => {
    setSelectedKB(kbId);
    setShowFilesModal(true);
    await loadKnowledgeBaseFiles(kbId);
  };

  const handleOpenVersionsModal = async (kbId: string) => {
    setSelectedKB(kbId);
    setShowVersionsModal(true);
    await loadKnowledgeBaseVersions(kbId);
  };

  const loadKnowledgeBaseVersions = async (kbId: string) => {
    try {
      setIsLoadingVersions(true);
      const response = await getKnowledgeBaseVersions(orgSlug, kbId);
      setKbVersions(response.data || []);
    } catch (error: any) {
      console.error('Failed to load versions:', error);
      const errorMessage = error?.message || error?.data?.error || 'Unknown error';
      toast.error('Failed to load versions', {
        description: errorMessage,
      });
      setKbVersions([]);
    } finally {
      setIsLoadingVersions(false);
    }
  };

  const handleDeleteVersion = (versionId: string) => {
    setVersionToDelete(versionId);
    setShowDeleteVersionConfirm(true);
  };

  const confirmDeleteVersion = async () => {
    if (!selectedKB || !versionToDelete) return;

    const version = kbVersions.find(v => v.id === versionToDelete);
    const versionString = version?.version_string || 'this version';

    // Check if it's the latest version
    const latestVersion = kbVersions.length > 0 ? kbVersions[0] : null;
    const isLatest = latestVersion?.id === versionToDelete;

    if (isLatest) {
      toast.warning('Cannot Delete Current Version', {
        description: 'You cannot delete the current version. Please train a new version first.',
      });
      setShowDeleteVersionConfirm(false);
      setVersionToDelete(null);
      return;
    }

    // Check if it's the only version
    if (kbVersions.length <= 1) {
      toast.warning('Cannot Delete Only Version', {
        description: 'You cannot delete the only version. Create a new version first.',
      });
      setShowDeleteVersionConfirm(false);
      setVersionToDelete(null);
      return;
    }

    try {
      setIsDeletingVersion(versionToDelete);
      await deleteKnowledgeBaseVersion(orgSlug, selectedKB, versionToDelete);
      await loadKnowledgeBaseVersions(selectedKB);
      await loadKnowledgeBases(); // Refresh KB list to update version count
      toast.success('Version Deleted', {
        description: `Version ${versionString} has been deleted successfully`,
      });
      setShowDeleteVersionConfirm(false);
      setVersionToDelete(null);
    } catch (error: any) {
      console.error('Failed to delete version:', error);
      const errorMessage = error?.message || error?.data?.error || 'Unknown error';
      toast.error('Failed to delete version', {
        description: errorMessage,
      });
    } finally {
      setIsDeletingVersion(null);
    }
  };

  const handleUploadMoreFiles = async (files: File[]) => {
    if (!selectedKB || files.length === 0) return;

    const loadingToast = toast.loading('Uploading files...', {
      description: `Uploading ${files.length} file${files.length > 1 ? 's' : ''}`,
    });

    try {
      setIsUploadingFiles(true);
      await uploadKnowledgeBaseFiles(orgSlug, selectedKB, files);
      await loadKnowledgeBaseFiles(selectedKB);
      toast.dismiss(loadingToast);
      toast.success('Files Uploaded', {
        description: `${files.length} file${files.length > 1 ? 's' : ''} uploaded successfully`,
      });
    } catch (error: any) {
      console.error('Failed to upload files:', error);
      toast.dismiss(loadingToast);
      const errorMessage = error?.message || error?.data?.error || 'Unknown error';
      toast.error('Failed to upload files', {
        description: errorMessage,
      });
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const handleDeleteFile = (fileId: string) => {
    if (!selectedKB) return;
    setFileToDelete(fileId);
    setShowDeleteFileConfirm(true);
  };

  const confirmDeleteFile = async () => {
    if (!selectedKB || !fileToDelete) return;

    const fileName = selectedKBFiles.find(f => f.id === fileToDelete)?.name || 'this file';

    try {
      setIsDeletingFile(fileToDelete);
      await deleteKnowledgeBaseFile(orgSlug, selectedKB, fileToDelete);
      await loadKnowledgeBaseFiles(selectedKB);
      toast.success('File Deleted', {
        description: `"${fileName}" has been deleted successfully`,
      });
      setShowDeleteFileConfirm(false);
      setFileToDelete(null);
    } catch (error: any) {
      console.error('Failed to delete file:', error);
      const errorMessage = error?.message || error?.data?.error || 'Unknown error';
      toast.error('Failed to delete file', {
        description: errorMessage,
      });
    } finally {
      setIsDeletingFile(null);
    }
  };

  // WebSocket connection for training progress - keep connected even when modal is closed
  const { isConnected, lastMessage } = useWebSocket({
    channel: trainingChannel,
    enabled: !!trainingChannel,
    onOpen: () => {
      // Reset error flag on successful connection
      setWsErrorShown(false);
    },
    onMessage: (message: WebSocketMessage) => {
      if (message.type === 'progress' && message.progress) {
        // Extract file details from message data if available
        const messageData = message.data as any;
        const fileDetails = messageData?.file_details || [];
        
        const progressData = {
          currentFile: message.progress.current_file,
          totalFiles: message.progress.total_files,
          currentChunk: message.progress.current_chunk,
          totalChunks: message.progress.total_chunks,
          percentage: message.progress.percentage,
          status: message.progress.status,
          currentFileName: messageData?.current_file_name || message.progress.current_file_url,
          currentFileId: messageData?.current_file_id,
          currentFileSize: messageData?.current_file_size,
          currentFileType: messageData?.current_file_type,
          message: message.progress.message,
          jobId: messageData?.job_id,
          jobIndex: messageData?.job_index,
          totalJobs: messageData?.total_jobs,
          fileDetails: fileDetails,
        };
        
        // Update modal progress if open
        setTrainingProgress(progressData);
        
        // Update training jobs list
        setTrainingJobs((prev) => {
          const updated = [...prev];
          const jobIndex = updated.findIndex(job => job.channel === trainingChannel);
          if (jobIndex >= 0) {
            updated[jobIndex] = {
              ...updated[jobIndex],
              progress: progressData.percentage,
              status: progressData.status === 'completed' ? 'completed' : progressData.status === 'error' ? 'failed' : 'running',
              currentFile: progressData.currentFile,
              totalFiles: progressData.totalFiles,
              currentChunk: progressData.currentChunk,
              totalChunks: progressData.totalChunks,
              currentFileName: progressData.currentFileName,
              message: progressData.message,
              jobId: progressData.jobId,
              jobIndex: progressData.jobIndex,
              totalJobs: progressData.totalJobs,
              fileDetails: progressData.fileDetails,
            };
          }
          return updated;
        });
      } else if (message.type === 'job_queue_created' || message.type === 'job_started' || message.type === 'job_completed' || message.type === 'all_jobs_completed') {
        // Handle job queue events
        const messageData = message.data as any;
        if (message.type === 'job_queue_created') {
          toast.info('Training Jobs Created', {
            description: `${messageData.total_jobs} job(s) created for ${messageData.total_files} file(s)`,
          });
        } else if (message.type === 'job_started') {
          toast.info(`Job ${messageData.job_index}/${messageData.total_jobs} Started`, {
            description: `Processing ${messageData.file_count} file(s)`,
          });
        } else if (message.type === 'job_completed') {
          toast.success(`Job ${messageData.job_index}/${messageData.total_jobs} Completed`, {
            description: 'Job completed successfully',
          });
        } else if (message.type === 'all_jobs_completed') {
          if (messageData.status === 'success') {
            toast.success('All Training Jobs Completed', {
              description: `Successfully processed ${messageData.completed} job(s)`,
            });
            loadKnowledgeBases();
          } else {
            toast.warning('Training Completed with Errors', {
              description: `${messageData.completed} completed, ${messageData.failed} failed`,
            });
          }
        }
      } else if (message.type === 'complete') {
        setTrainingProgress((prev) => prev ? { ...prev, percentage: 100, status: 'completed' } : null);
        toast.success('Training Completed', {
          description: 'Knowledge base training completed successfully',
        });
        loadKnowledgeBases();
        
        // Update training jobs
        setTrainingJobs((prev) => {
          const updated = [...prev];
          const jobIndex = updated.findIndex(job => job.channel === trainingChannel);
          if (jobIndex >= 0) {
            updated[jobIndex] = {
              ...updated[jobIndex],
              progress: 100,
              status: 'completed',
              completedAt: new Date().toISOString(),
            };
          }
          return updated;
        });
        
        // Clear channel after a delay
        setTimeout(() => {
          setTrainingChannel(null);
          setTrainingProgress(null);
        }, 2000);
      } else if (message.type === 'error') {
        toast.error('Training Error', {
          description: message.error || 'An error occurred during training',
        });
        setTrainingProgress(null);
        
        // Update training jobs
        setTrainingJobs((prev) => {
          const updated = [...prev];
          const jobIndex = updated.findIndex(job => job.channel === trainingChannel);
          if (jobIndex >= 0) {
            updated[jobIndex] = {
              ...updated[jobIndex],
              status: 'failed',
            };
          }
          return updated;
        });
        
        setTrainingChannel(null);
        loadKnowledgeBases();
      }
    },
    onError: (error) => {
      // Only show error toast once per training session
      // Don't show errors during initial connection attempts
      if ((isConnected || trainingProgress) && !wsErrorShown) {
        setWsErrorShown(true);
        toast.error('Connection Error', {
          description: 'Lost connection to training progress updates. Attempting to reconnect...',
          duration: 5000,
        });
      }
    },
  });

  const handleTrainKB = async (kbId: string) => {
    const kb = knowledgeBases.find(k => k.id === kbId);
    const kbName = kb?.name || 'this knowledge base';

    // Check if already training
    if (kb?.status === 'training') {
      toast.warning('Already Training', {
        description: `"${kbName}" is already being trained`,
      });
      return;
    }

    // Check if has files
    if (kb?.totalDatasets === 0) {
      toast.warning('No Files', {
        description: `"${kbName}" has no files. Please add files before training.`,
      });
      return;
    }

    try {
      setIsTrainingKB(kbId);
      const response = await trainKnowledgeBase(orgSlug, kbId);
      await loadKnowledgeBases();
      
      // Start WebSocket connection for progress updates
      if (response.data.channel) {
        const channel = response.data.channel;
        setTrainingChannel(channel);
        setWsErrorShown(false); // Reset error flag for new training session
        
        // Add to training jobs list
        const newJob: TrainingJob = {
          id: response.data.version.id || `job-${Date.now()}`,
          knowledgeBaseId: kbId,
          knowledgeBaseName: kbName,
          versionId: response.data.version.id || '',
          versionString: response.data.version.version_string,
          status: 'running',
          progress: 0,
          startedAt: new Date().toISOString(),
          currentFile: 0,
          totalFiles: 0,
          currentChunk: 0,
          totalChunks: 0,
          channel: channel,
        };
        setTrainingJobs((prev) => [newJob, ...prev]);
        
        // Optionally show modal, but allow closing
        setShowTrainingProgress(true);
        setTrainingProgress({
          currentFile: 0,
          totalFiles: 0,
          currentChunk: 0,
          totalChunks: 0,
          percentage: 0,
          status: 'starting',
        });
      }
      
      toast.success('Training Started', {
        description: `Training started for "${kbName}". New version: ${response.data.version.version_string}`,
      });
    } catch (error: any) {
      console.error('Failed to start training:', error);
      const errorMessage = error?.message || error?.data?.error || 'Unknown error';
      toast.error('Failed to start training', {
        description: errorMessage,
      });
    } finally {
      setIsTrainingKB(null);
    }
  };

  const selectedKBName = selectedKB ? knowledgeBases.find(kb => kb.id === selectedKB)?.name : '';

  return (
    <>
      {/* Add shimmer animation for training cards */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }
          100% {
            transform: translateX(200%) skewX(-12deg);
          }
        }
      `}</style>
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
            suppressHydrationWarning
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
            suppressHydrationWarning
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
            suppressHydrationWarning
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
        <button 
          className="flex items-center space-x-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          suppressHydrationWarning
        >
          <Filter className="w-4 h-4" />
          <span>Filter</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'knowledge-bases' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12 animate-in fade-in duration-300">
              <div className="relative inline-block">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-aithen-teal)] mx-auto mb-3" />
                <div className="absolute inset-0 w-8 h-8 border-2 border-[var(--color-aithen-teal)]/20 rounded-full mx-auto mb-3 animate-ping" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">Loading knowledge bases...</p>
            </div>
          ) : (
            <>
              {knowledgeBases.filter((kb) =>
                kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                kb.description.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((kb) => (
            <div
              key={kb.id}
              className={`relative bg-white dark:bg-gray-800 border rounded-lg p-5 hover:shadow-lg transition-all duration-300 hover:scale-[1.01] overflow-hidden ${
                kb.status === 'training' || isTrainingKB === kb.id
                  ? 'border-[var(--color-aithen-teal)] shadow-lg shadow-[var(--color-aithen-teal)]/20 bg-gradient-to-br from-white via-[var(--color-aithen-teal)]/5 to-blue-500/5 dark:from-gray-800 dark:via-[var(--color-aithen-teal)]/10 dark:to-blue-500/10'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Database className={`w-5 h-5 transition-all duration-300 ${
                      kb.status === 'training' || isTrainingKB === kb.id
                        ? 'text-[var(--color-aithen-teal)] animate-pulse'
                        : 'text-[var(--color-aithen-teal)]'
                    }`} />
                    <h3 className={`text-base font-semibold transition-colors duration-300 ${
                      kb.status === 'training' || isTrainingKB === kb.id
                        ? 'text-[var(--color-aithen-teal)] dark:text-[var(--color-aithen-teal-light)]'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {kb.name}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium transition-all duration-300 ${
                      kb.status === 'training' || isTrainingKB === kb.id
                        ? 'bg-gradient-to-r from-[var(--color-aithen-teal)]/20 to-blue-500/20 dark:from-[var(--color-aithen-teal)]/30 dark:to-blue-500/30 text-[var(--color-aithen-teal)] dark:text-[var(--color-aithen-teal-light)] shadow-md animate-pulse'
                        : getStatusColor(kb.status)
                    }`}>
                      <span className="flex items-center space-x-1">
                        {getStatusIcon(kb.status)}
                        <span className="capitalize">{kb.status}</span>
                      </span>
                    </span>
                  </div>
                  <p className={`text-sm mb-4 transition-colors duration-300 ${
                    kb.status === 'training' || isTrainingKB === kb.id
                      ? 'text-gray-700 dark:text-gray-300'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {kb.description}
                  </p>
                  
                  <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 transition-all duration-300 ${
                    kb.status === 'training' || isTrainingKB === kb.id
                      ? 'opacity-90'
                      : ''
                  }`}>
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

                  {/* Quality Metrics Toggle Button */}
                  {kb.qualityMetrics && (
                    <div className="mt-3">
                    <button 
                        onClick={() => setExpandedMetricsKB(expandedMetricsKB === kb.id ? null : kb.id)}
                        className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                        suppressHydrationWarning
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>View Quality Metrics</span>
                        {expandedMetricsKB === kb.id ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Quality Metrics Section - Expandable */}
                  {kb.qualityMetrics && expandedMetricsKB === kb.id && (
                    <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg animate-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                          Quality Metrics ({kb.currentVersion})
                        </h4>
                        <button
                          onClick={() => setExpandedMetricsKB(null)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          suppressHydrationWarning
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Embeddings</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {kb.qualityMetrics.total_embeddings.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Chunks</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {kb.qualityMetrics.total_chunks.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Dimension</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {kb.qualityMetrics.embedding_dimension}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Storage Size</p>
                          <div className="flex items-center space-x-1">
                            <HardDrive className="w-3 h-3 text-gray-400" />
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {kb.qualityMetrics.total_storage_size >= 1024 * 1024 * 1024
                                ? `${(kb.qualityMetrics.total_storage_size / (1024 * 1024 * 1024)).toFixed(2)} GB`
                                : `${(kb.qualityMetrics.total_storage_size / (1024 * 1024)).toFixed(2)} MB`}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Chunk Size</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {kb.qualityMetrics.average_chunk_size.toLocaleString()} chars
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Quality Score</p>
                          <div className="flex items-center space-x-1">
                            {kb.qualityMetrics.quality_score !== undefined && kb.qualityMetrics.quality_score !== null ? (
                              <>
                                <TrendingUp className={`w-3 h-3 ${
                                  kb.qualityMetrics.quality_score >= 80
                                    ? 'text-green-600 dark:text-green-400'
                                    : kb.qualityMetrics.quality_score >= 60
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : 'text-red-600 dark:text-red-400'
                                }`} />
                                <p className={`text-sm font-medium ${
                                  kb.qualityMetrics.quality_score >= 80
                                    ? 'text-green-600 dark:text-green-400'
                                    : kb.qualityMetrics.quality_score >= 60
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {kb.qualityMetrics.quality_score.toFixed(1)}
                                </p>
                                <span className="text-xs text-gray-400 dark:text-gray-500">/100</span>
                              </>
                            ) : (
                              <p className="text-sm font-medium text-gray-400 dark:text-gray-500">N/A</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Training Animation Overlay - Shimmer Effect */}
                  {(kb.status === 'training' || isTrainingKB === kb.id) && (
                    <div className="absolute inset-0 rounded-lg pointer-events-none overflow-hidden">
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--color-aithen-teal)]/20 to-transparent transform -skew-x-12"
                        style={{
                          animation: 'shimmer 2s infinite',
                        }}
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-1.5 flex-wrap gap-1.5">
                    <button 
                      onClick={() => handleOpenFilesModal(kb.id)}
                      className="flex items-center space-x-1 px-2.5 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      suppressHydrationWarning
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Manage Files</span>
                    </button>
                    <button 
                      onClick={() => handleOpenVersionsModal(kb.id)}
                      className="flex items-center space-x-1 px-2.5 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      suppressHydrationWarning
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Versions</span>
                    </button>
                    <button 
                      onClick={() => handleOpenFilesModal(kb.id)}
                      className="flex items-center space-x-1 px-2.5 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      suppressHydrationWarning
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Add Files</span>
                    </button>
                    <button 
                      onClick={() => handleTrainKB(kb.id)}
                      disabled={isTrainingKB === kb.id || kb.status === 'training'}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-all duration-300 ${
                        kb.status === 'training' || isTrainingKB === kb.id
                          ? 'bg-gradient-to-r from-[var(--color-aithen-teal)]/20 to-blue-500/20 dark:from-[var(--color-aithen-teal)]/30 dark:to-blue-500/30 text-[var(--color-aithen-teal)] dark:text-[var(--color-aithen-teal-light)] shadow-lg shadow-[var(--color-aithen-teal)]/20 animate-pulse'
                          : 'bg-[var(--color-aithen-teal)]/10 dark:bg-[var(--color-aithen-teal)]/20 text-[var(--color-aithen-teal)] dark:text-[var(--color-aithen-teal-light)] hover:bg-[var(--color-aithen-teal)]/20 dark:hover:bg-[var(--color-aithen-teal)]/30 hover:shadow-md hover:scale-105'
                      } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                      suppressHydrationWarning
                    >
                      {kb.status === 'training' || isTrainingKB === kb.id ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                          <Loader2 className="w-3.5 h-3.5 animate-spin absolute" />
                          <span className="relative">Training...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" />
                      <span>Train</span>
                        </>
                      )}
                    </button>
                    <button 
                      onClick={() => handleDeleteKB(kb.id)}
                      disabled={isDeletingKB === kb.id}
                      className="flex items-center space-x-1 px-2.5 py-1 text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                      suppressHydrationWarning
                    >
                      {isDeletingKB === kb.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

              {!isLoading && knowledgeBases.filter((kb) =>
                kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                kb.description.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <Database className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No knowledge bases yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Create your first knowledge base to get started</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-[var(--color-aithen-teal)] hover:bg-[var(--color-aithen-teal-dark)] text-white rounded-lg text-sm font-medium transition-colors"
                    suppressHydrationWarning
              >
                <Plus className="w-4 h-4" />
                <span>Create Knowledge Base</span>
              </button>
            </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'training-jobs' && (
        <div className="space-y-4">
          {trainingJobs.map((job) => (
            <div
              key={job.id}
              className={`bg-white dark:bg-gray-800 border rounded-lg p-5 ${
                job.status === 'running' 
                  ? 'border-[var(--color-aithen-teal)] shadow-md' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      {job.knowledgeBaseName} - {job.versionString}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(job.status)}`}>
                      <span className="flex items-center space-x-1">
                        {getStatusIcon(job.status)}
                        <span className="capitalize">{job.status}</span>
                      </span>
                    </span>
                    {job.status === 'running' && (
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs font-medium rounded-full animate-pulse">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <span>Started: {new Date(job.startedAt).toLocaleString()}</span>
                    {job.completedAt && (
                      <span>Completed: {new Date(job.completedAt).toLocaleString()}</span>
                    )}
              </div>

                  {/* Progress Bar */}
                  {(job.status === 'running' || job.status === 'completed') && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>Overall Progress</span>
                    <span>{job.progress}%</span>
                  </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                          className="bg-[var(--color-aithen-teal)] h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>
              )}

                  {/* Detailed Progress for Running Jobs */}
                  {job.status === 'running' && (
                    <div className="space-y-2 mb-4">
                      {job.totalFiles !== undefined && job.totalFiles > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400">Files</span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {job.currentFile || 0} / {job.totalFiles}
                          </span>
                        </div>
                      )}
                      {job.totalChunks !== undefined && job.totalChunks > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400">Chunks</span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {job.currentChunk || 0} / {job.totalChunks}
                          </span>
                        </div>
                      )}
                      {job.currentFileName && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          Processing: {job.currentFileName}
                        </p>
                      )}
                      {job.message && (
                        <div className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded text-xs text-gray-700 dark:text-gray-300">
                          {job.message}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {job.status === 'running' && (
                  <button 
                    onClick={() => {
                      setSelectedKB(job.knowledgeBaseId);
                      setTrainingChannel(job.channel || null);
                      setShowTrainingProgress(true);
                      if (job.channel === trainingChannel && trainingProgress) {
                        // Already have progress data
                      } else {
                        setTrainingProgress({
                          currentFile: job.currentFile || 0,
                          totalFiles: job.totalFiles || 0,
                          currentChunk: job.currentChunk || 0,
                          totalChunks: job.totalChunks || 0,
                          percentage: job.progress,
                          status: job.status,
                          currentFileName: job.currentFileName,
                          message: job.message,
                        });
                      }
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    suppressHydrationWarning
                  >
                    <Play className="w-4 h-4" />
                    <span>View Details</span>
                  </button>
                )}
                {job.status === 'completed' && (
                  <button 
                    onClick={() => handleOpenVersionsModal(job.knowledgeBaseId)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    suppressHydrationWarning
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Version</span>
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
              disabled={isCreating || !kbName.trim()}
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

          {/* Info */}
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> You can add files to this knowledge base after creation by clicking "Manage Files" or "Add Files" on the knowledge base card.
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
                suppressHydrationWarning
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
              onFilesSelected={handleUploadMoreFiles}
              multiple={true}
              maxFiles={50}
              maxFileSize={100}
            />
            {isUploadingFiles && (
              <div className="mt-2 flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading files...</span>
              </div>
            )}
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
                      onClick={() => handleDeleteFile(file.id)}
                      disabled={isDeletingFile === file.id}
                      className="p-1 rounded text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                      aria-label={`Delete ${file.name}`}
                      suppressHydrationWarning
                    >
                      {isDeletingFile === file.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                      )}
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

      {/* Delete Knowledge Base Confirmation */}
      <Confirm
        isOpen={showDeleteKBConfirm}
        onClose={() => {
          setShowDeleteKBConfirm(false);
          setKbToDelete(null);
        }}
        onConfirm={confirmDeleteKB}
        action="delete"
        message={kbToDelete ? `Are you sure you want to delete "${knowledgeBases.find(kb => kb.id === kbToDelete)?.name || 'this knowledge base'}"?` : ''}
        description="This action cannot be undone. All files associated with this knowledge base will also be deleted."
        isLoading={isDeletingKB === kbToDelete}
      />

      {/* Delete File Confirmation */}
      <Confirm
        isOpen={showDeleteFileConfirm}
        onClose={() => {
          setShowDeleteFileConfirm(false);
          setFileToDelete(null);
        }}
        onConfirm={confirmDeleteFile}
        action="delete"
        message={fileToDelete ? `Are you sure you want to delete "${selectedKBFiles.find(f => f.id === fileToDelete)?.name || 'this file'}"?` : ''}
        description="This action cannot be undone."
        isLoading={isDeletingFile === fileToDelete}
      />

      {/* Training Progress Modal */}
      <Modal
        isOpen={showTrainingProgress}
        onClose={() => {
          setShowTrainingProgress(false);
          // Keep WebSocket connection active for training jobs tab
        }}
        title="Training Progress"
        size="md"
        closeOnOverlayClick={true}
        closeOnEscape={true}
      >
        {trainingChannel && trainingJobs.some(job => job.channel === trainingChannel && job.status === 'running') && (
          <div className="mb-4 flex items-center justify-center animate-in fade-in slide-in-from-top-2 duration-300">
            <span className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-800 dark:text-blue-400 text-xs font-medium rounded-full animate-pulse flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
              <span>Active Training</span>
            </span>
          </div>
        )}
        <div className="space-y-4">
          {trainingProgress && (
            <>
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Overall Progress</span>
                  <span className="font-medium text-gray-900 dark:text-white">{trainingProgress.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-[var(--color-aithen-teal)] h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${trainingProgress.percentage}%` }}
                  />
                </div>
              </div>

              {/* File Progress */}
              {trainingProgress.totalFiles > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Files</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {trainingProgress.currentFile} / {trainingProgress.totalFiles}
                    </span>
                  </div>
                  {trainingProgress.currentFileName && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      Processing: {trainingProgress.currentFileName}
                    </p>
                  )}
                </div>
              )}

              {/* Chunk Progress */}
              {trainingProgress.totalChunks > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Chunks</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {trainingProgress.currentChunk} / {trainingProgress.totalChunks}
                    </span>
                  </div>
                </div>
              )}

              {/* Job Information */}
              {trainingProgress.totalJobs && trainingProgress.totalJobs > 1 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-700 dark:text-blue-300 font-medium">Job Progress</span>
                    <span className="text-blue-900 dark:text-blue-200">
                      {trainingProgress.jobIndex || 0} / {trainingProgress.totalJobs}
                    </span>
                  </div>
                </div>
              )}

              {/* File Details List */}
              {trainingProgress.fileDetails && trainingProgress.fileDetails.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">File Processing Details</h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {trainingProgress.fileDetails.filter(f => f.status === 'completed').length} / {trainingProgress.fileDetails.length} completed
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                    {trainingProgress.fileDetails.map((file, idx) => (
                      <div
                        key={file.file_id || idx}
                        className={`p-2 rounded border transition-all ${
                          file.status === 'completed'
                            ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50'
                            : file.status === 'failed'
                            ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50'
                            : file.status === 'processing' || file.status === 'embedding' || file.status === 'storing'
                            ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50'
                            : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                              {file.file_name}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {(file.file_size / 1024).toFixed(2)} KB
                              </span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                {file.file_type.split('/').pop() || 'unknown'}
                              </span>
                            </div>
                          </div>
                          <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                            file.status === 'completed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : file.status === 'failed'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              : file.status === 'processing' || file.status === 'embedding' || file.status === 'storing'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {file.status === 'completed' ? '✓' : file.status === 'failed' ? '✗' : file.status === 'embedding' ? '⟳' : file.status === 'storing' ? '💾' : '⏳'}
                          </span>
                        </div>
                        {file.chunks_total > 0 && (
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500 dark:text-gray-400">Chunks</span>
                              <span className="text-gray-900 dark:text-white font-medium">
                                {file.chunks_done} / {file.chunks_total}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  file.status === 'completed'
                                    ? 'bg-green-500'
                                    : file.status === 'failed'
                                    ? 'bg-red-500'
                                    : 'bg-blue-500'
                                }`}
                                style={{ width: `${file.percentage}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {file.error && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{file.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Message */}
              {trainingProgress.message && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{trainingProgress.message}</p>
                </div>
              )}

              {/* Connection Status */}
              <div className="flex items-center space-x-2 text-xs">
                {isConnected ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-gray-500 dark:text-gray-400">Connected</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <span className="text-gray-500 dark:text-gray-400">Connecting...</span>
                  </>
                )}
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-center pt-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    trainingProgress.status === 'completed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : trainingProgress.status === 'error'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}
                >
                  {trainingProgress.status === 'completed'
                    ? 'Completed'
                    : trainingProgress.status === 'error'
                    ? 'Error'
                    : trainingProgress.status === 'embedding'
                    ? 'Creating Embeddings'
                    : trainingProgress.status === 'storing'
                    ? 'Storing Embeddings'
                    : 'Processing'}
                </span>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Versions Modal */}
      <Modal
        isOpen={showVersionsModal}
        onClose={() => {
          setShowVersionsModal(false);
          setSelectedKB(null);
          setKbVersions([]);
        }}
        title={`Versions - ${selectedKBName || 'Knowledge Base'}`}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {kbVersions.length} version{kbVersions.length !== 1 ? 's' : ''} total
            </div>
            <div className="flex justify-end space-x-1.5">
              <button
                onClick={() => {
                  setShowVersionsModal(false);
                  setSelectedKB(null);
                  setKbVersions([]);
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                suppressHydrationWarning
              >
                Close
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-3">
          {isLoadingVersions ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--color-aithen-teal)] mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading versions...</p>
            </div>
          ) : kbVersions.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No versions yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Train this knowledge base to create versions</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {kbVersions.map((version, index) => {
                const isLatest = index === 0;
                const isOnlyVersion = kbVersions.length === 1;
                
                return (
                  <div
                    key={version.id}
                    className={`p-4 border rounded-lg transition-all duration-300 hover:shadow-md animate-in fade-in slide-in-from-left-2 ${
                      isLatest
                        ? 'border-[var(--color-aithen-teal)] bg-gradient-to-br from-[var(--color-aithen-teal)]/5 to-blue-500/5 dark:from-[var(--color-aithen-teal)]/10 dark:to-blue-500/10 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <GitBranch className="w-4 h-4 text-gray-400" />
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {version.version_string}
                          </h4>
                          {isLatest && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-[var(--color-aithen-teal)]/20 text-[var(--color-aithen-teal)] dark:text-[var(--color-aithen-teal-light)] rounded">
                              Current
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(version.status)}`}>
                            <span className="flex items-center space-x-1">
                              {getStatusIcon(version.status)}
                              <span className="capitalize">{version.status}</span>
                            </span>
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 mb-0.5">Started</p>
                            <p className="text-gray-900 dark:text-white font-medium">
                              {new Date(version.training_started_at).toLocaleDateString()}
                            </p>
                          </div>
                          {version.training_completed_at && (
                            <div>
                              <p className="text-gray-500 dark:text-gray-400 mb-0.5">Completed</p>
                              <p className="text-gray-900 dark:text-white font-medium">
                                {new Date(version.training_completed_at).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          {version.status === 'completed' && (
                            <>
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 mb-0.5">Embeddings</p>
                                <p className="text-gray-900 dark:text-white font-medium">
                                  {version.total_embeddings.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 mb-0.5">Quality Score</p>
                                <div className="flex items-center space-x-1">
                                  {version.quality_score !== undefined && version.quality_score !== null ? (
                                    <>
                                      <TrendingUp className={`w-3 h-3 ${
                                        version.quality_score >= 80
                                          ? 'text-green-600 dark:text-green-400'
                                          : version.quality_score >= 60
                                          ? 'text-yellow-600 dark:text-yellow-400'
                                          : 'text-red-600 dark:text-red-400'
                                      }`} />
                                      <p className={`text-gray-900 dark:text-white font-medium ${
                                        version.quality_score >= 80
                                          ? 'text-green-600 dark:text-green-400'
                                          : version.quality_score >= 60
                                          ? 'text-yellow-600 dark:text-yellow-400'
                                          : 'text-red-600 dark:text-red-400'
                                      }`}>
                                        {version.quality_score.toFixed(1)}
                                      </p>
                                    </>
                                  ) : (
                                    <p className="text-gray-400 dark:text-gray-500">N/A</p>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        {version.status === 'completed' && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 mb-0.5">Chunks</p>
                                <p className="text-gray-900 dark:text-white font-medium">
                                  {version.total_chunks.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 mb-0.5">Dimension</p>
                                <p className="text-gray-900 dark:text-white font-medium">
                                  {version.embedding_dimension}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 mb-0.5">Storage</p>
                                <p className="text-gray-900 dark:text-white font-medium">
                                  {version.total_storage_size >= 1024 * 1024 * 1024
                                    ? `${(version.total_storage_size / (1024 * 1024 * 1024)).toFixed(2)} GB`
                                    : `${(version.total_storage_size / (1024 * 1024)).toFixed(2)} MB`}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 mb-0.5">Avg Chunk</p>
                                <p className="text-gray-900 dark:text-white font-medium">
                                  {version.average_chunk_size.toLocaleString()} chars
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-start space-x-1 ml-4">
                        {!isLatest && !isOnlyVersion && (
                          <button
                            onClick={() => handleDeleteVersion(version.id)}
                            disabled={isDeletingVersion === version.id}
                            className="p-1.5 rounded text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                            title="Delete version"
                            suppressHydrationWarning
                          >
                            {isDeletingVersion === version.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
    </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Version Confirmation */}
      <Confirm
        isOpen={showDeleteVersionConfirm}
        onClose={() => {
          setShowDeleteVersionConfirm(false);
          setVersionToDelete(null);
        }}
        onConfirm={confirmDeleteVersion}
        action="delete"
        message={versionToDelete ? `Are you sure you want to delete version "${kbVersions.find(v => v.id === versionToDelete)?.version_string || 'this version'}"?` : ''}
        description="This action cannot be undone. All embeddings associated with this version will also be deleted."
        isLoading={isDeletingVersion === versionToDelete}
      />
      </div>
    </>
  );
}
