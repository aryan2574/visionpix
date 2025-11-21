import { Resolver, Mutation, Query, Args, ID } from '@nestjs/graphql';
import { UploadsService } from './uploads.service';
import { FileInput } from './dto/file.input';
import { Image, InitUploadPayload } from './models/upload.models';

@Resolver()
export class UploadsResolver {
  constructor(private uploadsService: UploadsService) {}

  @Mutation(() => InitUploadPayload)
  async initUpload(
    @Args('files', { type: () => [FileInput] }) files: FileInput[],
  ) {
    return this.uploadsService.initUpload({ files });
  }

  @Mutation(() => Boolean)
  async completeUpload(@Args('uploadId', { type: () => ID }) uploadId: string) {
    return this.uploadsService.completeUpload(uploadId);
  }

  @Query(() => [Image])
  async myImages() {
    return this.uploadsService.getUserImages();
  }
}
