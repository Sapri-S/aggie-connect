import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import atLogo from '../../assets/at-logo.png';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="bg-aggie-dark text-white px-6 py-4 flex items-center justify-between shadow-md">
            {/* Brand */}
            <Link to="/" className="flex items-center gap-3">
                <img src={atLogo} alt="NC A&T" className="w-10 h-10 object-contain" />
                <span className="font-bold text-xl text-aggie-gold">Aggie Connect</span>
            </Link>

            {/* Nav links */}
            <div className="flex items-center gap-6 text-sm font-medium">
                {user ? (
                    <>
                        <Link to="/dashboard"            className="hover:text-aggie-gold transition-colors">Dashboard</Link>
                        <Link to="/directory"            className="hover:text-aggie-gold transition-colors">Directory</Link>
                        <Link to={`/profile/${user.id}`} className="hover:text-aggie-gold transition-colors">My Profile</Link>
                        <button onClick={handleLogout}   className="btn-secondary text-sm">Log Out</button>
                    </>
                ) : (
                    <>
                        <Link to="/login"    className="hover:text-aggie-gold transition-colors">Log In</Link>
                        <Link to="/register" className="btn-secondary text-sm">Join Now</Link>
                    </>
                )}
            </div>
        </nav>
    );
}