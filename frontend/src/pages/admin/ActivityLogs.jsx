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

    const filteredActivities = activities.filter(activity => {
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
            user_registered: 'bg-blue-50 border-blue-200',
            batch_created: 'bg-amber-50 border-amber-200',
            order_placed: 'bg-green-50 border-green-200',
        };
        return colors[type] || 'bg-gray-50 border-gray-200';
    };

    return (
        <div className="flex">
            <AdminSidebar />
            <div className="flex-grow p-8 bg-gray-50 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Activity Logs</h1>
                        <p className="text-gray-600 mt-1">System-wide activity audit trail</p>
                    </div>
                    <button
                        onClick={fetchLogs}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium"
                    >
                        🔄 Refresh
                    </button>
                </div>

                {/* Filter */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <option value="">All Activities</option>
                        <option value="user_registered">User Registrations</option>
                        <option value="batch_created">Batch Created</option>
                        <option value="order_placed">Orders Placed</option>
                    </select>
                </div>

                {/* Activity Timeline */}
                {loading ? (
                    <div className="text-center py-10">Loading activity logs...</div>
                ) : (
                    <div className="space-y-4">
                        {filteredActivities.map((activity, index) => (
                            <div
                                key={index}
                                className={`bg-white p-5 rounded-xl border shadow-sm ${getActivityColor(activity.type)}`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="text-3xl">{getActivityIcon(activity.type)}</div>
                                    <div className="flex-grow">
                                        <p className="text-gray-800 font-medium">{activity.description}</p>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                            <span>👤 {activity.user}</span>
                                            <span>•</span>
                                            <span>{activity.user_role}</span>
                                            <span>•</span>
                                            <span>{new Date(activity.timestamp).toLocaleString()}</span>
                                            {activity.status && (
                                                <>
                                                    <span>•</span>
                                                    <span className="font-semibold">{activity.status}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredActivities.length === 0 && (
                            <div className="text-center py-10 text-gray-500">
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
