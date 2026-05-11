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

    const cardStyle = {
        backgroundImage:
            "linear-gradient(rgba(15,31,23,0.90), rgba(15,31,23,0.90)), url('https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1200&auto=format&fit=crop')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    };

    /* LOADING */
    if (loading) {
        return (
            <div className="flex min-h-screen bg-[#0f1f17] text-white">
                <AdminSidebar />

                <div className="flex-grow flex items-center justify-center bg-gradient-to-br from-[#0f1f17] via-[#1b2d24] to-[#2d241c]">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-[#7a9d76] border-t-transparent rounded-full animate-spin mx-auto mb-5"></div>

                        <p className="text-gray-300 text-lg">
                            Loading dashboard...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    /* ERROR */
    if (error) {
        return (
            <div className="flex min-h-screen bg-[#0f1f17] text-white">
                <AdminSidebar />

                <div className="flex-grow p-8 bg-gradient-to-br from-[#0f1f17] via-[#1b2d24] to-[#2d241c]">
                    <div className="bg-red-900/20 border border-red-500/30 text-red-300 px-6 py-5 rounded-3xl shadow-2xl">
                        {error}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#0f1f17] text-white">
            <AdminSidebar />

            <div className="flex-grow p-8 overflow-y-auto bg-gradient-to-br from-[#0f1f17] via-[#1b2d24] to-[#2d241c]">

                {/* HEADER */}
                <div
                    className="rounded-3xl overflow-hidden border border-[#4f6f52]/20 shadow-2xl mb-10"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(15,31,23,0.88), rgba(15,31,23,0.88)), url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200&auto=format&fit=crop')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <div className="p-8 backdrop-blur-md">
                        <h1 className="text-5xl font-extrabold text-white">
                            Admin Dashboard
                        </h1>

                        <p className="text-gray-300 mt-4 text-lg max-w-3xl">
                            Monitor system activity and manage coffee platform operations
                        </p>
                    </div>
                </div>

                {/* QUICK STATS */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">

                    {/* USERS */}
                    <div
                        onClick={() => navigate('/admin/users')}
                        style={cardStyle}
                        className="cursor-pointer rounded-3xl overflow-hidden border border-[#4f6f52]/20 shadow-2xl hover:scale-[1.02] transition-all duration-300"
                    >
                        <div className="p-7 backdrop-blur-md">

                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <p className="text-sm text-gray-300 uppercase tracking-wide">
                                        Total Users
                                    </p>

                                    <h2 className="text-5xl font-extrabold mt-3 text-white">
                                        {stats?.users?.total || 0}
                                    </h2>
                                </div>

                                <div className="w-16 h-16 rounded-2xl bg-[#4f6f52]/40 flex items-center justify-center text-3xl shadow-xl">
                                    👥
                                </div>
                            </div>

                            <p className="text-sm text-[#b7d3b0]">
                                +{stats?.users?.new_this_week || 0} this week
                            </p>
                        </div>
                    </div>

                    {/* BATCHES */}
                    <div
                        onClick={() => navigate('/admin/batches')}
                        style={cardStyle}
                        className="cursor-pointer rounded-3xl overflow-hidden border border-[#6f4e37]/20 shadow-2xl hover:scale-[1.02] transition-all duration-300"
                    >
                        <div className="p-7 backdrop-blur-md">

                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <p className="text-sm text-gray-300 uppercase tracking-wide">
                                        Coffee Batches
                                    </p>

                                    <h2 className="text-5xl font-extrabold mt-3 text-white">
                                        {stats?.batches?.total || 0}
                                    </h2>
                                </div>

                                <div className="w-16 h-16 rounded-2xl bg-[#6f4e37]/40 flex items-center justify-center text-3xl shadow-xl">
                                    ☕
                                </div>
                            </div>

                            <p className="text-sm text-[#f5d28e]">
                                {stats?.batches?.pending || 0} pending approval
                            </p>
                        </div>
                    </div>

                    {/* ORDERS */}
                    <div
                        onClick={() => navigate('/admin/orders')}
                        style={cardStyle}
                        className="cursor-pointer rounded-3xl overflow-hidden border border-[#5f7c69]/20 shadow-2xl hover:scale-[1.02] transition-all duration-300"
                    >
                        <div className="p-7 backdrop-blur-md">

                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <p className="text-sm text-gray-300 uppercase tracking-wide">
                                        Total Orders
                                    </p>

                                    <h2 className="text-5xl font-extrabold mt-3 text-white">
                                        {stats?.orders?.total || 0}
                                    </h2>
                                </div>

                                <div className="w-16 h-16 rounded-2xl bg-[#7a9d76]/30 flex items-center justify-center text-3xl shadow-xl">
                                    📦
                                </div>
                            </div>

                            <p className="text-sm text-[#c7f0c2]">
                                {stats?.orders?.delivered || 0} delivered
                            </p>
                        </div>
                    </div>

                    {/* COFFEE */}
                    <div
                        style={cardStyle}
                        className="rounded-3xl overflow-hidden border border-[#7a9d76]/20 shadow-2xl hover:scale-[1.02] transition-all duration-300"
                    >
                        <div className="p-7 backdrop-blur-md">

                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <p className="text-sm text-gray-300 uppercase tracking-wide">
                                        Total Coffee
                                    </p>

                                    <h2 className="text-5xl font-extrabold mt-3 text-white">
                                        {stats?.coffee?.total_kg?.toFixed(0) || 0}
                                    </h2>
                                </div>

                                <div className="w-16 h-16 rounded-2xl bg-[#4f6f52]/40 flex items-center justify-center text-3xl shadow-xl">
                                    ⚖️
                                </div>
                            </div>

                            <p className="text-sm text-gray-300">
                                kilograms
                            </p>
                        </div>
                    </div>
                </div>

                {/* SECOND GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">

                    {/* USERS BY ROLE */}
                    <div
                        style={cardStyle}
                        className="rounded-3xl overflow-hidden border border-[#4f6f52]/20 shadow-2xl"
                    >
                        <div className="p-8 backdrop-blur-md">
                            <h3 className="text-3xl font-bold text-white mb-8">
                                Users by Role
                            </h3>

                            <div className="space-y-5">

                                <div className="flex items-center justify-between bg-[#1f3328]/70 p-5 rounded-2xl border border-[#4f6f52]/20">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">👑</span>

                                        <span className="text-gray-200">
                                            Admins
                                        </span>
                                    </div>

                                    <span className="text-3xl font-bold text-white">
                                        {stats?.users?.admins || 0}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between bg-[#1f3328]/70 p-5 rounded-2xl border border-[#4f6f52]/20">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">👔</span>

                                        <span className="text-gray-200">
                                            Managers
                                        </span>
                                    </div>

                                    <span className="text-3xl font-bold text-white">
                                        {stats?.users?.managers || 0}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between bg-[#3b2b20]/70 p-5 rounded-2xl border border-[#6f4e37]/20">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">🚚</span>

                                        <span className="text-gray-200">
                                            Dealers
                                        </span>
                                    </div>

                                    <span className="text-3xl font-bold text-white">
                                        {stats?.users?.dealers || 0}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between bg-[#24392d]/70 p-5 rounded-2xl border border-[#7a9d76]/20">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">🛒</span>

                                        <span className="text-gray-200">
                                            Customers
                                        </span>
                                    </div>

                                    <span className="text-3xl font-bold text-white">
                                        {stats?.users?.customers || 0}
                                    </span>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* BATCH STATUS */}
                    <div
                        style={cardStyle}
                        className="rounded-3xl overflow-hidden border border-[#6f4e37]/20 shadow-2xl"
                    >
                        <div className="p-8 backdrop-blur-md">
                            <h3 className="text-3xl font-bold text-white mb-8">
                                Batch Status
                            </h3>

                            <div className="space-y-5">

                                <div className="flex items-center justify-between bg-[#3b2b20]/70 p-5 rounded-2xl border border-[#6f4e37]/20">
                                    <div className="flex items-center gap-3">
                                        <span className="w-4 h-4 rounded-full bg-yellow-500"></span>

                                        <span className="text-gray-200">
                                            Pending
                                        </span>
                                    </div>

                                    <span className="text-3xl font-bold text-white">
                                        {stats?.batches?.pending || 0}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between bg-[#24392d]/70 p-5 rounded-2xl border border-[#7a9d76]/20">
                                    <div className="flex items-center gap-3">
                                        <span className="w-4 h-4 rounded-full bg-green-500"></span>

                                        <span className="text-gray-200">
                                            Approved
                                        </span>
                                    </div>

                                    <span className="text-3xl font-bold text-white">
                                        {stats?.batches?.approved || 0}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between bg-[#3b2020]/70 p-5 rounded-2xl border border-red-500/20">
                                    <div className="flex items-center gap-3">
                                        <span className="w-4 h-4 rounded-full bg-red-500"></span>

                                        <span className="text-gray-200">
                                            Rejected
                                        </span>
                                    </div>

                                    <span className="text-3xl font-bold text-white">
                                        {stats?.batches?.rejected || 0}
                                    </span>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>

                {/* ORDER STATUS */}
                <div
                    style={cardStyle}
                    className="rounded-3xl overflow-hidden border border-[#4f6f52]/20 shadow-2xl mb-10"
                >
                    <div className="p-8 backdrop-blur-md">
                        <h3 className="text-3xl font-bold text-white mb-8">
                            Order Status Overview
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-5">

                            <div className="bg-[#3b2b20]/70 p-6 rounded-2xl border border-[#6f4e37]/20 text-center">
                                <p className="text-5xl font-extrabold text-[#f5d28e]">
                                    {stats?.orders?.pending || 0}
                                </p>

                                <p className="text-gray-300 mt-3">
                                    Pending
                                </p>
                            </div>

                            <div className="bg-[#24392d]/70 p-6 rounded-2xl border border-[#7a9d76]/20 text-center">
                                <p className="text-5xl font-extrabold text-blue-300">
                                    {stats?.orders?.confirmed || 0}
                                </p>

                                <p className="text-gray-300 mt-3">
                                    Confirmed
                                </p>
                            </div>

                            <div className="bg-[#2d2540]/70 p-6 rounded-2xl border border-purple-500/20 text-center">
                                <p className="text-5xl font-extrabold text-purple-300">
                                    {stats?.orders?.shipped || 0}
                                </p>

                                <p className="text-gray-300 mt-3">
                                    Shipped
                                </p>
                            </div>

                            <div className="bg-[#24392d]/70 p-6 rounded-2xl border border-[#7a9d76]/20 text-center">
                                <p className="text-5xl font-extrabold text-[#c7f0c2]">
                                    {stats?.orders?.delivered || 0}
                                </p>

                                <p className="text-gray-300 mt-3">
                                    Delivered
                                </p>
                            </div>

                            <div className="bg-[#3b2020]/70 p-6 rounded-2xl border border-red-500/20 text-center">
                                <p className="text-5xl font-extrabold text-red-300">
                                    {stats?.orders?.cancelled || 0}
                                </p>

                                <p className="text-gray-300 mt-3">
                                    Cancelled
                                </p>
                            </div>

                        </div>
                    </div>
                </div>

                {/* COMMUNICATION */}
                <div
                    style={cardStyle}
                    className="rounded-3xl overflow-hidden border border-[#4f6f52]/20 shadow-2xl mb-10"
                >
                    <div className="p-8 backdrop-blur-md">
                        <h3 className="text-3xl font-bold text-white mb-8">
                            Communication Activity
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                            <div className="bg-[#1f3328]/70 p-6 rounded-2xl border border-[#4f6f52]/20">
                                <p className="text-gray-300 mb-3">
                                    Total Threads
                                </p>

                                <p className="text-5xl font-extrabold text-white">
                                    {stats?.communication?.total_threads || 0}
                                </p>
                            </div>

                            <div className="bg-[#24392d]/70 p-6 rounded-2xl border border-[#7a9d76]/20">
                                <p className="text-gray-300 mb-3">
                                    Total Messages
                                </p>

                                <p className="text-5xl font-extrabold text-white">
                                    {stats?.communication?.total_messages || 0}
                                </p>
                            </div>

                            <div className="bg-[#3b2b20]/70 p-6 rounded-2xl border border-[#6f4e37]/20">
                                <p className="text-gray-300 mb-3">
                                    Unresolved
                                </p>

                                <p className="text-5xl font-extrabold text-[#f5d28e]">
                                    {stats?.communication?.unresolved_threads || 0}
                                </p>
                            </div>

                        </div>
                    </div>
                </div>

                {/* QUICK ACTIONS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    <button
                        onClick={() => navigate('/admin/users')}
                        className="bg-gradient-to-r from-[#4f6f52] to-[#5f8762] hover:scale-[1.02] text-white px-6 py-5 rounded-3xl font-bold text-lg shadow-2xl transition-all duration-300"
                    >
                        👥 Manage Users
                    </button>

                    <button
                        onClick={() => navigate('/admin/reports')}
                        className="bg-gradient-to-r from-[#6f4e37] to-[#8a6245] hover:scale-[1.02] text-white px-6 py-5 rounded-3xl font-bold text-lg shadow-2xl transition-all duration-300"
                    >
                        📈 View Reports
                    </button>

                    <button
                        onClick={() => navigate('/admin/activity')}
                        className="bg-gradient-to-r from-[#355c46] to-[#4f6f52] hover:scale-[1.02] text-white px-6 py-5 rounded-3xl font-bold text-lg shadow-2xl transition-all duration-300"
                    >
                        📋 Activity Logs
                    </button>

                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;