import { FILE_STATUS, UPLOAD_STATUS } from "../constants/constants";

type UploadStatusValue = (typeof UPLOAD_STATUS)[keyof typeof UPLOAD_STATUS];
type FileStatusValue = (typeof FILE_STATUS)[keyof typeof FILE_STATUS];

export interface UserResponse {
  name: string;
  email: string;
  message?: string;
}

// Upload mutations -----------------------------------------------------------

export interface UploadFileInput {
  fileName: string;
  mime: string;
  sizeBytes: number;
}

export interface SignedUrlPayload {
  imageId: string;
  fileName: string;
  key: string;
  url: string;
  expiresAt: string;
}

export interface InitUploadResponse {
  initUpload: {
    uploadId: string;
    urls: SignedUrlPayload[];
  };
}

export interface InitUploadVariables {
  files: UploadFileInput[];
}

export interface CompleteUploadResponse {
  completeUpload: boolean;
}

export interface CompleteUploadVariables {
  uploadId: string;
}

// Image / upload records -----------------------------------------------------

export interface Label {
  id: string;
  imageId: string;
  type: string;
  name: string;
  confidence?: number;
  createdAt: string;
}

export interface UploadInfo {
  id: string;
  status: UploadStatusValue;
  totalFiles: number;
  processedFiles: number;
  progressOverall: number;
  createdAt: string;
}

export interface ImageRecord {
  id: string;
  fileName: string;
  status: UploadStatusValue;
  progress: number;
  sizeBytes?: number;
  width?: number;
  height?: number;
  previewUrl: string;
  upload: UploadInfo;
  labels?: Label[];
  createdAt: string;
}

// Local-only helpers ---------------------------------------------------------

export interface FileWithMeta {
  id: string;
  file: File;
  uploadPercent: number;
  status: FileStatusValue;
  localPreview?: string;
  width?: number;
  height?: number;
  imageId?: string;
  signedUrl?: string;
  key?: string;
}
