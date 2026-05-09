import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/dashboard/AdminSidebar';
import { getAdminReports } from '../../api/adminApi';

const Reports = () => {
    const [reports, setReports] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const data = await getAdminReports();
            setReports(data);
        } catch (err) {
            console.error('Failed to fetch reports:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex">
                <AdminSidebar />
                <div className="flex-grow p-8 bg-gray-50 flex items-center justify-center">
                    <div className="text-gray-500">Loading reports...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex">
            <AdminSidebar />
            <div className="flex-grow p-8 bg-gray-50 overflow-y-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Reports & Analytics</h1>
                    <p className="text-gray-600 mt-1">Platform insights and performance metrics</p>
                </div>

                {/* Users by Role */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Users by Role Distribution</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {reports?.users_by_role?.map((item) => (
                            <div key={item.role} className="text-center p-4 bg-gray-50 rounded-lg">
                                <p className="text-2xl font-bold text-gray-800">{item.count}</p>
                                <p className="text-sm text-gray-600 mt-1">{item.role}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Batches by Status */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Batch Status Distribution</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {reports?.batches_by_status?.map((item) => (
                            <div key={item.status} className="text-center p-4 bg-gray-50 rounded-lg">
                                <p className="text-2xl font-bold text-gray-800">{item.count}</p>
                                <p className="text-sm text-gray-600 mt-1">{item.status}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Coffee Types */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Coffee Types (Approved Batches)</h3>
                    <div className="space-y-3">
                        {reports?.coffee_by_type?.map((item) => (
                            <div key={item.coffee_type} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                                <span className="font-medium text-gray-800">{item.coffee_type}</span>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">{item.count} batches</p>
                                    <p className="text-xs text-gray-500">{item.total_kg} kg</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Dealers */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 10 Dealers by Batch Count</h3>
                    <div className="space-y-2">
                        {reports?.top_dealers?.map((dealer, index) => (
                            <div key={dealer.dealer__id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                                    <span className="font-medium text-gray-800">{dealer.dealer__username}</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-800">{dealer.batch_count} batches</p>
                                    <p className="text-xs text-gray-500">{dealer.total_kg} kg</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Customers */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 10 Customers by Order Count</h3>
                    <div className="space-y-2">
                        {reports?.top_customers?.map((customer, index) => (
                            <div key={customer.customer__id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                                    <span className="font-medium text-gray-800">{customer.customer__username}</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-800">{customer.order_count} orders</p>
                                    <p className="text-xs text-gray-500">{customer.total_kg} kg</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
