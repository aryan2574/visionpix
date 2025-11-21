import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JOB_NAME, QUEUE_NAME } from '../constants/constants';
import type { ImageProcessingJob } from '../types/global.types';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(QUEUE_NAME)
    private readonly imageProcessingQueue: Queue<ImageProcessingJob>,
  ) {}

  // Add a single image processing job
  async addImageProcessingJob(job: ImageProcessingJob): Promise<void> {
    await this.imageProcessingQueue.add(JOB_NAME, job, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: true,
    });
  }

  // Add multiple image processing jobs
  async addBulkImageProcessingJobs(jobs: ImageProcessingJob[]): Promise<void> {
    const queueJobs = jobs.map((job) => ({
      name: JOB_NAME,
      data: job,
      opts: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: true,
      },
    }));

    await this.imageProcessingQueue.addBulk(queueJobs);
  }
}
