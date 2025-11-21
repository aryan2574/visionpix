import { useCallback, useMemo, useRef, useState } from "react";
import { FILE_STATUS, MAX_FILES, MAX_SIZE } from "../../../constants/constants";
import type { FileWithMeta } from "../../../models/types";

interface UseSelectedFilesResultProps {
  files: FileWithMeta[];
  error: string | null;
  setError: (value: string | null) => void;
  handleSelection: (inputFiles: FileList | null) => void;
  reset: () => void;
  updateFile: (fileId: string, updates: Partial<FileWithMeta>) => void;
  hasActiveUpload: boolean;
}

export function useSelectedFiles(): UseSelectedFilesResultProps {
  const [files, setFiles] = useState<FileWithMeta[]>([]);
  const [error, setError] = useState<string | null>(null);
  const idPrefixRef = useRef<number>(Date.now());

  const updateFile = useCallback(
    (fileId: string, updates: Partial<FileWithMeta>) => {
      setFiles((prev) =>
        prev.map((file) =>
          file.id === fileId ? { ...file, ...updates } : file
        )
      );
    },
    []
  );

  // Handle user uploaded files
  const handleSelection = useCallback(
    (inputFiles: FileList | null) => {
      if (!inputFiles) return;

      // Check how many slots are available (max 5)
      const existingCount = files.length;
      const availableSlots = Math.max(0, MAX_FILES - existingCount);
      const selected = Array.from(inputFiles).slice(0, availableSlots);

      if (selected.length === 0) {
        setError(`You can upload up to ${MAX_FILES} images.`);
        return;
      }

      // Check if the file is valid
      const invalidFile = selected.find(
        (file) => !file.type.startsWith("image/") || file.size > MAX_SIZE
      );

      if (invalidFile) {
        setError("Image is not valid or exceeds the 100 MB limit.");
        return;
      }

      const mapped = selected.map((file, index) => ({
        id: `${idPrefixRef.current}-${index}-${file.name}`,
        file,
        uploadPercent: 0,
        status: FILE_STATUS.IDLE,
        localPreview: URL.createObjectURL(file),
      }));

      setFiles((prev) => [...prev, ...mapped]);
      setError(null);
      idPrefixRef.current = Date.now();
    },
    [files]
  );

  // Reset the files and error
  const reset = useCallback(() => {
    setFiles((prev) => {
      prev.forEach((file) => {
        if (file.localPreview) URL.revokeObjectURL(file.localPreview);
      });
      return [];
    });
    setError(null);
  }, []);

  // Check if there is an active upload
  const hasActiveUpload: boolean = useMemo(
    () => files.some((file) => file.status === FILE_STATUS.UPLOADING),
    [files]
  );

  return {
    files,
    error,
    setError,
    handleSelection,
    reset,
    updateFile,
    hasActiveUpload,
  };
}
