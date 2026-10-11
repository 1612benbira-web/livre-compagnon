import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Spinner } from './Feedback.jsx';

// Protection d'interface uniquement : le backend contrôle toujours l'authentification et le rôle.
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function AdminRoute() {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <Spinner />;
  if (!user || !isAdmin) return <Navigate to="/admin/connexion" replace />;
  return <Outlet />;
}
