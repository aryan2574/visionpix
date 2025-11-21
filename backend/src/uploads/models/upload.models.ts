import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { ImageStatus, LabelType, UploadStatus } from '@prisma/client';

@ObjectType()
export class SignedUrlPayload {
  @Field(() => ID)
  imageId: string;

  @Field()
  fileName: string;

  @Field()
  key: string;

  @Field()
  url: string;

  @Field()
  expiresAt: string;
}

@ObjectType()
export class InitUploadPayload {
  @Field(() => ID)
  uploadId: string;

  @Field(() => [SignedUrlPayload])
  urls: SignedUrlPayload[];
}

@ObjectType()
export class Label {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  type: LabelType;

  @Field()
  name: string;

  @Field(() => Float, { nullable: true })
  confidence?: number;
}

@ObjectType()
export class UploadInfo {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  status: UploadStatus;

  @Field(() => Int)
  totalFiles: number;

  @Field(() => Int)
  processedFiles: number;

  @Field(() => Int)
  progressOverall: number;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class Image {
  @Field(() => ID)
  id: string;

  @Field()
  fileName: string;

  @Field(() => String)
  status: ImageStatus;

  @Field(() => Int)
  progress: number;

  @Field(() => Int, { nullable: true })
  sizeBytes?: number;

  @Field(() => Int, { nullable: true })
  width?: number;

  @Field(() => Int, { nullable: true })
  height?: number;

  @Field()
  previewUrl: string;

  @Field(() => UploadInfo)
  upload: UploadInfo;

  @Field(() => [Label])
  labels: Label[];

  @Field()
  createdAt: Date;
}
