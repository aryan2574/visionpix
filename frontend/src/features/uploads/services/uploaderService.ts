import type { FileWithMeta, UploadFileInput } from "../../../models/types";
import { MAX_SIZE } from "../../../constants/constants";

// Verifies declared files are images and respect size/count limits.
export function ensureFilesAreValid(files: FileWithMeta[]): string | null {
  if (files.length === 0) return "Select at least one image";

  const maxSize = MAX_SIZE;
  const invalidFile = files.find((file) => file.file.size > maxSize);

  if (invalidFile) {
    const limitMb = Math.round(maxSize / (1024 * 1024));
    return `File ${invalidFile.file.name} exceeds ${limitMb}MB limit.`;
  }

  return null;
}

// Builds the upload payload for the files.
export function buildUploadPayload(files: FileWithMeta[]): UploadFileInput[] {
  return files.map((file) => ({
    fileName: file.file.name,
    mime: file.file.type || "application/octet-stream",
    sizeBytes: file.file.size,
  }));
}

// Uploads the file with progress.
export async function uploadWithProgress(
  file: File,
  signedUrl: string,
  onProgress?: (percent: number) => void
): Promise<boolean> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event: ProgressEvent) => {
      if (!event.lengthComputable) return;

      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress?.(percent);
    };

    xhr.onload = () => {
      resolve(xhr.status >= 200 && xhr.status < 300);
    };

    xhr.onerror = () => {
      resolve(false);
    };

    xhr.open("PUT", signedUrl, true);
    xhr.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream"
    );
    xhr.send(file);
  });
}
