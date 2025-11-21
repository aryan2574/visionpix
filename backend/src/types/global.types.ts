import { LabelType } from '@prisma/client';
import { FileInput } from 'src/uploads/dto/file.input';

// S3 ------------------------------------------------------------------------

export interface ImageProcessingJob {
  imageId: string;
  s3Key: string;
  uploadId: string;
}

export interface ImageMetadata {
  width?: number;
  height?: number;
  hash?: string;
}

export interface PresignedUrl {
  key: string;
  url: string;
  expiresIn: number;
}

export interface MakeKeyParams {
  userId: string;
  fileName: string;
}

export interface GeneratePresignedPutUrlParams {
  key: string;
  contentType?: string;
}

export interface GeneratePresignedGetUrlParams {
  key: string;
  expires?: number;
}

export interface GetImageMetadataParams {
  key: string;
}

export interface FetchObjectBufferParams {
  key: string;
}

// Rekognition ---------------------------------------------------------------

export interface DetectedLabel {
  name: string;
  type: LabelType;
  confidence: number;
}

export interface DetectLabelsParams {
  s3Key: string;
}

// Queue ---------------------------------------------------------------------

export interface UpdateUploadProgressParams {
  uploadId: string;
}

// Uploads -------------------------------------------------------------------

export interface InitUploadParams {
  files: FileInput[];
}

export interface ImageAndSignedUrl {
  imageId: string;
  fileName: string;
  key: string;
  url: string;
  expiresAt: string;
}

export interface CreateImagesAndSignedUrlsParams {
  userId: string;
  uploadId: string;
  files: FileInput[];
}

export interface CreateUploadRecordParams {
  userId: string;
  totalFiles: number;
}

export interface ImageRecord {
  id: string;
  objectKey: string;
}

export interface CollectImageMetadataParams {
  imageRecord: ImageRecord;
}

export interface EnsureUniqueHashParams {
  imageRecord: ImageRecord;
  contentHash: string | null;
}

export interface BuildProcessingJobsParams {
  images: ImageRecord[];
  userId: string;
  uploadId: string;
}
