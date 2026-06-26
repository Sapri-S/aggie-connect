import { Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

// Redirects logged-in users away from public-only pages
export default function PublicRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return (
        <div className="flex justify-center py-20 text-aggie-blue">
            Loading…
        </div>
    );

    return user ? <Navigate to="/dashboard" replace /> : children;
}