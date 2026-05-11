import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/dashboard/AdminSidebar';
import { getActivityLogs } from '../../api/adminApi';

const ActivityLogs = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);

            const data = await getActivityLogs();

            setActivities(data);
        } catch (err) {
            console.error('Failed to fetch activity logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredActivities = activities.filter((activity) => {
        if (!filter) return true;

        return activity.type === filter;
    });

    const getActivityIcon = (type) => {
        const icons = {
            user_registered: '👤',
            batch_created: '☕',
            order_placed: '📦',
        };

        return icons[type] || '📋';
    };

    const getActivityColor = (type) => {
        const colors = {
            user_registered:
                'bg-[#1f3328]/80 border-[#4f6f52]/30',
            batch_created:
                'bg-[#3b2b20]/80 border-[#6f4e37]/30',
            order_placed:
                'bg-[#24392d]/80 border-[#7a9d76]/30',
        };

        return colors[type] || 'bg-[#1b1f1c]/80 border-gray-700';
    };

    return (
        <div className="flex min-h-screen bg-[#0f1f17] text-white">
            <AdminSidebar />

            <div className="flex-grow p-8 overflow-y-auto bg-gradient-to-br from-[#0f1f17] via-[#1b2d24] to-[#2d241c]">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white">
                            Activity Logs
                        </h1>

                        <p className="text-gray-300 mt-2">
                            System-wide activity audit trail
                        </p>
                    </div>

                    <button
                        onClick={fetchLogs}
                        className="bg-[#4f6f52] hover:bg-[#5f8762] transition-all duration-300 text-white px-6 py-3 rounded-2xl shadow-2xl border border-[#7a9d76]/30"
                    >
                        🔄 Refresh
                    </button>
                </div>

                {/* FILTER CARD */}
                <div
                    className="rounded-3xl overflow-hidden border border-[#4f6f52]/20 shadow-2xl mb-8"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(15,31,23,0.90), rgba(15,31,23,0.90)), url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200&auto=format&fit=crop')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <div className="p-6 backdrop-blur-md">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-[#1f3328]/80 border border-[#4f6f52]/30 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7a9d76]"
                        >
                            <option className="text-black" value="">
                                All Activities
                            </option>

                            <option
                                className="text-black"
                                value="user_registered"
                            >
                                User Registrations
                            </option>

                            <option
                                className="text-black"
                                value="batch_created"
                            >
                                Batch Created
                            </option>

                            <option
                                className="text-black"
                                value="order_placed"
                            >
                                Orders Placed
                            </option>
                        </select>
                    </div>
                </div>

                {/* TIMELINE */}
                {loading ? (
                    <div className="text-center py-16 text-gray-300">
                        Loading activity logs...
                    </div>
                ) : (
                    <div className="space-y-6">

                        {filteredActivities.map((activity, index) => (
                            <div
                                key={index}
                                className={`rounded-3xl overflow-hidden border shadow-2xl transition-all duration-300 hover:scale-[1.01] ${getActivityColor(
                                    activity.type
                                )}`}
                                style={{
                                    backgroundImage:
                                        "linear-gradient(rgba(15,31,23,0.92), rgba(15,31,23,0.92)), url('https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1200&auto=format&fit=crop')",
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}
                            >
                                <div className="p-6 backdrop-blur-md">

                                    <div className="flex items-start gap-5">

                                        {/* ICON */}
                                        <div className="w-16 h-16 rounded-2xl bg-[#4f6f52]/30 border border-[#7a9d76]/20 flex items-center justify-center text-3xl shadow-xl">
                                            {getActivityIcon(activity.type)}
                                        </div>

                                        {/* CONTENT */}
                                        <div className="flex-grow">

                                            <p className="text-lg font-semibold text-white leading-relaxed">
                                                {activity.description}
                                            </p>

                                            <div className="flex flex-wrap items-center gap-3 mt-4 text-sm text-gray-300">

                                                <span className="bg-[#1f3328]/70 px-3 py-1 rounded-full border border-[#4f6f52]/20">
                                                    👤 {activity.user}
                                                </span>

                                                <span className="bg-[#3b2b20]/70 px-3 py-1 rounded-full border border-[#6f4e37]/20 text-[#f5d28e]">
                                                    {activity.user_role}
                                                </span>

                                                <span className="bg-[#24392d]/70 px-3 py-1 rounded-full border border-[#7a9d76]/20">
                                                    {new Date(
                                                        activity.timestamp
                                                    ).toLocaleString()}
                                                </span>

                                                {activity.status && (
                                                    <span className="bg-[#4f6f52]/60 px-3 py-1 rounded-full border border-[#7a9d76]/20 text-[#d6f5d2] font-semibold">
                                                        {activity.status}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredActivities.length === 0 && (
                            <div className="text-center py-16 text-gray-400">
                                No activity logs found
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityLogs;