import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { RekognitionService } from '../aws/rekognition.service';
import { ImageStatus, UploadStatus } from '@prisma/client';
import type {
  ImageProcessingJob,
  DetectedLabel,
  UpdateUploadProgressParams,
} from '../types/global.types';
import { QUEUE_NAME } from '../constants/constants';

@Processor(QUEUE_NAME)
@Injectable()
export class ImageProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rekognition: RekognitionService,
  ) {
    super();
  }

  // BullMQ worker entry point. Marks the image as processing, runs Rekognition,
  // stores labels, and updates the parent upload progress.
  async process(job: Job<ImageProcessingJob>) {
    const { imageId, s3Key, uploadId } = job.data;

    if (!imageId || !s3Key || !uploadId) {
      throw new BadRequestException('Invalid job data');
    }

    try {
      // Update image status to PROCESSING
      await this.prisma.image.update({
        where: { id: imageId },
        data: {
          status: ImageStatus.PROCESSING,
          progress: 10,
        },
      });

      // Detect labels using Rekognition
      const labels: DetectedLabel[] = await this.rekognition.detectLabels({
        s3Key,
      });

      // Update progress
      await this.prisma.image.update({
        where: { id: imageId },
        data: { progress: 80 },
      });

      // Save labels to database
      if (labels.length > 0) {
        await this.prisma.label.createMany({
          data: labels.map((label) => ({
            imageId,
            type: label.type,
            name: label.name,
            confidence: label.confidence,
          })),
        });
      }

      // Update image status to DONE
      await this.prisma.image.update({
        where: { id: imageId },
        data: {
          status: ImageStatus.DONE,
          progress: 100,
        },
      });

      // Update upload progress
      await this.updateUploadProgress({ uploadId });

      return { success: true, labelsCount: labels.length };
    } catch (error) {
      // Mark image as FAILED
      await this.prisma.image.update({
        where: { id: imageId },
        data: {
          status: ImageStatus.FAILED,
          progress: 0,
        },
      });

      // Update upload progress
      await this.updateUploadProgress({ uploadId });

      throw new Error(`Failed to process image ${imageId}: ${error}`);
    }
  }

  // Computes the total progress and status of the upload.
  private async updateUploadProgress({
    uploadId,
  }: UpdateUploadProgressParams): Promise<void> {
    // Get upload and images
    const upload = await this.prisma.upload.findUnique({
      where: { id: uploadId },
      include: {
        images: {
          select: {
            id: true,
            status: true,
            progress: true,
          },
        },
      },
    });

    if (!upload) {
      throw new NotFoundException(`Upload not found for ID: ${uploadId}`);
    }

    const totalImages: number = upload.images.length;

    const summary: {
      done: number;
      failed: number;
      processing: number;
      totalProgress: number;
    } = { done: 0, failed: 0, processing: 0, totalProgress: 0 };

    for (const image of upload.images) {
      if (image.status === ImageStatus.DONE) summary.done += 1;
      if (image.status === ImageStatus.FAILED) summary.failed += 1;
      if (image.status === ImageStatus.PROCESSING) summary.processing += 1;
      summary.totalProgress += image.progress;
    }

    const progressOverall = Math.round(summary.totalProgress / totalImages);

    // Determine upload status
    let status: UploadStatus;
    if (summary.done + summary.failed === totalImages) {
      status = summary.done > 0 ? UploadStatus.DONE : UploadStatus.FAILED;
    } else if (summary.processing > 0 || summary.done > 0) {
      status = UploadStatus.PROCESSING;
    } else {
      status = upload.status;
    }

    await this.prisma.upload.update({
      where: { id: uploadId },
      data: {
        status,
        processedFiles: summary.done + summary.failed,
        progressOverall,
      },
    });
  }
}
