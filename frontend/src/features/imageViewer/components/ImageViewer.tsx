import { UPLOAD_STATUS } from "../../../constants/constants";
import { type ImageRecord, type Label } from "../../../models/types";
import { formatToTitleCase } from "../../../utils/format";

interface ImageViewerProps {
  images: ImageRecord[];
}

function ImageViewer({ images }: ImageViewerProps) {
  return (
    <>
      {images.length > 0 ? (
        <div className="space-y-4 border-t pt-6">
          <h2 className="text-xl font-bold">
            Uploaded Images ({images.length})
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {images.map((image: ImageRecord) => {
              const isProcessing = image.status === UPLOAD_STATUS.PROCESSING;
              const status = isProcessing
                ? "Processing"
                : image.status.charAt(0).toUpperCase() + image.status.slice(1);
              return (
                <div
                  key={image.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-3 aspect-square overflow-hidden rounded-lg bg-gray-100">
                    <img
                      src={image.previewUrl}
                      alt={image.fileName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="truncate font-medium text-gray-900">
                      {image.fileName}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center justify-between">
                        <span>Status:</span>
                        <span className="font-medium capitalize">
                          {formatToTitleCase(status)}
                        </span>
                      </div>
                      {image.sizeBytes && (
                        <div className="flex items-center justify-between">
                          <span>Size:</span>
                          <span className="font-medium capitalize">
                            {image.sizeBytes
                              ? `${(image.sizeBytes / 1024).toFixed(1)} KB`
                              : "0 KB"}
                          </span>
                        </div>
                      )}
                      {image.width && image.height && (
                        <div className="flex items-center justify-between">
                          <span>Dimensions:</span>
                          <span className="font-medium capitalize">
                            {image.width} × {image.height}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span>Progress:</span>
                        <span className="font-medium capitalize">
                          {isProcessing ? "--" : `${image.progress}%`}
                        </span>
                      </div>
                      {image.upload && (
                        <div className="flex items-center justify-between">
                          <span>Upload Status:</span>
                          <span className="font-medium capitalize">
                            {isProcessing
                              ? "--"
                              : formatToTitleCase(image.upload.status)}
                          </span>
                        </div>
                      )}
                    </div>
                    {image.labels && image.labels.length > 0 && (
                      <div className="mt-2 pt-2 border-t">
                        <div className="text-xs font-medium text-gray-700 mb-1">
                          Labels:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {image.labels.map((label: Label) => {
                            const confidence = label?.confidence
                              ? ` (${
                                  label?.confidence
                                    ? label?.confidence.toFixed(2)
                                    : 0
                                }%)`
                              : "";
                            const name = formatToTitleCase(label.name);
                            return (
                              <span
                                key={label.id}
                                className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800"
                              >
                                {name}
                                {confidence}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500">No images to display.</div>
      )}
    </>
  );
}

export default ImageViewer;
