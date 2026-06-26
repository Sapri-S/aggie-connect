import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import martinImg from '../assets/martin.png';

export default function Home() {
    const { user } = useAuth();

    if (user) {
        // Logged-in home page
        return (
            <div className="min-h-screen bg-aggie-light">
                {/* Hero with A&T image */}
                <div className="relative h-72 md:h-96 overflow-hidden">
                    <img
                        src={martinImg}
                        alt="NC A&T"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-aggie-dark bg-opacity-60 flex items-center justify-center">
                        <div className="text-center text-white px-6">
                            <h1 className="text-3xl md:text-5xl font-bold mb-2">
                                Welcome back, <span className="text-aggie-gold">{user.firstName}!</span>
                            </h1>
                            <p className="text-gray-300 text-lg">NC A&T Computer Science Alumni Network</p>
                        </div>
                    </div>
                </div>

                {/* Quick links */}
                <div className="max-w-5xl mx-auto px-6 py-12">
                    <h2 className="text-xl font-bold text-aggie-dark mb-6">Quick Links</h2>
                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Directory',  to: '/directory',          desc: 'Find alumni & students',   tag: 'Live'        },
                            { label: 'My Profile', to: `/profile/${user.id}`, desc: 'View your profile',         tag: 'Live'        },
                            { label: 'Dashboard',  to: '/dashboard',          desc: 'Your network activity',     tag: 'Live'        },
                            { label: 'Jobs',       to: '/jobs',               desc: 'Browse job postings',       tag: 'Coming Soon' },
                            { label: 'Events',     to: '/events',             desc: 'Upcoming CS events',        tag: 'Coming Soon' },
                            { label: 'News',       to: '/news',               desc: 'Department news',           tag: 'Coming Soon' },
                            { label: 'Mentorship', to: '/mentorship',         desc: 'Connect with mentors',      tag: 'Coming Soon' },
                            { label: 'Messages',   to: '/messages',           desc: 'Chat with connections',     tag: 'Coming Soon' },
                        ].map(link => (
                            <Link
                                key={link.label}
                                to={link.to}
                                className="card hover:shadow-md transition-shadow group"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-semibold text-aggie-dark group-hover:text-aggie-blue transition-colors">
                                        {link.label}
                                    </p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                        link.tag === 'Live'
                                            ? 'bg-green-100 text-green-600'
                                            : 'bg-gray-100 text-gray-400'
                                    }`}>
                    {link.tag}
                  </span>
                                </div>
                                <p className="text-xs text-gray-400">{link.desc}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Logged-out home page
    return (
        <div className="min-h-screen bg-aggie-light">
            {/* Hero with A&T image */}
            <div className="relative h-72 md:h-96 overflow-hidden">
                <img
                    src={martinImg}
                    alt="NC A&T"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-aggie-dark bg-opacity-60 flex items-center justify-center">
                    <div className="text-center text-white px-6">
                        <h1 className="text-3xl md:text-5xl font-bold mb-2">
                            Welcome to <span className="text-aggie-gold">Aggie Connect</span>
                        </h1>
                        <p className="text-gray-300 text-lg mb-6">
                            NC A&T Computer Science Alumni & Student Network
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link to="/register" className="btn-secondary text-base px-6 py-3">Join Now</Link>
                            <Link to="/login"    className="btn-primary   text-base px-6 py-3">Log In</Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features */}
            <section className="max-w-5xl mx-auto py-20 px-6 grid md:grid-cols-3 gap-8 text-center">
                {[
                    { title: 'Connect',  desc: 'Find alumni in your field or students looking for guidance.' },
                    { title: 'Mentor',   desc: 'Alumni can offer career advice, resume reviews, and referrals.' },
                    { title: 'Search',   desc: 'Smart search finds the right people by position, industry, or skill.' },
                ].map(f => (
                    <div key={f.title} className="card border-t-4 border-aggie-blue">
                        <h3 className="font-bold text-lg text-aggie-dark mb-2">{f.title}</h3>
                        <p className="text-gray-600 text-sm">{f.desc}</p>
                    </div>
                ))}
            </section>
        </div>
    );
}