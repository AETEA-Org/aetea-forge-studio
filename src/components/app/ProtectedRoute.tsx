import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  // Local environments are deliberately disconnected from cloud auth. This
  // switch exists only in Vite's development build so the signed-in welcome
  // surface can still be reviewed accurately; production compiles it away.
  const welcomePreview =
    import.meta.env.DEV && new URLSearchParams(location.search).get("welcomePreview") === "1";

  if (welcomePreview) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
