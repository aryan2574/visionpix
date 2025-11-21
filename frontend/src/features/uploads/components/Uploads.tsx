import { useCallback, useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import type { ImageRecord } from "../../../models/types";
import { GET_MY_IMAGES } from "../graphql/queries";
import FileUploader from "../../fileUploader/components/FileUploader";
import ImageViewer from "../../imageViewer/components/ImageViewer";

function Uploads() {
  const { data, refetch } = useQuery<{ myImages: ImageRecord[] }>(
    GET_MY_IMAGES
  );

  const images = useMemo(() => data?.myImages ?? [], [data]);

  const refetchImages = useCallback(() => {
    return refetch();
  }, [refetch]);

  return (
    <div className="w-full p-20 pt-30">
      <FileUploader images={images} refetchImages={refetchImages} />
      <ImageViewer images={images} />
    </div>
  );
}

export default Uploads;
