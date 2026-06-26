import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function Register() {
    const { register } = useAuth();
    const navigate     = useNavigate();

    const [form, setForm] = useState({
        firstName:   '',
        lastName:    '',
        email:       '',
        password:    '',
        role:        'student',
        gradYear:    '',
        position:    '',
        industry:    '',
        skills:      '',
        linkedInUrl: '',
    });

    const [pastExperience, setPastExperience] = useState([]);
    const [expForm, setExpForm] = useState({
        company:   '',
        title:     '',
        startYear: '',
        endYear:   '',
    });

    const [error, setError] = useState('');
    const [busy,  setBusy]  = useState(false);

    const handleChange = e =>
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setBusy(true);
        try {
            const formData = {
                ...form,
                skills: form.skills
                    ? form.skills.split(',').map(s => s.trim()).filter(Boolean)
                    : [],
                pastExperience,
            };
            await register(formData);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message ?? 'Registration failed. Please try again.');
        } finally {
            setBusy(false);
        }
    };

    const addExperience = () => {
        if (!expForm.company || !expForm.title) return;
        setPastExperience(prev => [...prev, expForm]);
        setExpForm({ company: '', title: '', startYear: '', endYear: '' });
    };

    const removeExperience = (idx) => {
        setPastExperience(prev => prev.filter((_, i) => i !== idx));
    };

    return (
        <div className="min-h-screen bg-aggie-light flex items-center justify-center px-4 py-12">
            <div className="card w-full max-w-md">
                <h2 className="text-2xl font-bold text-aggie-dark mb-6 text-center">Create Account</h2>

                {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <input
                                type="text" name="firstName" required
                                value={form.firstName} onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aggie-blue"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <input
                                type="text" name="lastName" required
                                value={form.lastName} onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aggie-blue"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email" name="email" required
                            value={form.email} onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aggie-blue"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password" name="password" required minLength={8}
                            value={form.password} onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aggie-blue"
                        />
                    </div>

                    {/* Role toggle */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">I am a…</label>
                        <div className="flex gap-3">
                            {['student', 'alumni'].map(r => (
                                <button
                                    key={r} type="button"
                                    onClick={() => setForm(prev => ({ ...prev, role: r }))}
                                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                                        form.role === r
                                            ? 'bg-aggie-blue text-white border-aggie-blue'
                                            : 'border-gray-300 text-gray-600 hover:border-aggie-blue'
                                    }`}
                                >
                                    {r.charAt(0).toUpperCase() + r.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grad Year */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {form.role === 'student' ? 'Expected Graduation Year' : 'Graduation Year'}
                        </label>
                        <input
                            type="number" name="gradYear" required
                            min={1900} max={2099}
                            value={form.gradYear} onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aggie-blue"
                        />
                    </div>

                    {/* Position */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {form.role === 'student' ? 'Desired Position' : 'Current Position'}
                        </label>
                        <input
                            type="text" name="position"
                            placeholder="e.g. Software Engineer"
                            value={form.position} onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aggie-blue"
                        />
                    </div>

                    {/* Industry */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                        <input
                            type="text" name="industry"
                            placeholder="e.g. Technology, Finance, Healthcare"
                            value={form.industry} onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aggie-blue"
                        />
                    </div>

                    {/* Skills */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                        <input
                            type="text" name="skills"
                            placeholder="e.g. Python, React, SQL (comma separated)"
                            value={form.skills} onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aggie-blue"
                        />
                    </div>

                    {/* LinkedIn */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL (optional)</label>
                        <input
                            type="url" name="linkedInUrl"
                            placeholder="https://linkedin.com/in/yourprofile"
                            value={form.linkedInUrl} onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aggie-blue"
                        />
                    </div>
                    {/* Past Experience */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Past Experience (optional)
                        </label>

                        {/* Existing entries */}
                        {pastExperience.length > 0 && (
                            <div className="space-y-2 mb-3">
                                {pastExperience.map((exp, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-aggie-light px-3 py-2 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium text-aggie-dark">{exp.title}</p>
                                            <p className="text-xs text-gray-500">{exp.company} {exp.startYear && `(${exp.startYear} — ${exp.endYear || 'Present'})`}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeExperience(idx)}
                                            className="text-red-400 hover:text-red-600 text-xs"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add new entry */}
                        <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Company"
                                    value={expForm.company}
                                    onChange={e => setExpForm(p => ({ ...p, company: e.target.value }))}
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aggie-blue"
                                />
                                <input
                                    type="text"
                                    placeholder="Job Title"
                                    value={expForm.title}
                                    onChange={e => setExpForm(p => ({ ...p, title: e.target.value }))}
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aggie-blue"
                                />
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Start Year"
                                    value={expForm.startYear}
                                    onChange={e => setExpForm(p => ({ ...p, startYear: e.target.value }))}
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aggie-blue"
                                />
                                <input
                                    type="number"
                                    placeholder="End Year (or leave blank)"
                                    value={expForm.endYear}
                                    onChange={e => setExpForm(p => ({ ...p, endYear: e.target.value }))}
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aggie-blue"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={addExperience}
                                className="w-full border border-aggie-blue text-aggie-blue text-sm py-1.5 rounded-lg hover:bg-aggie-light transition-colors"
                            >
                                + Add Experience
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={busy} className="btn-primary w-full py-2">
                        {busy ? 'Creating account…' : 'Register'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-4">
                    Already have an account?{' '}
                    <Link to="/login" className="text-aggie-blue hover:underline font-medium">Log In</Link>
                </p>
            </div>
        </div>
    );
}