export type ToolCategory =
  | "organize"
  | "convert-to"
  | "convert-from"
  | "edit"
  | "ai";

export interface ToolDefinition {
  id: string;
  name: string;
  shortDescription: string;
  category: ToolCategory;
  categoryLabel: string;
  icon: string;
  badge?: string;
  popular?: boolean;
  acceptedFileTypes: string[]; // e.g. ['.pdf', '.docx', etc.]
  acceptedMimeTypes?: string[];
  maxFiles?: number;
  tags: string[];
}

export interface UploadedFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  pageCount?: number;
  previewUrl?: string;
  status: "idle" | "uploading" | "ready" | "processing" | "success" | "error";
  progress?: number;
  error?: string;
}

export interface ProcessingState {
  status: "idle" | "uploading" | "processing" | "success" | "error";
  progress: number;
  message: string;
  errorDetails?: string;
  resultUrl?: string;
  resultBlob?: Blob;
  resultFileName?: string;
  resultMeta?: Record<string, any>;
}

export interface UserProfile {
  id: string;
  uid?: string;
  email: string;
  displayName: string;
  plan: "free" | "pro" | "business";
  operationsToday?: number;
  operationsLimit?: number;
  dailyOperationsUsed: number;
  dailyOperationsLimit: number;
  savedFilesCount: number;
  createdAt?: string;
}

export interface OperationHistoryItem {
  id: string;
  toolId: string;
  toolName: string;
  fileName: string;
  outputName: string;
  fileSize: number;
  outputSize?: number;
  timestamp: number;
  status: "completed" | "failed";
}

export interface AppNotification {
  id: string;
  type: "success" | "info" | "warning" | "error";
  message: string;
}
