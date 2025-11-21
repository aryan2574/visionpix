import { BadRequestException } from '@nestjs/common';
import { FileInput } from '../dto/file.input';

const MAX_FILES: number = Number(process.env.MAX_FILES);
const MAX_SIZE: number = Number(process.env.MAX_FILE_SIZE_BYTES);

// Ensures the GraphQL mutation received at least one file.
export function assertFilesPresent(
  files: FileInput[] | undefined | null,
): asserts files is FileInput[] {
  if (!files || files.length === 0) {
    throw new BadRequestException('No files provided');
  }
}

// Verifies declared files are images and respect size/count limits.
export function assertWithinUploadLimits(files: FileInput[]): void {
  if (files.length > MAX_FILES) {
    throw new BadRequestException(`Max ${MAX_FILES} files allowed`);
  }

  for (const fileInput of files) {
    if (!fileInput.mime?.startsWith('image/')) {
      throw new BadRequestException(`Invalid mime for ${fileInput.fileName}`);
    }
    if (fileInput.sizeBytes > MAX_SIZE) {
      throw new BadRequestException(`${fileInput.fileName} exceeds max size`);
    }
  }
}
