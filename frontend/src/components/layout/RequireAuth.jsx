import { Navigate, Outlet, useLocation } from 'react-router-dom';

/**
 * Ensures a user is logged in before rendering nested routes.
 */
export default function RequireAuth({ user }) {
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
