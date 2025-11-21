import { Global, Module } from '@nestjs/common';
import { S3Service } from './aws.service';
import { RekognitionService } from './rekognition.service';

@Global()
@Module({
  providers: [S3Service, RekognitionService],
  exports: [S3Service, RekognitionService],
})
export class AwsModule {}
