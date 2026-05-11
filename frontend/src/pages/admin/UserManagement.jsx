import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/dashboard/AdminSidebar';
import {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserActive,
    resetUserPassword
} from '../../api/adminApi';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'CUSTOMER',
        phone_number: '',
        location: '',
        first_name: '',
        last_name: '',
    });

    const [newPassword, setNewPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, [roleFilter, statusFilter]);

    const fetchUsers = async () => {
        try {
            setLoading(true);

            const params = {};
            if (roleFilter) params.role = roleFilter;
            if (statusFilter) params.is_active = statusFilter;

            const data = await getAllUsers(params);

            setUsers(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await createUser(formData);
            setShowCreateModal(false);
            resetForm();
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to create user');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await updateUser(selectedUser.id, formData);
            setShowEditModal(false);
            resetForm();
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to update user');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleActive = async (userId) => {
        if (!confirm("Are you sure you want to change this user's status?")) return;

        try {
            await toggleUserActive(userId);
            fetchUsers();
        } catch (err) {
            alert('Failed to update user status');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            await deleteUser(userId);
            fetchUsers();
        } catch (err) {
            alert('Failed to delete user');
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await resetUserPassword(selectedUser.id, newPassword);

            setShowPasswordModal(false);
            setNewPassword('');
            setSelectedUser(null);

            alert('Password reset successfully');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to reset password');
        } finally {
            setSubmitting(false);
        }
    };

    const openEditModal = (user) => {
        setSelectedUser(user);

        setFormData({
            username: user.username,
            email: user.email || '',
            password: '',
            role: user.role,
            phone_number: user.phone_number || '',
            location: user.location || '',
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            is_active: user.is_active,
        });

        setShowEditModal(true);
    };

    const openPasswordModal = (user) => {
        setSelectedUser(user);
        setNewPassword('');
        setShowPasswordModal(true);
    };

    const resetForm = () => {
        setFormData({
            username: '',
            email: '',
            password: '',
            role: 'CUSTOMER',
            phone_number: '',
            location: '',
            first_name: '',
            last_name: '',
        });

        setSelectedUser(null);
    };

    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.last_name?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesSearch;
    });

    const getRoleBadgeColor = (role) => {
        const colors = {
            ADMIN: 'bg-purple-900/40 text-purple-300',
            MANAGER: 'bg-blue-900/40 text-blue-300',
            DEALER: 'bg-amber-900/40 text-amber-300',
            CUSTOMER: 'bg-green-900/40 text-green-300',
        };

        return colors[role] || 'bg-gray-800 text-gray-300';
    };

    const modalClass =
        'bg-[#2A211D]/95 backdrop-blur-xl border border-[#6B4F3A]/40 shadow-[0_10px_40px_rgba(0,0,0,0.45)] rounded-3xl text-gray-100';

    const inputClass =
        'w-full bg-[#1F1A17]/80 border border-[#6B4F3A]/40 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C89B6D]';

    return (
        <div className="flex min-h-screen bg-[#1E1E1B] text-gray-100">
            <AdminSidebar />

            <div
                className="flex-grow p-8 overflow-y-auto bg-cover bg-center relative"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(15,15,15,0.9), rgba(15,15,15,0.92)), url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1600&auto=format&fit=crop')",
                }}
            >
                <div className="absolute inset-0 backdrop-blur-[2px]" />

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-4xl font-bold text-[#F5E6CC]">
                                User Management
                            </h1>

                            <p className="text-gray-300 mt-2">
                                Manage all platform users
                            </p>
                        </div>

                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-[#4B352A] hover:bg-[#6B4F3A] transition-all duration-300 text-[#F5E6CC] px-6 py-3 rounded-2xl font-medium shadow-2xl"
                        >
                            + Create User
                        </button>
                    </div>

                    {/* Filters */}
                    <div
                        className="p-5 rounded-3xl mb-8 border border-[#5C4033]/40 shadow-2xl backdrop-blur-md overflow-hidden bg-cover bg-center"
                        style={{
                            backgroundImage:
                                "linear-gradient(rgba(30,20,15,0.85), rgba(30,20,15,0.9)), url('https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1600&auto=format&fit=crop')",
                        }}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={inputClass}
                            />

                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className={inputClass}
                            >
                                <option value="">All Roles</option>
                                <option value="ADMIN">Admin</option>
                                <option value="MANAGER">Manager</option>
                                <option value="DEALER">Dealer</option>
                                <option value="CUSTOMER">Customer</option>
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className={inputClass}
                            >
                                <option value="">All Status</option>
                                <option value="true">Active</option>
                                <option value="false">Suspended</option>
                            </select>
                        </div>
                    </div>

                    {/* Users Table */}
                    {loading ? (
                        <div className="text-center py-10 text-[#F5E6CC]">
                            Loading users...
                        </div>
                    ) : error ? (
                        <div className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded-2xl">
                            {error}
                        </div>
                    ) : (
                        <div
                            className="rounded-3xl border border-[#5C4033]/50 shadow-2xl overflow-hidden backdrop-blur-md bg-cover bg-center"
                            style={{
                                backgroundImage:
                                    "linear-gradient(rgba(25,20,18,0.93), rgba(25,20,18,0.93)), url('https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=1600&auto=format&fit=crop')",
                            }}
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[#3B2A24]/90 border-b border-[#6B4F3A]">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-[#E6C9A8] uppercase">
                                                User
                                            </th>

                                            <th className="px-6 py-4 text-left text-xs font-semibold text-[#E6C9A8] uppercase">
                                                Email
                                            </th>

                                            <th className="px-6 py-4 text-left text-xs font-semibold text-[#E6C9A8] uppercase">
                                                Role
                                            </th>

                                            <th className="px-6 py-4 text-left text-xs font-semibold text-[#E6C9A8] uppercase">
                                                Status
                                            </th>

                                            <th className="px-6 py-4 text-left text-xs font-semibold text-[#E6C9A8] uppercase">
                                                Last Login
                                            </th>

                                            <th className="px-6 py-4 text-left text-xs font-semibold text-[#E6C9A8] uppercase">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-[#4A3428]/60">
                                        {filteredUsers.map((user) => (
                                            <tr
                                                key={user.id}
                                                className="hover:bg-[#3A2A24]/40 transition duration-300"
                                            >
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-semibold text-[#F5E6CC]">
                                                            {user.username}
                                                        </div>

                                                        {(user.first_name ||
                                                            user.last_name) && (
                                                            <div className="text-sm text-gray-400">
                                                                {
                                                                    user.first_name
                                                                }{' '}
                                                                {
                                                                    user.last_name
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-300">
                                                    {user.email || '—'}
                                                </td>

                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <span
                                                        className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full shadow-lg ${getRoleBadgeColor(
                                                            user.role
                                                        )}`}
                                                    >
                                                        {user.role}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <span
                                                        className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full shadow-lg ${
                                                            user.is_active
                                                                ? 'bg-green-900/40 text-green-300'
                                                                : 'bg-red-900/40 text-red-300'
                                                        }`}
                                                    >
                                                        {user.is_active
                                                            ? 'Active'
                                                            : 'Suspended'}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-400">
                                                    {user.last_login
                                                        ? new Date(
                                                              user.last_login
                                                          ).toLocaleDateString()
                                                        : 'Never'}
                                                </td>

                                                <td className="px-6 py-5 whitespace-nowrap text-sm font-medium space-x-3">
                                                    <button
                                                        onClick={() =>
                                                            openEditModal(user)
                                                        }
                                                        className="text-blue-300 hover:text-blue-200 transition"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            handleToggleActive(
                                                                user.id
                                                            )
                                                        }
                                                        className="text-yellow-300 hover:text-yellow-200 transition"
                                                    >
                                                        {user.is_active
                                                            ? 'Suspend'
                                                            : 'Activate'}
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            openPasswordModal(
                                                                user
                                                            )
                                                        }
                                                        className="text-purple-300 hover:text-purple-200 transition"
                                                    >
                                                        Reset PW
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            handleDeleteUser(
                                                                user.id
                                                            )
                                                        }
                                                        className="text-red-300 hover:text-red-200 transition"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {filteredUsers.length === 0 && (
                                <div className="text-center py-10 text-gray-400">
                                    No users found
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className={`${modalClass} p-6 w-full max-w-md`}>
                            <h2 className="text-2xl font-bold mb-6 text-[#F5E6CC]">
                                Create New User
                            </h2>

                            <form
                                onSubmit={handleCreateUser}
                                className="space-y-4"
                            >
                                <input
                                    type="text"
                                    placeholder="Username"
                                    required
                                    value={formData.username}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            username: e.target.value,
                                        })
                                    }
                                    className={inputClass}
                                />

                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            email: e.target.value,
                                        })
                                    }
                                    className={inputClass}
                                />

                                <input
                                    type="password"
                                    placeholder="Password"
                                    required
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            password: e.target.value,
                                        })
                                    }
                                    className={inputClass}
                                />

                                <select
                                    value={formData.role}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            role: e.target.value,
                                        })
                                    }
                                    className={inputClass}
                                >
                                    <option value="CUSTOMER">
                                        Customer
                                    </option>
                                    <option value="DEALER">Dealer</option>
                                    <option value="MANAGER">Manager</option>
                                    <option value="ADMIN">Admin</option>
                                </select>

                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        placeholder="First Name"
                                        value={formData.first_name}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                first_name: e.target.value,
                                            })
                                        }
                                        className={inputClass}
                                    />

                                    <input
                                        type="text"
                                        placeholder="Last Name"
                                        value={formData.last_name}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                last_name: e.target.value,
                                            })
                                        }
                                        className={inputClass}
                                    />
                                </div>

                                <input
                                    type="text"
                                    placeholder="Phone"
                                    value={formData.phone_number}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            phone_number: e.target.value,
                                        })
                                    }
                                    className={inputClass}
                                />

                                <input
                                    type="text"
                                    placeholder="Location"
                                    value={formData.location}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            location: e.target.value,
                                        })
                                    }
                                    className={inputClass}
                                />

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            resetForm();
                                        }}
                                        className="flex-1 border border-[#6B4F3A] text-gray-300 px-4 py-3 rounded-xl hover:bg-[#3A2A24]"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 bg-[#6B4F3A] hover:bg-[#8A654A] text-[#F5E6CC] px-4 py-3 rounded-xl"
                                    >
                                        {submitting
                                            ? 'Creating...'
                                            : 'Create User'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {showEditModal && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className={`${modalClass} p-6 w-full max-w-md`}>
                            <h2 className="text-2xl font-bold mb-6 text-[#F5E6CC]">
                                Edit User
                            </h2>

                            <form
                                onSubmit={handleUpdateUser}
                                className="space-y-4"
                            >
                                <input
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            username: e.target.value,
                                        })
                                    }
                                    className={inputClass}
                                />

                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            email: e.target.value,
                                        })
                                    }
                                    className={inputClass}
                                />

                                <select
                                    value={formData.role}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            role: e.target.value,
                                        })
                                    }
                                    className={inputClass}
                                >
                                    <option value="CUSTOMER">
                                        Customer
                                    </option>
                                    <option value="DEALER">Dealer</option>
                                    <option value="MANAGER">Manager</option>
                                    <option value="ADMIN">Admin</option>
                                </select>

                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                first_name: e.target.value,
                                            })
                                        }
                                        className={inputClass}
                                    />

                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                last_name: e.target.value,
                                            })
                                        }
                                        className={inputClass}
                                    />
                                </div>

                                <input
                                    type="text"
                                    value={formData.phone_number}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            phone_number: e.target.value,
                                        })
                                    }
                                    className={inputClass}
                                />

                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            location: e.target.value,
                                        })
                                    }
                                    className={inputClass}
                                />

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowEditModal(false);
                                            resetForm();
                                        }}
                                        className="flex-1 border border-[#6B4F3A] text-gray-300 px-4 py-3 rounded-xl hover:bg-[#3A2A24]"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 bg-blue-700 hover:bg-blue-600 text-white px-4 py-3 rounded-xl"
                                    >
                                        {submitting
                                            ? 'Updating...'
                                            : 'Update User'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Password Modal */}
                {showPasswordModal && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className={`${modalClass} p-6 w-full max-w-md`}>
                            <h2 className="text-2xl font-bold mb-4 text-[#F5E6CC]">
                                Reset Password
                            </h2>

                            <p className="text-gray-300 mb-4">
                                Reset password for:{' '}
                                <strong>{selectedUser?.username}</strong>
                            </p>

                            <form
                                onSubmit={handleResetPassword}
                                className="space-y-4"
                            >
                                <input
                                    type="password"
                                    required
                                    placeholder="New Password"
                                    value={newPassword}
                                    onChange={(e) =>
                                        setNewPassword(e.target.value)
                                    }
                                    className={inputClass}
                                />

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowPasswordModal(false);
                                            setSelectedUser(null);
                                            setNewPassword('');
                                        }}
                                        className="flex-1 border border-[#6B4F3A] text-gray-300 px-4 py-3 rounded-xl hover:bg-[#3A2A24]"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 bg-purple-700 hover:bg-purple-600 text-white px-4 py-3 rounded-xl"
                                    >
                                        {submitting
                                            ? 'Resetting...'
                                            : 'Reset Password'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;