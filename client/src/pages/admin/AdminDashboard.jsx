import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import AdminStats from './AdminStats';
import AdminUsers from './AdminUsers';

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const navigate         = useNavigate();
    const [activeTab, setActiveTab] = useState('stats');

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    const tabs = [
        { id: 'stats', label: '📊 Stats' },
        { id: 'users', label: '👥 Users' },
    ];

    return (
        <div className="min-h-screen bg-aggie-light">
            {/* Admin Navbar */}
            <nav className="bg-aggie-dark text-white px-6 py-4 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                    <span className="text-aggie-gold font-bold text-xl">🔐 Admin Portal</span>
                    <span className="text-gray-400 text-sm">NC A&T Aggie Connect</span>
                </div>
                <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300">
            Logged in as <span className="text-aggie-gold font-medium">{user?.firstName} {user?.lastName}</span>
          </span>
                    <button onClick={handleLogout} className="btn-secondary text-sm">
                        Log Out
                    </button>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-6 py-10">
                <h1 className="text-2xl font-bold text-aggie-dark mb-2">Admin Dashboard</h1>
                <p className="text-gray-500 mb-8">Manage users, approvals, and site data.</p>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 border-b border-gray-200">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === tab.id
                                    ? 'border-aggie-blue text-aggie-blue'
                                    : 'border-transparent text-gray-500 hover:text-aggie-blue'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                {activeTab === 'stats' && <AdminStats />}
                {activeTab === 'users' && <AdminUsers />}
            </div>
        </div>
    );
}