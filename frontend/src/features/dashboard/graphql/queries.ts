import { gql } from "@apollo/client";

export const GET_USER = gql`
  query GetUser {
    getUser {
      name
      email
      message
    }
  }
`;
