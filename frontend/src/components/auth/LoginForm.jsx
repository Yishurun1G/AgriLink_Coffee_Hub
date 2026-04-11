import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
    // 1. Local state to hold what the user types
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    
    // 2. Grab the login function from our Global Auth Context
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Clear any old error messages

        try {
            // 3. Call the login function from Context
            await login(credentials.username, credentials.password);
            
            // 4. On successful login, go to the landing page or a shared dashboard
            navigate('/'); 
        } catch (err) {
            // If Django returns a 400 or 401 error, we catch it here
            setError('Invalid username or password. Please try again.');
        }
    };

    // Helper to update state as the user types
    const handleChange = (e) => {
        setCredentials({
            ...credentials,
            [e.target.name]: e.target.value
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Error Message Alert */}
            {error && (
                <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Username Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Username
                </label>
                <div className="mt-1">
                    <input
                        name="username"
                        type="text"
                        required
                        value={credentials.username}
                        onChange={handleChange}
                        className="block w-full rounded-md border border-gray-300 
                        px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                        placeholder="Enter your username"
                    />
                </div>
            </div>

            {/* Password Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Password
                </label>
                <div className="mt-1">
                    <input
                        name="password"
                        type="password"
                        required
                        value={credentials.password}
                        onChange={handleChange}
                        className="block w-full rounded-md border border-gray-300 
                        px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            {/* Submit Button */}
            <div>
                <button
                    type="submit"
                    className="flex w-full justify-center rounded-md border border-transparent
                     bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 
                     focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition"
                >
                    Sign in
                </button>
            </div>
        </form>
    );
};

export default LoginForm;