import { useEffect, useState } from 'react';
import api from '../services/api';
import AlumniCard  from '../components/alumni/AlumniCard';
import StudentCard from '../components/student/StudentCard';

export default function Directory() {
    const [users,    setUsers]    = useState([]);
    const [filter,   setFilter]   = useState('all');
    const [search,   setSearch]   = useState('');
    const [industry, setIndustry] = useState('');
    const [skill,    setSkill]    = useState('');
    const [company,  setCompany]  = useState('');
    const [loading,  setLoading]  = useState(true);

    useEffect(() => {
        const params = new URLSearchParams();
        if (filter  !== 'all') params.append('role',     filter);
        if (search)            params.append('search',   search);
        if (industry)          params.append('industry', industry);
        if (skill)             params.append('skill',    skill);
        if (company)           params.append('company',  company);

        setLoading(true);
        api.get(`/users?${params.toString()}`)
            .then(res => setUsers(res.data))
            .finally(() => setLoading(false));
    }, [filter, search, industry, skill, company]);

    return (
        <div className="max-w-5xl mx-auto px-6 py-10">
            <h1 className="text-2xl font-bold text-aggie-dark mb-2">Member Directory</h1>
            <p className="text-gray-500 mb-6">
                Search by name, position, industry, or skill to find the right connection.
            </p>

            {/* Search bar */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by name, position, industry, or skill…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aggie-blue"
                />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-8">
                {/* Role filter */}
                <div className="flex gap-2">
                    {['all', 'alumni', 'student'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                filter === f
                                    ? 'bg-aggie-blue text-white border-aggie-blue'
                                    : 'border-gray-300 text-gray-600 hover:border-aggie-blue'
                            }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Industry filter */}
                <input
                    type="text"
                    placeholder="Filter by industry…"
                    value={industry}
                    onChange={e => setIndustry(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aggie-blue"
                />

                {/* Skill filter */}
                <input
                    type="text"
                    placeholder="Filter by skill…"
                    value={skill}
                    onChange={e => setSkill(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aggie-blue"
                />
                {/* Company filter */}
                <input
                    type="text"
                    placeholder="Filter by company…"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aggie-blue"
                />

                {/* Clear filters */}
                {(search || industry || skill || company || filter !== 'all') && (
                    <button
                        onClick={() => {
                            setSearch('');
                            setIndustry('');
                            setSkill('');
                            setCompany('');
                            setFilter('all');
                        }}
                        className="px-4 py-2 rounded-lg text-sm font-medium border border-red-300 text-red-500 hover:bg-red-50 transition-colors"
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Results */}
            {loading ? (
                <p className="text-center text-aggie-blue py-20">Loading directory…</p>
            ) : users.length === 0 ? (
                <div className="card text-center py-16">
                    <p className="text-gray-400 text-lg mb-2">No members found</p>
                    <p className="text-gray-300 text-sm">Try adjusting your search or filters</p>
                </div>
            ) : (
                <>
                    <p className="text-sm text-gray-400 mb-4">{users.length} member{users.length !== 1 ? 's' : ''} found</p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {users.map(u =>
                            u.role === 'alumni'
                                ? <AlumniCard  key={u.id} alumni={u}  />
                                : <StudentCard key={u.id} student={u} />
                        )}
                    </div>
                </>
            )}
        </div>
    );
}