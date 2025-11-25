import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from './AppSidebar';

export function AppLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="pl-64">
        <div className="container py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
