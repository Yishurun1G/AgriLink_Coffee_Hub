import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/dashboard/AdminSidebar';
import { getAdminStats } from '../../api/adminApi';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const data = await getAdminStats();
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch admin stats:', err);
            setError('Failed to load dashboard statistics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex">
                <AdminSidebar />
                <div className="flex-grow p-8 bg-gray-50 flex items-center justify-center">
                    <div className="text-gray-500">Loading dashboard...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex">
                <AdminSidebar />
                <div className="flex-grow p-8 bg-gray-50">
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex">
            <AdminSidebar />
            <div className="flex-grow p-8 bg-gray-50 overflow-y-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                    <p className="text-gray-600 mt-1">Monitor system activity and manage platform operations</p>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Users */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/admin/users')}>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-gray-500 font-medium">Total Users</p>
                            <span className="text-2xl">👥</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-800">{stats?.users?.total || 0}</p>
                        <p className="text-xs text-green-600 mt-2">+{stats?.users?.new_this_week || 0} this week</p>
                    </div>

                    {/* Total Batches */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/admin/batches')}>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-gray-500 font-medium">Coffee Batches</p>
                            <span className="text-2xl">☕</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-800">{stats?.batches?.total || 0}</p>
                        <p className="text-xs text-amber-600 mt-2">{stats?.batches?.pending || 0} pending approval</p>
                    </div>

                    {/* Total Orders */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/admin/orders')}>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-gray-500 font-medium">Total Orders</p>
                            <span className="text-2xl">📦</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-800">{stats?.orders?.total || 0}</p>
                        <p className="text-xs text-blue-600 mt-2">{stats?.orders?.delivered || 0} delivered</p>
                    </div>

                    {/* Total Coffee */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-gray-500 font-medium">Total Coffee</p>
                            <span className="text-2xl">⚖️</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-800">{stats?.coffee?.total_kg?.toFixed(0) || 0}</p>
                        <p className="text-xs text-gray-500 mt-2">kilograms</p>
                    </div>
                </div>

                {/* User Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Users by Role */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Users by Role</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-purple-600">👑</span>
                                    <span className="text-sm text-gray-600">Admins</span>
                                </div>
                                <span className="text-lg font-bold text-gray-800">{stats?.users?.admins || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-blue-600">👔</span>
                                    <span className="text-sm text-gray-600">Managers</span>
                                </div>
                                <span className="text-lg font-bold text-gray-800">{stats?.users?.managers || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-amber-600">🚚</span>
                                    <span className="text-sm text-gray-600">Dealers</span>
                                </div>
                                <span className="text-lg font-bold text-gray-800">{stats?.users?.dealers || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-green-600">🛒</span>
                                    <span className="text-sm text-gray-600">Customers</span>
                                </div>
                                <span className="text-lg font-bold text-gray-800">{stats?.users?.customers || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Batch Status */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Batch Status</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                    <span className="text-sm text-gray-600">Pending</span>
                                </div>
                                <span className="text-lg font-bold text-gray-800">{stats?.batches?.pending || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                    <span className="text-sm text-gray-600">Approved</span>
                                </div>
                                <span className="text-lg font-bold text-gray-800">{stats?.batches?.approved || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                    <span className="text-sm text-gray-600">Rejected</span>
                                </div>
                                <span className="text-lg font-bold text-gray-800">{stats?.batches?.rejected || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order Status */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Status Overview</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-yellow-600">{stats?.orders?.pending || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">Pending</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{stats?.orders?.confirmed || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">Confirmed</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">{stats?.orders?.shipped || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">Shipped</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{stats?.orders?.delivered || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">Delivered</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-red-600">{stats?.orders?.cancelled || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">Cancelled</p>
                        </div>
                    </div>
                </div>

                {/* Communication Stats */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Communication Activity</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-800">{stats?.communication?.total_threads || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">Total Threads</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-800">{stats?.communication?.total_messages || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">Total Messages</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-amber-600">{stats?.communication?.unresolved_threads || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">Unresolved</p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => navigate('/admin/users')}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                    >
                        👥 Manage Users
                    </button>
                    <button
                        onClick={() => navigate('/admin/reports')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                    >
                        📈 View Reports
                    </button>
                    <button
                        onClick={() => navigate('/admin/activity')}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                    >
                        📋 Activity Logs
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
