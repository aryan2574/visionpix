import { useQuery } from "@apollo/client/react";
import { GET_USER } from "../graphql/queries";
import type { UserResponse } from "../../../models/types";
import Uploads from "../../uploads/components/Uploads";

function Dashboard() {
  const { data, loading, error } = useQuery<{ getUser: UserResponse }>(
    GET_USER
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  const user = data?.getUser;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      {user && (
        <div className="flex flex-col items-start justify-center mb-6 top-5 left-5 absolute">
          <p className="text-gray-600">Welcome, {user.name}</p>
          <p className="text-gray-600">Email: {user.email}</p>
          {user.message && (
            <p className="text-gray-600">Message: {user.message}</p>
          )}
        </div>
      )}
      <Uploads />
    </div>
  );
}

export default Dashboard;
