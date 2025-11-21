import { Injectable } from '@nestjs/common';
import {
  RekognitionClient,
  DetectLabelsCommand,
  DetectLabelsCommandInput,
  Label,
} from '@aws-sdk/client-rekognition';
import { LabelType } from '@prisma/client';
import { MAX_LABELS, MIN_CONFIDENCE } from '../constants/constants';
import type { DetectedLabel, DetectLabelsParams } from '../types/global.types';
import { S3Service } from './aws.service';

@Injectable()
export class RekognitionService {
  private readonly rekognitionClient: RekognitionClient;

  private static readonly sceneKeywords = [
    'indoor',
    'outdoor',
    'landscape',
    'city',
    'nature',
    'urban',
    'rural',
    'selfie',
    'portrait',
    'beach',
    'mountain',
    'forest',
    'desert',
    'sky',
    'water',
    'building',
    'architecture',
  ];

  constructor(private readonly s3Service: S3Service) {
    this.rekognitionClient = new RekognitionClient({
      region: process.env.AWS_REKOGNITION_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  // Detect labels in the image using Rekognition
  async detectLabels({ s3Key }: DetectLabelsParams): Promise<DetectedLabel[]> {
    if (!s3Key) {
      throw new Error('S3 key is required');
    }

    try {
      const imageBytes = await this.s3Service.fetchObjectBuffer({ key: s3Key });

      if (!imageBytes) {
        throw new Error('Failed to download image from S3');
      }

      const input: DetectLabelsCommandInput = {
        Image: { Bytes: imageBytes },
        MinConfidence: MIN_CONFIDENCE,
        MaxLabels: MAX_LABELS,
      };

      const command = new DetectLabelsCommand(input);
      const response = await this.rekognitionClient.send(command);
      if (!response.Labels) return [];
      return response.Labels.map((label) => this.formatLabel(label));
    } catch (error) {
      throw new Error(`Failed to detect labels: ${error}`);
    }
  }

  // Format the label of the image
  private formatLabel(label: Label): DetectedLabel {
    const name = label.Name || '';
    const confidence = label.Confidence || 0;

    const isScene = RekognitionService.sceneKeywords.some((keyword) =>
      name.toLowerCase().includes(keyword),
    );

    return {
      name,
      type: isScene ? LabelType.SCENE : LabelType.OBJECT,
      confidence: Math.round(confidence * 100) / 100,
    };
  }
}
