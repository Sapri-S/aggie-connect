import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../services/api';

export default function Dashboard() {
    const { user } = useAuth();
    const [pending,   setPending]   = useState([]);
    const [accepted,  setAccepted]  = useState([]);
    const [loading,   setLoading]   = useState(true);

    useEffect(() => {
        Promise.all([
            api.get('/connections/pending'),
            api.get('/connections/accepted'),
        ])
            .then(([pendingRes, acceptedRes]) => {
                setPending(pendingRes.data);
                setAccepted(acceptedRes.data);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="max-w-5xl mx-auto px-6 py-10">
            <h1 className="text-2xl font-bold text-aggie-dark mb-2">
                Welcome back, {user?.firstName}! 👋
            </h1>
            <p className="text-gray-500 mb-8">Here's what's happening in the Aggie network.</p>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-6 mb-10">
                <div className="card text-center">
                    <p className="text-3xl font-bold text-aggie-blue">
                        {loading ? '…' : accepted.length}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Connections</p>
                </div>
                <div className="card text-center">
                    <p className="text-3xl font-bold text-aggie-gold">
                        {loading ? '…' : pending.length}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Pending Requests</p>
                </div>
                <div className="card text-center">
                    <p className="text-3xl font-bold text-aggie-blue">—</p>
                    <p className="text-sm text-gray-500 mt-1">Profile Views</p>
                </div>
            </div>

            {/* Pending requests */}
            {pending.length > 0 && (
                <section className="mb-10">
                    <h2 className="text-lg font-semibold text-aggie-dark mb-4">
                        Pending Requests 🔔
                    </h2>
                    <div className="space-y-3">
                        {pending.map(conn => (
                            <div key={conn.id} className="card flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-800">
                                        User #{conn.requesterId} wants to connect
                                    </p>
                                    {conn.message && (
                                        <p className="text-xs text-gray-500 mt-1">"{conn.message}"</p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => api.patch(`/connections/${conn.id}`, { status: 'accepted' })
                                            .then(() => {
                                                setAccepted(prev => [...prev, { ...conn, status: 'accepted' }]);
                                                setPending(prev => prev.filter(p => p.id !== conn.id));
                                            })
                                        }
                                        className="btn-primary text-xs py-1 px-3"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => api.patch(`/connections/${conn.id}`, { status: 'declined' })
                                            .then(() => setPending(prev => prev.filter(p => p.id !== conn.id)))
                                        }
                                        className="btn-secondary text-xs py-1 px-3"
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Quick links */}
            <section>
                <h2 className="text-lg font-semibold text-aggie-dark mb-4">Quick Links</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <Link to="/directory" className="card hover:shadow-md transition-shadow text-center">
                        <p className="text-2xl mb-2">🔍</p>
                        <p className="font-medium text-aggie-dark">Browse Directory</p>
                        <p className="text-sm text-gray-500 mt-1">Find alumni and students</p>
                    </Link>
                    <Link to={`/profile/${user?.id}`} className="card hover:shadow-md transition-shadow text-center">
                        <p className="text-2xl mb-2">👤</p>
                        <p className="font-medium text-aggie-dark">My Profile</p>
                        <p className="text-sm text-gray-500 mt-1">View and edit your profile</p>
                    </Link>
                </div>
            </section>
        </div>
    );
}