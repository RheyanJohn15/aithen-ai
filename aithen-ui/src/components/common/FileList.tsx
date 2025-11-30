'use client';

import { UploadedFile } from './FileUpload';
import { File, X, CheckCircle, AlertCircle, Loader2, Trash2 } from 'lucide-react';

export interface FileListProps {
  files: UploadedFile[];
  onRemove?: (fileId: string) => void;
  showProgress?: boolean;
  className?: string;
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const iconClass = 'w-4 h-4';
  
  switch (ext) {
    case 'pdf':
      return <File className={`${iconClass} text-red-500`} />;
    case 'doc':
    case 'docx':
      return <File className={`${iconClass} text-blue-500`} />;
    case 'xls':
    case 'xlsx':
      return <File className={`${iconClass} text-green-500`} />;
    case 'txt':
    case 'md':
      return <File className={`${iconClass} text-gray-500`} />;
    case 'json':
    case 'csv':
      return <File className={`${iconClass} text-purple-500`} />;
    default:
      return <File className={`${iconClass} text-gray-400`} />;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export default function FileList({
  files,
  onRemove,
  showProgress = true,
  className = '',
}: FileListProps) {
  if (files.length === 0) return null;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {files.length} file{files.length !== 1 ? 's' : ''} selected
        </p>
      </div>
      
      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {files.map((file) => (
          <div
            key={file.id}
            className="
              flex items-center space-x-2 p-2
              bg-gray-50 dark:bg-gray-800/50
              border border-gray-200 dark:border-gray-700
              rounded-lg
              hover:bg-gray-100 dark:hover:bg-gray-800
              transition-colors
            "
          >
            {/* File Icon */}
            <div className="flex-shrink-0">
              {getFileIcon(file.file.name)}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {file.file.name}
              </p>
              <div className="flex items-center space-x-2 mt-0.5">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(file.file.size)}
                </p>
                {file.status === 'uploading' && showProgress && file.progress !== undefined && (
                  <div className="flex-1 max-w-xs">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                      <div
                        className="bg-[var(--color-aithen-teal)] h-1 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status Icon */}
            <div className="flex-shrink-0 flex items-center space-x-1.5">
              {file.status === 'uploading' && (
                <Loader2 className="w-3.5 h-3.5 text-[var(--color-aithen-teal)] animate-spin" />
              )}
              {file.status === 'success' && (
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              )}
              {file.status === 'error' && (
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              )}
              
              {onRemove && file.status !== 'uploading' && (
                <button
                  onClick={() => onRemove(file.id)}
                  className="
                    p-0.5 rounded
                    text-gray-400 hover:text-red-500 dark:hover:text-red-400
                    hover:bg-red-50 dark:hover:bg-red-900/20
                    transition-colors
                  "
                  aria-label={`Remove ${file.file.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

