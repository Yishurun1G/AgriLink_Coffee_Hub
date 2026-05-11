import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/auth');
    };

    return (
        <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0b0b0b]/95 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.85)] overflow-hidden">

            {/* Ambient Glow */}
            <div className="absolute top-0 left-1/3 h-40 w-40 rounded-full bg-green-500/10 blur-3xl"></div>

            {/* Top glossy line */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-white/10"></div>

            {/* Dark Texture */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.03),transparent_50%)]"></div>

            <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                <div className="flex h-16 items-center justify-between">

                    {/* Logo */}
                    <div className="flex items-center">

                        <Link
                            to="/"
                            className="text-3xl font-extrabold tracking-wide text-white transition duration-300 hover:text-green-400"
                        >
                            AgriLink
                        </Link>

                        <span className="ml-3 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-green-400 shadow-lg shadow-green-900/20">
                            Coffee Hub
                        </span>

                    </div>

                    {/* Navigation Links */}
                    <div className="hidden items-center space-x-8 text-sm font-medium text-gray-300 sm:flex">

                        <Link
                            to="/"
                            className="transition duration-300 hover:text-green-400"
                        >
                            Home
                        </Link>

                        {/* Dealer */}
                        {user?.role === 'DEALER' && (
                            <>
                            </>
                        )}

                        {/* Admin */}
                        {user?.role === 'ADMIN' && (
                            <>
                                <Link
                                    to="/admin"
                                    className="font-semibold text-green-400"
                                >
                                    Admin Panel
                                </Link>

                                <Link
                                    to="/admin/users"
                                    className="transition duration-300 hover:text-green-400"
                                >
                                    Manage Users
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center space-x-4">

                        {user ? (
                            <div className="flex items-center space-x-4">

                                <div className="hidden text-sm text-gray-400 sm:block">
                                    Hello,
                                    <span className="ml-1 font-semibold text-white">
                                        {user.username}
                                    </span>
                                </div>

                                <button
                                    onClick={handleLogout}
                                    className="rounded-xl border border-red-500/10 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-all duration-300 hover:bg-red-500/20 hover:text-red-300"
                                >
                                    Logout
                                </button>

                            </div>
                        ) : (
                            <Link
                                to="/auth"
                                className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold tracking-wide text-white shadow-lg shadow-green-900/30 transition-all duration-300 hover:scale-[1.03] hover:bg-green-700"
                            >
                                Sign In
                            </Link>
                        )}

                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;