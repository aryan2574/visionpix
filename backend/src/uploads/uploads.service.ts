import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ImageStatus, UploadStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../aws/aws.service';
import { QueueService } from '../queue/queue.service';
import { UserService } from '../users/users.service';
import {
  assertFilesPresent,
  assertWithinUploadLimits,
} from './utils/upload-validation.util';
import {
  CreateImagesAndSignedUrlsParams,
  CreateUploadRecordParams,
  ImageAndSignedUrl,
  CollectImageMetadataParams,
  ImageMetadata,
  EnsureUniqueHashParams,
  BuildProcessingJobsParams,
  InitUploadParams,
} from 'src/types/global.types';
import { InitUploadPayload } from './models/upload.models';

@Injectable()
export class UploadsService {
  constructor(
    private prisma: PrismaService,
    private s3: S3Service,
    private queueService: QueueService,
    private usersService: UserService,
  ) {}

  private async resolveUserId(userId?: string): Promise<string> {
    if (userId) return userId;
    return this.usersService.getDefaultUserId();
  }

  // Creates an upload entry plus one Image row per file, returning the presigned PUT URLs.
  async initUpload({ files }: InitUploadParams): Promise<InitUploadPayload> {
    assertFilesPresent(files);
    assertWithinUploadLimits(files);

    const userId = await this.resolveUserId();
    const uploadRecord = await this.createUploadRecord({
      userId,
      totalFiles: files.length,
    });
    const urls: ImageAndSignedUrl[] = await this.createImagesAndSignedUrls({
      userId,
      uploadId: uploadRecord.id,
      files,
    });

    return { uploadId: uploadRecord.id, urls };
  }

  // Marks an upload as ready for processing, enriches metadata, and enqueues Rekognition jobs.
  async completeUpload(uploadId: string): Promise<boolean> {
    const userId = await this.resolveUserId();
    const uploadRecord = await this.prisma.upload.findUnique({
      where: { id: uploadId },
      include: { images: true },
    });

    if (!uploadRecord || uploadRecord.userId !== userId) {
      throw new NotFoundException('Upload not found');
    }

    for (const imageRecord of uploadRecord.images) {
      const metadata = await this.collectImageMetadata({
        imageRecord,
      });

      await this.ensureUniqueHash({
        imageRecord,
        contentHash: metadata.hash ?? null,
      });

      await this.prisma.image.update({
        where: { id: imageRecord.id },
        data: {
          status: ImageStatus.PROCESSING,
          progress: 0,
          width: metadata.width,
          height: metadata.height,
          contentHash: metadata.hash,
        },
      });
    }

    await this.prisma.upload.update({
      where: { id: uploadId },
      data: { status: UploadStatus.PROCESSING },
    });

    await this.queueService.addBulkImageProcessingJobs(
      this.buildProcessingJobs({
        images: uploadRecord.images,
        userId,
        uploadId: uploadRecord.id,
      }),
    );

    return true;
  }

  // Get all images for a user with preview URLs
  async getUserImages() {
    const userId = await this.resolveUserId();
    const imageRecords = await this.prisma.image.findMany({
      where: {
        userId,
        NOT: {
          AND: [{ status: ImageStatus.UPLOADING }, { progress: 0 }],
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        upload: {
          select: {
            id: true,
            status: true,
            totalFiles: true,
            processedFiles: true,
            progressOverall: true,
            createdAt: true,
          },
        },
        labels: {
          select: {
            id: true,
            type: true,
            name: true,
            confidence: true,
          },
        },
      },
    });

    return await Promise.all(
      imageRecords.map(async (imageRecord) => {
        if (!imageRecord.objectKey)
          throw new NotFoundException('Image not found');

        const { url: previewUrl } = await this.s3.generatePresignedGetUrl({
          key: imageRecord.objectKey,
          expires: 3600,
        });

        if (!previewUrl)
          throw new NotFoundException('Failed to generate preview URL');

        return { ...imageRecord, previewUrl };
      }),
    );
  }

  // helper to create an upload record
  private async createUploadRecord({
    userId,
    totalFiles,
  }: CreateUploadRecordParams) {
    return this.prisma.upload.create({
      data: {
        userId,
        totalFiles,
        status: UploadStatus.UPLOADING,
      },
    });
  }

  // helper to create images and signed URLs
  private async createImagesAndSignedUrls({
    userId,
    uploadId,
    files,
  }: CreateImagesAndSignedUrlsParams) {
    const urls: ImageAndSignedUrl[] = [];

    for (const fileInput of files) {
      const objectKey = this.s3.makeKey({
        userId,
        fileName: fileInput.fileName,
      });

      const imageRecord = await this.prisma.image.create({
        data: {
          userId,
          uploadId,
          objectKey,
          fileName: fileInput.fileName,
          sizeBytes: fileInput.sizeBytes,
          status: ImageStatus.UPLOADING,
          progress: 0,
        },
      });

      const { url, expiresIn } = await this.s3.generatePresignedPutUrl({
        key: objectKey,
        contentType: fileInput.mime,
      });

      if (!url)
        throw new NotFoundException('Failed to generate presigned PUT URL');

      urls.push({
        imageId: imageRecord.id,
        fileName: fileInput.fileName,
        key: objectKey,
        url,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      });
    }

    return urls;
  }

  // helper to collect image metadata
  private async collectImageMetadata({
    imageRecord,
  }: CollectImageMetadataParams) {
    const metadata: ImageMetadata | null = await this.s3.getImageMetadata({
      key: imageRecord.objectKey,
    });

    if (!metadata)
      throw new NotFoundException('Failed to collect image metadata');

    return metadata;
  }

  // helper to ensure a unique hash
  private async ensureUniqueHash({
    imageRecord,
    contentHash,
  }: EnsureUniqueHashParams) {
    if (!contentHash) return;

    const existingImage = await this.prisma.image.findUnique({
      where: { contentHash },
    });

    if (existingImage && existingImage.id !== imageRecord.id) {
      await this.prisma.image.delete({ where: { id: imageRecord.id } });

      throw new ConflictException(
        `Image already exists. Duplicate of: ${existingImage.fileName}`,
      );
    }
  }

  // helper to build processing jobs
  private buildProcessingJobs({
    images,
    userId,
    uploadId,
  }: BuildProcessingJobsParams) {
    return images.map((imageRecord) => ({
      imageId: imageRecord.id,
      s3Key: imageRecord.objectKey,
      userId,
      uploadId,
    }));
  }
}
