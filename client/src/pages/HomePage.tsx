import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-clinic-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Navigate to={user.role === "admin" ? "/admin" : "/doctors"} replace />
  );
}
