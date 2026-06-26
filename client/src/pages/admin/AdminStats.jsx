import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminStats() {
    const [stats,   setStats]   = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState('');

    useEffect(() => {
        api.get('/admin/stats')
            .then(res => setStats(res.data))
            .catch(() => setError('Could not load stats.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p className="text-center py-10 text-aggie-blue">Loading stats…</p>;
    if (error)   return <p className="text-center py-10 text-red-500">{error}</p>;

    const cards = [
        { label: 'Total Users',          value: stats.totalUsers,          icon: '👥' },
        { label: 'Students',             value: stats.totalStudents,        icon: '🎓' },
        { label: 'Alumni',               value: stats.totalAlumni,          icon: '💼' },
        { label: 'Pending Approvals',    value: stats.pendingApprovals,     icon: '⏳' },
        { label: 'Total Connections',    value: stats.totalConnections,     icon: '🔗' },
        { label: 'Accepted Connections', value: stats.acceptedConnections,  icon: '✅' },
    ];

    return (
        <div>
            <h2 className="text-xl font-bold text-aggie-dark mb-6">Site Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {cards.map(c => (
                    <div key={c.label} className="card text-center">
                        <p className="text-3xl mb-2">{c.icon}</p>
                        <p className="text-3xl font-bold text-aggie-blue">{c.value}</p>
                        <p className="text-sm text-gray-500 mt-1">{c.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}