import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type {
  ImageMetadata,
  MakeKeyParams,
  GeneratePresignedPutUrlParams,
  GeneratePresignedGetUrlParams,
  GetImageMetadataParams,
  FetchObjectBufferParams,
  PresignedUrl,
} from '../types/global.types';
import { randomUUID, createHash } from 'crypto';
import sharp from 'sharp';

@Injectable()
export class S3Service {
  private readonly expires: number;
  private readonly bucket: string;
  private readonly s3Client: S3Client;

  constructor() {
    this.expires = Number(process.env.S3_URL_EXPIRATION_SECONDS);
    this.bucket = process.env.S3_BUCKET!;
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  // Generate a unique S3 key for the uploaded file
  makeKey({ userId, fileName }: MakeKeyParams) {
    return `${userId}/${randomUUID()}_${fileName}`;
  }

  // Create a presigned PUT URL so the frontend can upload directly to S3
  async generatePresignedPutUrl({
    key,
    contentType = 'application/octet-stream',
  }: GeneratePresignedPutUrlParams): Promise<PresignedUrl> {
    if (!key) {
      throw new Error('Key is required');
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: this.expires,
    });
    return { key, url: signedUrl, expiresIn: this.expires };
  }

  // Create a presigned GET URL so the UI can preview a stored image
  async generatePresignedGetUrl({
    key,
    expires = this.expires,
  }: GeneratePresignedGetUrlParams) {
    if (!key) {
      throw new Error('Key is required');
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    const signedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: expires,
    });
    return { url: signedUrl, expiresIn: expires };
  }

  // Get the metadata of the image
  async getImageMetadata({
    key,
  }: GetImageMetadataParams): Promise<ImageMetadata | null> {
    if (!key) {
      throw new Error('Key is required');
    }

    try {
      const buffer = await this.fetchObjectBuffer({ key });
      if (!buffer) return null;

      const { width, height } = await sharp(buffer).metadata();
      const hash = createHash('sha256').update(buffer).digest('hex');
      return {
        width: width ?? null,
        height: height ?? null,
        hash,
      };
    } catch (error) {
      throw new Error(`Failed to extract metadata for ${key}: ${error}`);
    }
  }

  // Fetch the buffer of the image from S3
  public async fetchObjectBuffer({
    key,
  }: FetchObjectBufferParams): Promise<Buffer | null> {
    if (!key) {
      throw new Error('Key is required');
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    if (!response.Body) {
      return null;
    }

    const chunks: Uint8Array[] = [];
    const body = response.Body as AsyncIterable<Uint8Array>;
    for await (const chunk of body) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
}
