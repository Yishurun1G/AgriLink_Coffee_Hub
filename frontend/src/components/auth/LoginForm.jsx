import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
    // Local state
    const [credentials, setCredentials] = useState({
        username: '',
        password: '',
    });

    const [error, setError] = useState('');

    // Auth Context
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    // Submit Handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await login(credentials.username, credentials.password);
            navigate('/');
        } catch (err) {
            setError('Invalid username or password. Please try again.');
        }
    };

    // Input Change Handler
    const handleChange = (e) => {
        setCredentials({
            ...credentials,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            {/* Error Message */}
            {error && (
                <div className="rounded-2xl border border-red-500/10 bg-red-500/10 px-4 py-3 text-sm text-red-300 backdrop-blur-sm">
                    {error}
                </div>
            )}

            {/* Username */}
            <div>
                <label className="mb-2 block text-sm font-medium tracking-wide text-gray-300">
                    Username
                </label>

                <div className="relative">
                    <input
                        name="username"
                        type="text"
                        required
                        value={credentials.username}
                        onChange={handleChange}
                        placeholder="Enter your username"
                        className="w-full rounded-2xl border border-white/5 bg-[#1b1b1b] px-4 py-3 text-white placeholder:text-gray-500 shadow-inner outline-none transition-all duration-300 focus:border-green-500/40 focus:bg-[#202020] focus:ring-2 focus:ring-green-500/20"
                    />
                </div>
            </div>

            {/* Password */}
            <div>
                <label className="mb-2 block text-sm font-medium tracking-wide text-gray-300">
                    Password
                </label>

                <div className="relative">
                    <input
                        name="password"
                        type="password"
                        required
                        value={credentials.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full rounded-2xl border border-white/5 bg-[#1b1b1b] px-4 py-3 text-white placeholder:text-gray-500 shadow-inner outline-none transition-all duration-300 focus:border-green-500/40 focus:bg-[#202020] focus:ring-2 focus:ring-green-500/20"
                    />
                </div>
            </div>

            {/* Submit Button */}
            <div>
                <button
                    type="submit"
                    className="flex w-full items-center justify-center rounded-2xl bg-green-900 px-4 py-3 text-sm font-semibold tracking-wide text-white shadow-lg shadow-green-900/30 transition-all duration-300 hover:scale-[1.01] hover:bg-green-700"
                >
                    Sign In
                </button>
            </div>
        </form>
    );
};

export default LoginForm;