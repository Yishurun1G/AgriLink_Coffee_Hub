// src/components/auth/RegisterForm.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const RegisterForm = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'DEALER',
        phone_number: '',
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError('');
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }

        try {
            await api.post('/users/register/', {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                phone_number: formData.phone_number || null,
            });

            setSuccess(true);

            setTimeout(() => {
                navigate('/auth');
            }, 1500);

        } catch (err) {
            console.error(err.response?.data);

            if (err.response?.data) {
                const backendError = err.response.data;

                if (typeof backendError === 'object') {
                    const firstError = Object.values(backendError)[0];

                    setError(
                        Array.isArray(firstError)
                            ? firstError[0]
                            : firstError
                    );
                } else {
                    setError(backendError);
                }
            } else {
                setError(
                    'Registration failed. Please check if server is running.'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="rounded-3xl border border-green-500/10 bg-[#181818] p-8 text-center shadow-lg">
                <h3 className="text-2xl font-semibold text-green-400">
                    Account Created Successfully!
                </h3>

                <p className="mt-3 text-gray-300">
                    Redirecting to login...
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">

            {/* Error Message */}
            {error && (
                <div className="rounded-2xl border border-red-500/10 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            {/* Username */}
            <div>
                <label className="mb-2 block text-sm font-medium tracking-wide text-gray-300">
                    Username
                </label>

                <input
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="johndoe"
                    className="w-full rounded-2xl border border-white/5 bg-[#1b1b1b] px-4 py-3 text-white placeholder:text-gray-500 outline-none transition-all duration-300 focus:border-green-500/40 focus:bg-[#202020] focus:ring-2 focus:ring-green-500/20"
                />
            </div>

            {/* Email */}
            <div>
                <label className="mb-2 block text-sm font-medium tracking-wide text-gray-300">
                    Email
                </label>

                <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full rounded-2xl border border-white/5 bg-[#1b1b1b] px-4 py-3 text-white placeholder:text-gray-500 outline-none transition-all duration-300 focus:border-green-500/40 focus:bg-[#202020] focus:ring-2 focus:ring-green-500/20"
                />
            </div>

            {/* Role */}
            <div>
                <label className="mb-2 block text-sm font-medium tracking-wide text-gray-300">
                    Account Type
                </label>

                <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/5 bg-[#1b1b1b] px-4 py-3 text-white outline-none transition-all duration-300 focus:border-green-500/40 focus:bg-[#202020] focus:ring-2 focus:ring-green-500/20"
                >
                   
                    <option value="DEALER" className="bg-[#1b1b1b]">
                        Dealer
                    </option>

                    <option value="CUSTOMER" className="bg-[#1b1b1b]">
                        Customer 
                    </option>

        
                </select>
            </div>

            {/* Phone */}
            <div>
                <label className="mb-2 block text-sm font-medium tracking-wide text-gray-300">
                    Phone Number (Optional)
                </label>

                <input
    name="phone_number"
    type="text"
    value={formData.phone_number}
    onChange={(e) => {
        const onlyNumbers = e.target.value.replace(/\D/g, "");

        setFormData({
            ...formData,
            phone_number: onlyNumbers,
        });
    }}
    placeholder="+2519********"
    className="w-full rounded-2xl border border-white/5 bg-[#1b1b1b] px-4 py-3 text-white placeholder:text-gray-500 outline-none transition-all duration-300 focus:border-green-500/40 focus:bg-[#202020] focus:ring-2 focus:ring-green-500/20"
/>
            </div>

            {/* Password */}
            <div>
                <label className="mb-2 block text-sm font-medium tracking-wide text-gray-300">
                    Password
                </label>

                <input
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-white/5 bg-[#1b1b1b] px-4 py-3 text-white placeholder:text-gray-500 outline-none transition-all duration-300 focus:border-green-500/40 focus:bg-[#202020] focus:ring-2 focus:ring-green-500/20"
                />
            </div>

            {/* Confirm Password */}
            <div>
                <label className="mb-2 block text-sm font-medium tracking-wide text-gray-300">
                    Confirm Password
                </label>

                <input
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-white/5 bg-[#1b1b1b] px-4 py-3 text-white placeholder:text-gray-500 outline-none transition-all duration-300 focus:border-green-500/40 focus:bg-[#202020] focus:ring-2 focus:ring-green-500/20"
                />
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-green-600 py-3.5 text-sm font-semibold tracking-wide text-white shadow-lg shadow-green-900/30 transition-all duration-300 hover:scale-[1.01] hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-600"
            >
                {loading ? 'Creating Account...' : 'Create Account'}
            </button>
        </form>
    );
};

export default RegisterForm;