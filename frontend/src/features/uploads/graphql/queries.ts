import { gql } from "@apollo/client";

export const GET_MY_IMAGES = gql`
  query GetMyImages {
    myImages {
      id
      fileName
      status
      progress
      sizeBytes
      width
      height
      previewUrl
      upload {
        status
      }
      labels {
        id
        name
        confidence
      }
    }
  }
`;
