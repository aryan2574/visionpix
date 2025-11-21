import { useCallback, useRef } from "react";
import { useMutation } from "@apollo/client/react";
import type {
  SignedUrlPayload,
  UploadFileInput,
  FileWithMeta,
} from "../../../models/types";
import { FILE_STATUS } from "../../../constants/constants";
import { INIT_UPLOAD } from "../graphql/mutations";
import {
  buildUploadPayload,
  ensureFilesAreValid,
  uploadWithProgress,
} from "../services/uploaderService";

interface UseUploadSessionProps {
  files: FileWithMeta[];
  onFileUpdate: (fileId: string, updates: Partial<FileWithMeta>) => void;
  onError: (value: string | null) => void;
}

interface UploadSessionResult {
  uploadId: string | null;
}

const EMPTY_RESULT: UploadSessionResult = { uploadId: null };

export function useUploadSession({
  files,
  onFileUpdate,
  onError,
}: UseUploadSessionProps) {
  const uploadIdRef = useRef<string | null>(null);
  const [initUploadMutation, { loading: initLoading }] = useMutation<
    { initUpload: { uploadId: string; urls: SignedUrlPayload[] } },
    { files: UploadFileInput[] }
  >(INIT_UPLOAD);

  // Uploads the files to S3
  const startUpload = useCallback(async (): Promise<UploadSessionResult> => {
    uploadIdRef.current = null;

    const validationError = ensureFilesAreValid(files);
    if (validationError) {
      onError(validationError);
      return EMPTY_RESULT;
    }

    if (files.length === 0) {
      onError("Select at least one image.");
      return EMPTY_RESULT;
    }

    onError(null);

    try {
      const payload: UploadFileInput[] = buildUploadPayload(files);
      const { data } = await initUploadMutation({
        variables: { files: payload },
      });

      if (!data) {
        throw new Error("Failed to initialize upload");
      }

      uploadIdRef.current = data.initUpload.uploadId;
      const signedUrls = data.initUpload.urls;

      for (let index = 0; index < files.length; index += 1) {
        const fileItem = files[index];
        const remote = signedUrls[index];

        if (!remote) {
          onFileUpdate(fileItem.id, { status: FILE_STATUS.FAILED });
          continue;
        }

        onFileUpdate(fileItem.id, {
          status: FILE_STATUS.UPLOADING,
          signedUrl: remote.url,
          key: remote.key,
          imageId: remote.imageId,
        });

        const success: boolean = await uploadWithProgress(
          fileItem.file,
          remote.url,
          (percent: number) =>
            onFileUpdate(fileItem.id, { uploadPercent: percent })
        );

        onFileUpdate(fileItem.id, {
          uploadPercent: 100,
          status: success ? FILE_STATUS.UPLOADED : FILE_STATUS.FAILED,
        });
      }

      return {
        uploadId: uploadIdRef.current,
      };
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "Failed to initialize upload"
      );
      return EMPTY_RESULT;
    }
  }, [files, initUploadMutation, onError, onFileUpdate]);

  return {
    startUpload,
    initLoading,
  };
}
