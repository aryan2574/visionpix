import { Module } from '@nestjs/common';
import { UploadsResolver } from './uploads.resolver';
import { UploadsService } from './uploads.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AwsModule } from '../aws/aws.module';
import { QueueModule } from '../queue/queue.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, AwsModule, QueueModule, UsersModule],
  providers: [UploadsResolver, UploadsService],
})
export class UploadsModule {}
