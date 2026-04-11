import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/auth'); // Redirect to login after clearing tokens
    };

    return (
        <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    
                    {/* Brand Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="text-2xl font-extrabold text-green-700">
                            AgriLink
                        </Link>
                        <span className="ml-2 text-xs font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                            Coffee Hub
                        </span>
                    </div>

                    {/* Dynamic Navigation Links */}
                    <div className="hidden sm:flex sm:space-x-8 text-sm font-medium text-gray-600">
                        <Link to="/" className="hover:text-green-600 transition">Home</Link>
                        
                        {/* Dealer Links */}
                        {user?.role === 'DEALER' && (
                            <>                               
                            </>
                        )}

                        {/* Admin Links */}
                        {user?.role === 'ADMIN' && (
                            <>
                                <Link to="/admin" className="text-green-600 font-semibold">Admin Panel</Link>
                                <Link to="/admin/users" className="hover:text-green-600 transition">Manage Users</Link>
                            </>
                        )}
                    </div>

                    {/* Auth Buttons (Sign In / Logout) */}
                    <div className="flex items-center space-x-4">
                        {user ? (
                            <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-500">
                                    Hello, <span className="font-semibold text-gray-700">{user.username}</span>
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="text-sm font-medium text-red-600 hover:text-red-500 transition focus:outline-none"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <Link
                                to="/auth"
                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition shadow-sm"
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