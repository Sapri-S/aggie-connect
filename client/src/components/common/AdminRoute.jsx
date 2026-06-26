import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

export default function AdminRoute() {
    const { user, loading } = useAuth();

    if (loading) return (
        <div className="flex justify-center py-20 text-aggie-blue">
            Loading…
        </div>
    );

    if (!user) return <Navigate to="/admin/login" replace />;
    if (!user.isAdmin) return <Navigate to="/dashboard" replace />;

    return <Outlet />;
}