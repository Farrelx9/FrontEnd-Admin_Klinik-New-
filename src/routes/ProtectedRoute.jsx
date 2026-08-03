import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Wraps routes that require a logged-in user. If a session is still being
 * verified (booting), show a loading state instead of flashing the login
 * page. If unauthenticated, redirect to /login and remember where the
 * person was headed so we can send them back after login.
 *
 * Optional `allowedRoles` restricts access further, e.g.
 *   <ProtectedRoute allowedRoles={["admin", "dokter"]} />
 * A logged-in user whose role isn't allowed is redirected to /403 rather
 * than /login, since they *are* authenticated — just not permitted here.
 */
export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, booting, user } = useAuth();
  const location = useLocation();

  if (booting) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-3 text-[var(--color-muted)]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-mint-200)] border-t-[var(--color-teal-600)]" />
          <p className="font-body text-sm">Memeriksa sesi…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
