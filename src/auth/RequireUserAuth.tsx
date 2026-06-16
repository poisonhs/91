import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useViewerAuth } from "./AuthContext";

export function RequireUserAuth({ children }: { children: ReactNode }) {
  const { status } = useViewerAuth();
  const location = useLocation();

  if (status === "loading") {
    return null;
  }

  if (status === "guest") {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <>{children}</>;
}
