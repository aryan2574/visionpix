import { useEffect } from "react";
import {
  DEFAULT_POLLING_INTERVAL,
  UPLOAD_STATUS,
} from "../../../constants/constants";
import type { ImageRecord } from "../../../models/types";

interface UseProcessingPollProps {
  images: ImageRecord[];
  refetch: () => void;
  intervalMs?: number;
}

// Fetches the images from the database while any image is still processing.
export function useProcessingPoll({
  images,
  refetch,
  intervalMs = DEFAULT_POLLING_INTERVAL,
}: UseProcessingPollProps) {
  useEffect(() => {
    const needsPolling = images.some(
      (image) => image.status === UPLOAD_STATUS.PROCESSING
    );
    if (!needsPolling) return;

    const intervalId = setInterval(() => {
      void refetch();
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [images, intervalMs, refetch]);
}
