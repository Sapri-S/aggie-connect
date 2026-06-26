import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function Login() {
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
            await login(form.email, form.password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message ?? 'Login failed. Please try again.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="min-h-screen bg-aggie-light flex items-center justify-center px-4">
            <div className="card w-full max-w-md">
                <h2 className="text-2xl font-bold text-aggie-dark mb-6 text-center">Log In</h2>

                {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email" name="email" required
                            value={form.email} onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aggie-blue"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password" name="password" required
                            value={form.password} onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aggie-blue"
                        />
                    </div>
                    <button type="submit" disabled={busy} className="btn-primary w-full py-2">
                        {busy ? 'Logging in…' : 'Log In'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-4">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-aggie-blue hover:underline font-medium">Register</Link>
                </p>
            </div>
        </div>
    );
}