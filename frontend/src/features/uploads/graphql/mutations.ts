import { gql } from "@apollo/client";

export const INIT_UPLOAD = gql`
  mutation InitUpload($files: [FileInput!]!) {
    initUpload(files: $files) {
      uploadId
      urls {
        imageId
        fileName
        key
        url
        expiresAt
      }
    }
  }
`;

export const COMPLETE_UPLOAD = gql`
  mutation CompleteUpload($uploadId: ID!) {
    completeUpload(uploadId: $uploadId)
  }
`;
