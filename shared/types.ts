export interface DocumentChunk {
  id: string;
  title: string;
  content: string;
  order: number;
  script?: ScriptData;
  videoUrl?: string;
  status: ChunkStatus;
}

export interface ScriptData {
  title: string;
  script_chunks: string[];
  camera_direction: string;
  environment: string;
}

export type ChunkStatus = 'pending' | 'scripting' | 'script_ready' | 'generating_video' | 'video_ready' | 'error';

export interface VideoGenerationRequest {
  script: string;
  camera_direction: string;
  environment: string;
  duration?: number;
}

export interface VideoGenerationResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  progress?: number;
  error?: string;
  falRequestId?: string;
}

export interface ProcessingSession {
  id: string;
  fileName: string;
  chunks: DocumentChunk[];
  createdAt: Date;
  status: 'uploading' | 'chunking' | 'scripting' | 'generating' | 'completed' | 'error';
}

export interface UploadRequest {
  file?: File;
  text?: string;
  fileName: string;
}

export interface ChunkingResponse {
  sessionId: string;
  chunks: DocumentChunk[];
}

export interface ScriptGenerationRequest {
  chunkId: string;
  content: string;
}

export interface ExportRequest {
  sessionId: string;
  includeIntro?: boolean;
  includeOutro?: boolean;
  backgroundMusic?: string;
}

export interface ExportResponse {
  exportId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  progress?: number;
}