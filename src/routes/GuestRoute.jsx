import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Wraps routes that should only be visible to logged-out visitors, like
 * /login. If someone is already authenticated and lands here (e.g. via
 * back button), send them straight to the dashboard instead of showing
 * the login form again.
 */
export default function GuestRoute() {
  const { isAuthenticated, booting } = useAuth();
  const location = useLocation();

  if (booting) return null;

  if (isAuthenticated) {
    const redirectTo = location.state?.from?.pathname || "/";
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
