'use client';

import { useCallback, useState, useRef } from 'react';
import { Upload, File, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export interface UploadedFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
}

export interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  acceptedFileTypes?: string[];
  maxFiles?: number;
  maxFileSize?: number; // in MB
  multiple?: boolean;
  className?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const iconClass = 'w-5 h-5';
  
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

export default function FileUpload({
  onFilesSelected,
  acceptedFileTypes = ['.pdf', '.doc', '.docx', '.txt', '.md', '.json', '.csv'],
  maxFiles = 50,
  maxFileSize = 100, // 100MB default
  multiple = true,
  className = '',
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (files: File[]): string | null => {
    if (files.length === 0) return 'No files selected';
    if (files.length > maxFiles) return `Maximum ${maxFiles} files allowed`;
    
    for (const file of files) {
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxFileSize) {
        return `File "${file.name}" exceeds ${maxFileSize}MB limit`;
      }
      
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedFileTypes.includes(fileExt)) {
        return `File "${file.name}" has unsupported format. Accepted: ${acceptedFileTypes.join(', ')}`;
      }
    }
    
    return null;
  };

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setError(null);
    const fileArray = Array.from(files);
    const validationError = validateFiles(fileArray);
    
    if (validationError) {
      setError(validationError);
      return;
    }
    
    onFilesSelected(fileArray);
  }, [onFilesSelected, maxFiles, maxFileSize, acceptedFileTypes]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-lg p-4
          transition-all duration-200 cursor-pointer
          ${
            isDragging
              ? 'border-[var(--color-aithen-teal)] bg-[var(--color-aithen-teal)]/5 dark:bg-[var(--color-aithen-teal)]/10'
              : 'border-gray-300 dark:border-gray-600 hover:border-[var(--color-aithen-teal)]/50 dark:hover:border-[var(--color-aithen-teal)]/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedFileTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />
        
        <div className="flex flex-col items-center justify-center text-center">
          <div className={`
            p-2 rounded-full mb-2 transition-colors
            ${isDragging 
              ? 'bg-[var(--color-aithen-teal)]/10 dark:bg-[var(--color-aithen-teal)]/20' 
              : 'bg-gray-100 dark:bg-gray-700'
            }
          `}>
            <Upload className={`
              w-5 h-5 transition-colors
              ${isDragging 
                ? 'text-[var(--color-aithen-teal)] dark:text-[var(--color-aithen-teal-light)]' 
                : 'text-gray-400 dark:text-gray-500'
              }
            `} />
          </div>
          
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">
            {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {acceptedFileTypes.join(', ').toUpperCase()} (max {maxFileSize}MB per file)
            {multiple && ` • Up to ${maxFiles} files`}
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-2 flex items-start space-x-1.5 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
}

