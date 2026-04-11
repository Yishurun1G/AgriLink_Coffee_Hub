import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

// 'children' is the page the user is trying to visit
// 'allowedRoles' is an array of roles permitted to see it (e.g., ['ADMIN', 'MANAGER'])
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useContext(AuthContext);
    const location = useLocation();

    // 1. If the AuthContext is still fetching the user from the backend, show a loader
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
            </div>
        );
    }

    // 2. Gate 1: Is the user logged in at all?
    if (!user) {
        // Send them to the login page, but remember where they were trying to go
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    // 3. Gate 2: Does the user have the correct role for this page?
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // If they are a Customer trying to see the Admin page, bounce them to an unauthorized view
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <h1 className="text-4xl font-bold text-red-600">403 - Forbidden</h1>
                <p className="mt-2 text-gray-600">You do not have permission to view this page.</p>
                <button 
                    onClick={() => window.history.back()}
                    className="mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                    Go Back
                </button>
            </div>
        );
    }

    // 4. Success! Let them through to the page
    return children;
};

export default ProtectedRoute;