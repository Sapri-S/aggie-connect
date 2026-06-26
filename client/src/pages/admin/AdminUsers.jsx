import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminUsers() {
    const [users,    setUsers]    = useState([]);
    const [filter,   setFilter]   = useState('all');
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState('');
    const [editing,  setEditing]  = useState(null);
    const [editForm, setEditForm] = useState({});
    const [busy,     setBusy]     = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = () => {
        setLoading(true);
        api.get('/admin/users')
            .then(res => setUsers(res.data))
            .catch(() => setError('Could not load users.'))
            .finally(() => setLoading(false));
    };

    const handleApprove = async (id) => {
        await api.patch(`/admin/users/${id}/approve`);
        setUsers(prev => prev.map(u => u.id === id ? { ...u, isApproved: true } : u));
    };

    const handleReject = async (id) => {
        await api.patch(`/admin/users/${id}/reject`);
        setUsers(prev => prev.filter(u => u.id !== id));
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        await api.delete(`/admin/users/${id}`);
        setUsers(prev => prev.filter(u => u.id !== id));
    };

    const startEdit = (user) => {
        setEditing(user.id);
        setEditForm({
            firstName: user.firstName,
            lastName:  user.lastName,
            email:     user.email,
            role:      user.role,
            position:  user.position  ?? '',
            industry:  user.industry  ?? '',
            company:   user.company   ?? '',
            bio:       user.bio       ?? '',
            isApproved: user.isApproved,
            isAdmin:    user.isAdmin,
        });
    };

    const handleEditSave = async (id) => {
        setBusy(true);
        try {
            const res = await api.patch(`/admin/users/${id}`, editForm);
            setUsers(prev => prev.map(u => u.id === id ? res.data : u));
            setEditing(null);
        } catch {
            setError('Could not save changes.');
        } finally {
            setBusy(false);
        }
    };

    const visible = users.filter(u => {
        if (filter === 'pending')  return !u.isApproved && !u.isAdmin;
        if (filter === 'alumni')   return u.role === 'alumni';
        if (filter === 'student')  return u.role === 'student';
        if (filter === 'admin')    return u.isAdmin;
        return true;
    });

    if (loading) return <p className="text-center py-10 text-aggie-blue">Loading users…</p>;
    if (error)   return <p className="text-center py-10 text-red-500">{error}</p>;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-aggie-dark">Manage Users</h2>
                <p className="text-sm text-gray-400">{visible.length} users</p>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {['all', 'pending', 'student', 'alumni', 'admin'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                            filter === f
                                ? 'bg-aggie-blue text-white border-aggie-blue'
                                : 'border-gray-300 text-gray-600 hover:border-aggie-blue'
                        }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* User list */}
            <div className="space-y-4">
                {visible.map(user => (
                    <div key={user.id} className="card">
                        {editing === user.id ? (
                            /* Edit form */
                            <div className="space-y-3">
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">First Name</label>
                                        <input
                                            value={editForm.firstName}
                                            onChange={e => setEditForm(p => ({ ...p, firstName: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-aggie-blue"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Last Name</label>
                                        <input
                                            value={editForm.lastName}
                                            onChange={e => setEditForm(p => ({ ...p, lastName: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-aggie-blue"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                                    <input
                                        value={editForm.email}
                                        onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-aggie-blue"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
                                        <select
                                            value={editForm.role}
                                            onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-aggie-blue"
                                        >
                                            <option value="student">Student</option>
                                            <option value="alumni">Alumni</option>
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Position</label>
                                        <input
                                            value={editForm.position}
                                            onChange={e => setEditForm(p => ({ ...p, position: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-aggie-blue"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Bio</label>
                                    <textarea
                                        value={editForm.bio}
                                        onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))}
                                        rows={3}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-aggie-blue"
                                    />
                                </div>

                                {/* Toggles */}
                                <div className="flex gap-6">
                                    <label className="flex items-center gap-2 text-sm text-gray-600">
                                        <input
                                            type="checkbox"
                                            checked={editForm.isApproved}
                                            onChange={e => setEditForm(p => ({ ...p, isApproved: e.target.checked }))}
                                        />
                                        Approved
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-600">
                                        <input
                                            type="checkbox"
                                            checked={editForm.isAdmin}
                                            onChange={e => setEditForm(p => ({ ...p, isAdmin: e.target.checked }))}
                                        />
                                        Admin
                                    </label>
                                </div>

                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => handleEditSave(user.id)}
                                        disabled={busy}
                                        className="btn-primary text-sm py-1.5 px-4"
                                    >
                                        {busy ? 'Saving…' : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => setEditing(null)}
                                        className="btn-secondary text-sm py-1.5 px-4"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* User row */
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                                        user.role === 'alumni'
                                            ? 'bg-aggie-blue text-white'
                                            : 'bg-aggie-gold text-aggie-dark'
                                    }`}>
                                        {user.firstName?.[0]}{user.lastName?.[0]}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {user.firstName} {user.lastName}
                                            {user.isAdmin && (
                                                <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Admin</span>
                                            )}
                                            {!user.isApproved && !user.isAdmin && (
                                                <span className="ml-2 text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">Pending</span>
                                            )}
                                        </p>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                        <p className="text-xs text-gray-400 capitalize">{user.role} {user.position && `— ${user.position}`}</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 flex-wrap justify-end">
                                    {!user.isApproved && !user.isAdmin && (
                                        <>
                                            <button
                                                onClick={() => handleApprove(user.id)}
                                                className="text-xs bg-green-50 text-green-600 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(user.id)}
                                                className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => startEdit(user)}
                                        className="text-xs bg-aggie-light text-aggie-blue border border-aggie-blue px-3 py-1.5 rounded-lg hover:bg-aggie-blue hover:text-white transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}