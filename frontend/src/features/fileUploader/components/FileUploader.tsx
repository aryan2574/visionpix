import { useRef } from "react";
import { useMutation } from "@apollo/client/react";
import { COMPLETE_UPLOAD } from "../../uploads/graphql/mutations";
import { useSelectedFiles } from "../../uploads/hooks/useSelectedFiles";
import { useUploadSession } from "../../uploads/hooks/useUploadSession";
import { useProcessingPoll } from "../../uploads/hooks/useProcessingPoll";
import { MAX_FILES, MAX_SIZE } from "../../../constants/constants";
import type {
  CompleteUploadResponse,
  CompleteUploadVariables,
  FileWithMeta,
  ImageRecord,
} from "../../../models/types";
import { formatToTitleCase } from "../../../utils/format";

interface FileUploaderProps {
  images: ImageRecord[];
  refetchImages: () => void;
}

function FileUploader({ images, refetchImages }: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxFileSizeMb = Math.round(MAX_SIZE / (1024 * 1024));

  const [completeUpload, { loading: completeLoading }] = useMutation<
    CompleteUploadResponse,
    CompleteUploadVariables
  >(COMPLETE_UPLOAD);

  const {
    files,
    error,
    setError,
    handleSelection,
    reset,
    updateFile,
    hasActiveUpload,
  } = useSelectedFiles();

  const { startUpload, initLoading } = useUploadSession({
    files,
    onFileUpdate: updateFile,
    onError: setError,
  });

  // Fetches the images from the database while any image is still processing.
  useProcessingPoll({ images, refetch: refetchImages });

  const handleReset = () => {
    reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleStartUpload = async () => {
    const { uploadId } = await startUpload();

    if (!uploadId) return;

    try {
      await completeUpload({
        variables: { uploadId },
      });

      await refetchImages();
      handleReset();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to complete upload."
      );
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Upload Images</h2>
      <div className="flex flex-col items-center space-y-2">
        <label className="w-full">
          <input
            type="file"
            accept="image/*"
            multiple
            ref={fileInputRef}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              handleSelection(event.target.files)
            }
            className="w-full cursor-pointer rounded border border-dashed border-gray-400 p-4 text-center"
          />
        </label>
        <p className="text-sm text-gray-500">
          Upload up to {MAX_FILES} images (max {maxFileSizeMb} MB each).
        </p>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Selected Files ({files.length})</h3>
            <button
              onClick={handleReset}
              disabled={hasActiveUpload}
              className="rounded bg-gray-500 px-3 py-1 text-sm text-white transition hover:bg-gray-600 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Reset
            </button>
          </div>
          <div className="grid gap-3">
            {files.map((file: FileWithMeta) => (
              <div key={file.id} className="rounded border p-3">
                <div className="flex items-center space-x-3">
                  {file.localPreview ? (
                    <img
                      src={file.localPreview}
                      className="h-16 w-16 rounded object-cover"
                      alt={file.file.name}
                    />
                  ) : null}
                  <div className="flex-1">
                    <div className="font-medium">
                      {formatToTitleCase(file.file.name)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {file.file.size
                        ? `${(file.file.size / 1024).toFixed(1)} KB`
                        : "0 KB"}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 font-medium capitalize">
                    {formatToTitleCase(file.status)}
                  </div>
                </div>
                <div className="mt-2 h-2 rounded bg-gray-200">
                  <div
                    className="h-2 rounded bg-blue-600 transition-all"
                    style={{
                      width: `${file.uploadPercent ? file.uploadPercent : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleStartUpload}
        disabled={
          files.length === 0 ||
          initLoading ||
          hasActiveUpload ||
          completeLoading
        }
        className="w-full rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
      >
        {initLoading || hasActiveUpload || completeLoading
          ? "Uploading..."
          : "Start Upload"}
      </button>
    </div>
  );
}

export default FileUploader;
