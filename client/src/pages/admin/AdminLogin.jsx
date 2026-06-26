import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

export default function AdminLogin() {
    const { login } = useAuth();
    const navigate  = useNavigate();

    const [form,  setForm]  = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [busy,  setBusy]  = useState(false);

    const handleChange = e =>
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setBusy(true);
        try {
            const user = await login(form.email, form.password);
            if (!user.isAdmin) {
                setError('Access denied — admins only.');
                return;
            }
            navigate('/admin');
        } catch (err) {
            setError(err.response?.data?.message ?? 'Login failed.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="min-h-screen bg-aggie-dark flex items-center justify-center px-4">
            <div className="card w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-6">
                    <p className="text-3xl mb-2">🔐</p>
                    <h2 className="text-2xl font-bold text-aggie-dark">Admin Portal</h2>
                    <p className="text-sm text-gray-500 mt-1">NC A&T Aggie Connect</p>
                </div>

                {error && (
                    <p className="text-red-600 text-sm mb-4 text-center bg-red-50 py-2 rounded-lg">
                        {error}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Admin Email
                        </label>
                        <input
                            type="email" name="email" required
                            value={form.email} onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aggie-blue"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password" name="password" required
                            value={form.password} onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aggie-blue"
                        />
                    </div>
                    <button type="submit" disabled={busy} className="btn-primary w-full py-2">
                        {busy ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}