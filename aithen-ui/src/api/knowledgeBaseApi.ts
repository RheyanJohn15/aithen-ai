/**
 * Knowledge Base API Endpoints
 * 
 * Provides API functions for knowledge base operations:
 * - getKnowledgeBases: Get all knowledge bases for an organization
 * - getKnowledgeBase: Get a knowledge base by ID
 * - createKnowledgeBase: Create a new knowledge base
 * - updateKnowledgeBase: Update a knowledge base
 * - deleteKnowledgeBase: Delete a knowledge base
 * - getKnowledgeBaseFiles: Get all files for a knowledge base
 * - uploadKnowledgeBaseFiles: Upload files to a knowledge base
 * - deleteKnowledgeBaseFile: Delete a file from a knowledge base
 */

import { get, post, put, del } from './api';
import type { ApiResponse } from './types';

/**
 * Knowledge base information
 */
export interface QualityMetrics {
  total_embeddings: number;
  total_chunks: number;
  embedding_dimension: number;
  total_storage_size: number;
  average_chunk_size: number;
  quality_score?: number;
}

export interface KnowledgeBase {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  status: 'active' | 'training' | 'error';
  created_at: string;
  updated_at: string;
  total_datasets: number;
  current_version: string;
  total_versions: number;
  last_updated: string;
  quality_metrics?: QualityMetrics;
}

/**
 * Knowledge base file information
 */
export interface KnowledgeBaseFile {
  id: string;
  knowledge_base_id: string;
  name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  status: 'ready' | 'processing' | 'error';
  created_at: string;
  updated_at: string;
}

/**
 * Create knowledge base request payload
 */
export interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string;
}

/**
 * Update knowledge base request payload
 */
export interface UpdateKnowledgeBaseRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'training' | 'error';
}

/**
 * Get all knowledge bases for an organization
 * 
 * @param orgSlug - Organization slug
 * @returns Array of knowledge bases
 */
export const getKnowledgeBases = async (
  orgSlug: string
): Promise<ApiResponse<KnowledgeBase[]>> => {
  return get<KnowledgeBase[]>(`/orgs/${orgSlug}/knowledge-bases`);
};

/**
 * Get a knowledge base by ID
 * 
 * @param orgSlug - Organization slug
 * @param id - Knowledge base ID
 * @returns Knowledge base
 */
export const getKnowledgeBase = async (
  orgSlug: string,
  id: string
): Promise<ApiResponse<KnowledgeBase>> => {
  return get<KnowledgeBase>(`/orgs/${orgSlug}/knowledge-bases/${id}`);
};

/**
 * Create a new knowledge base
 * 
 * @param orgSlug - Organization slug
 * @param data - Knowledge base data
 * @returns Created knowledge base
 */
export const createKnowledgeBase = async (
  orgSlug: string,
  data: CreateKnowledgeBaseRequest
): Promise<ApiResponse<KnowledgeBase>> => {
  return post<KnowledgeBase>(`/orgs/${orgSlug}/knowledge-bases`, data);
};

/**
 * Update a knowledge base
 * 
 * @param orgSlug - Organization slug
 * @param id - Knowledge base ID
 * @param data - Update data
 * @returns Updated knowledge base
 */
export const updateKnowledgeBase = async (
  orgSlug: string,
  id: string,
  data: UpdateKnowledgeBaseRequest
): Promise<ApiResponse<KnowledgeBase>> => {
  return put<KnowledgeBase>(`/orgs/${orgSlug}/knowledge-bases/${id}`, data);
};

/**
 * Delete a knowledge base
 * 
 * @param orgSlug - Organization slug
 * @param id - Knowledge base ID
 * @returns Success response
 */
export const deleteKnowledgeBase = async (
  orgSlug: string,
  id: string
): Promise<ApiResponse<void>> => {
  return del<void>(`/orgs/${orgSlug}/knowledge-bases/${id}`);
};

/**
 * Get all files for a knowledge base
 * 
 * @param orgSlug - Organization slug
 * @param id - Knowledge base ID
 * @returns Array of files
 */
export const getKnowledgeBaseFiles = async (
  orgSlug: string,
  id: string
): Promise<ApiResponse<KnowledgeBaseFile[]>> => {
  return get<KnowledgeBaseFile[]>(`/orgs/${orgSlug}/knowledge-bases/${id}/files`);
};

/**
 * Upload files to a knowledge base
 * 
 * @param orgSlug - Organization slug
 * @param id - Knowledge base ID
 * @param files - Array of File objects
 * @returns Upload response with uploaded files
 */
export const uploadKnowledgeBaseFiles = async (
  orgSlug: string,
  id: string,
  files: File[]
): Promise<ApiResponse<{ message: string; files: KnowledgeBaseFile[] }>> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  // Use fetch directly for FormData to avoid JSON stringification
  const { getBaseUrl } = await import('./config');
  const { getAuthHeaders } = await import('./auth');
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/orgs/${orgSlug}/knowledge-bases/${id}/files`;
  const authHeaders = getAuthHeaders('bearer', undefined, undefined);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...authHeaders,
      // Don't set Content-Type, let the browser set it with boundary for FormData
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      message: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      status: response.status,
      statusText: response.statusText,
      data: errorData,
    };
  }

  const data = await response.json();
  return {
    data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  };
};

/**
 * Delete a file from a knowledge base
 * 
 * @param orgSlug - Organization slug
 * @param kbId - Knowledge base ID
 * @param fileId - File ID
 * @returns Success response
 */
export const deleteKnowledgeBaseFile = async (
  orgSlug: string,
  kbId: string,
  fileId: string
): Promise<ApiResponse<void>> => {
  return del<void>(`/orgs/${orgSlug}/knowledge-bases/${kbId}/files/${fileId}`);
};

/**
 * Train a knowledge base (creates a new version)
 * 
 * @param orgSlug - Organization slug
 * @param kbId - Knowledge base ID
 * @returns Training response with version information
 */
export const trainKnowledgeBase = async (
  orgSlug: string,
  kbId: string
): Promise<ApiResponse<{ message: string; version: any; knowledge_base: KnowledgeBase; channel: string }>> => {
  return post<{ message: string; version: any; knowledge_base: KnowledgeBase; channel: string }>(
    `/orgs/${orgSlug}/knowledge-bases/${kbId}/train`
  );
};

/**
 * Knowledge base version information
 */
export interface KnowledgeBaseVersion {
  id: string;
  knowledge_base_id: string;
  version_number: number;
  version_string: string;
  status: 'training' | 'completed' | 'failed';
  training_started_at: string;
  training_completed_at?: string;
  total_embeddings: number;
  total_chunks: number;
  embedding_dimension: number;
  total_storage_size: number;
  average_chunk_size: number;
  quality_score?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get all versions for a knowledge base
 * 
 * @param orgSlug - Organization slug
 * @param kbId - Knowledge base ID
 * @returns List of versions
 */
export const getKnowledgeBaseVersions = async (
  orgSlug: string,
  kbId: string
): Promise<ApiResponse<KnowledgeBaseVersion[]>> => {
  return get<KnowledgeBaseVersion[]>(`/orgs/${orgSlug}/knowledge-bases/${kbId}/versions`);
};

/**
 * Delete a specific version
 * 
 * @param orgSlug - Organization slug
 * @param kbId - Knowledge base ID
 * @param versionId - Version ID
 * @returns Success response
 */
export const deleteKnowledgeBaseVersion = async (
  orgSlug: string,
  kbId: string,
  versionId: string
): Promise<ApiResponse<void>> => {
  return del<void>(`/orgs/${orgSlug}/knowledge-bases/${kbId}/versions/${versionId}`);
};

