import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // TEMPORARY: Skip auth check for testing in iOS simulator
  const SKIP_AUTH_FOR_TESTING = true;

  useEffect(() => {
    if (!SKIP_AUTH_FOR_TESTING && !loading && !user) {
      navigate('/auth', { state: { from: location.pathname } });
    }
  }, [user, loading, navigate, location]);

  if (!SKIP_AUTH_FOR_TESTING && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!SKIP_AUTH_FOR_TESTING && !user) {
    return null;
  }

  return <>{children}</>;
}
