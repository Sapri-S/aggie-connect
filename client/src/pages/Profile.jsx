import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { formatGradYear } from '../utils/helpers';
import useAuth from '../hooks/useAuth';

export default function Profile() {
    const { id }                      = useParams();
    const { user: me }                = useAuth();
    const [profile,    setProfile]    = useState(null);
    const [loading,    setLoading]    = useState(true);
    const [error,      setError]      = useState('');
    const [connection, setConnection] = useState(null);
    const [connecting, setConnecting] = useState(false);

    useEffect(() => {
        Promise.all([
            api.get(`/users/${id}`),
            api.get('/connections'),
        ])
            .then(([userRes, connRes]) => {
                setProfile(userRes.data);
                const existing = connRes.data.find(
                    c => c.requesterId === Number(id) || c.receiverId === Number(id)
                );
                setConnection(existing ?? null);
            })
            .catch(() => setError('Could not load profile.'))
            .finally(() => setLoading(false));
    }, [id]);

    const handleConnect = async () => {
        setConnecting(true);
        try {
            const res = await api.post(`/connections/${id}`);
            setConnection(res.data);
        } catch (err) {
            setError(err.response?.data?.message ?? 'Could not send request.');
        } finally {
            setConnecting(false);
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('photo', file);
        try {
            const res = await api.post('/upload/photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            console.log('Photo URL returned:', res.data.photoUrl);
            setProfile(prev => ({ ...prev, photoUrl: res.data.photoUrl }));
        } catch (err) {
            console.error('Upload error:', err);
            setError('Could not upload photo.');
        }
    };
    const getConnectionLabel = () => {
        if (!connection) return null;
        if (connection.status === 'accepted') return '✅ Connected';
        if (connection.status === 'pending')  return '⏳ Request Pending';
        if (connection.status === 'declined') return '❌ Request Declined';
    };

    if (loading) return <p className="text-center py-20 text-aggie-blue">Loading…</p>;
    if (error)   return <p className="text-center py-20 text-red-500">{error}</p>;

    const isOwnProfile = me?.id === profile.id;

    return (
        <div className="max-w-2xl mx-auto px-6 py-10">
            <div className="card">

                {/* Avatar + header */}
                <div className="flex items-center gap-6 mb-6">
                    <div className="relative shrink-0">
                        {profile.photoUrl ? (
                            <img
                                src={profile.photoUrl}
                                alt={`${profile.firstName} ${profile.lastName}`}
                                className="w-20 h-20 rounded-full object-cover"
                            />
                        ) : (
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold ${
                                profile.role === 'alumni'
                                    ? 'bg-aggie-blue text-white'
                                    : 'bg-aggie-gold text-aggie-dark'
                            }`}>
                                {profile.firstName?.[0]}{profile.lastName?.[0]}
                            </div>
                        )}

                        {/* Upload button — only shows on own profile */}
                        {isOwnProfile && (
                            <label className="absolute bottom-0 right-0 bg-aggie-blue text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer hover:bg-aggie-dark transition-colors">
                                <span className="text-xs">+</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handlePhotoUpload}
                                />
                            </label>
                        )}
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-aggie-dark">
                            {profile.firstName} {profile.lastName}
                        </h1>
                        <p className="text-aggie-blue text-sm capitalize">{profile.role}</p>
                        {profile.position && <p className="text-gray-600 text-sm">{profile.position}</p>}
                        {profile.company  && <p className="text-gray-500 text-sm">@ {profile.company}</p>}
                        <p className="text-gray-400 text-xs mt-1">{formatGradYear(profile.gradYear)}</p>
                    </div>
                </div>

                {/* Details */}
                <div className="space-y-3 text-sm text-gray-700">
                    {profile.industry && (
                        <p><span className="font-medium">Industry:</span> {profile.industry}</p>
                    )}
                    {profile.bio && (
                        <p><span className="font-medium">About:</span> {profile.bio}</p>
                    )}
                    {profile.linkedInUrl && (
                        <p>
                            <span className="font-medium">LinkedIn: </span>
                            <a href={profile.linkedInUrl} target="_blank" rel="noreferrer" className="text-aggie-blue hover:underline">View Profile</a>
                        </p>
                    )}
                </div>

                {/* Skills */}
                {profile.skills?.length > 0 && (
                    <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Skills</p>
                        <div className="flex flex-wrap gap-2">
                            {profile.skills.map(skill => (
                                <span key={skill} className="text-xs bg-aggie-light text-aggie-blue px-3 py-1 rounded-full">
                  {skill}
                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Past Experience */}
                {profile.pastExperience?.length > 0 && (
                    <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Past Experience</p>
                        <div className="space-y-2">
                            {profile.pastExperience.map((exp, idx) => (
                                <div key={idx} className="bg-aggie-light px-4 py-3 rounded-lg">
                                    <p className="text-sm font-medium text-aggie-dark">{exp.title}</p>
                                    <p className="text-xs text-gray-500">
                                        {exp.company}
                                        {exp.startYear && (
                                            <span className="ml-1">({exp.startYear} — {exp.endYear || 'Present'})</span>
                                        )}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                    {isOwnProfile ? (
                        <button className="btn-primary">Edit Profile</button>
                    ) : connection ? (
                        <span className="text-sm font-medium text-gray-500">
              {getConnectionLabel()}
            </span>
                    ) : (
                        <button onClick={handleConnect} disabled={connecting} className="btn-primary">
                            {connecting ? 'Sending…' : 'Connect'}
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}