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
            <div className="flex min-h-screen bg-[#0f1f17] text-white">
                <AdminSidebar />

                <div className="flex-grow flex items-center justify-center bg-gradient-to-br from-[#0f1f17] via-[#1b2d24] to-[#2d241c]">
                    <div className="text-gray-300 text-lg">
                        Loading reports...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#0f1f17] text-white">
            <AdminSidebar />

            <div className="flex-grow p-8 overflow-y-auto bg-gradient-to-br from-[#0f1f17] via-[#1b2d24] to-[#2d241c]">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white">
                        Reports & Analytics
                    </h1>

                    <p className="text-gray-300 mt-2">
                        Platform insights and performance metrics
                    </p>
                </div>

                {/* USERS BY ROLE */}
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
                        <h3 className="text-2xl font-semibold text-white mb-6">
                            Users by Role Distribution
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {reports?.users_by_role?.map((item) => (
                                <div
                                    key={item.role}
                                    className="bg-[#1f3328]/70 border border-[#4f6f52]/20 rounded-2xl p-6 text-center shadow-xl hover:scale-105 transition-all duration-300"
                                >
                                    <p className="text-4xl font-bold text-[#b7d3b0]">
                                        {item.count}
                                    </p>

                                    <p className="text-sm text-gray-300 mt-3 uppercase tracking-wide">
                                        {item.role}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* BATCH STATUS */}
                <div
                    className="rounded-3xl overflow-hidden border border-[#4f6f52]/20 shadow-2xl mb-8"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(20,35,28,0.92), rgba(20,35,28,0.92)), url('https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1200&auto=format&fit=crop')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <div className="p-6 backdrop-blur-md">
                        <h3 className="text-2xl font-semibold text-white mb-6">
                            Batch Status Distribution
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {reports?.batches_by_status?.map((item) => (
                                <div
                                    key={item.status}
                                    className="bg-[#1f3328]/70 border border-[#4f6f52]/20 rounded-2xl p-6 text-center shadow-xl hover:scale-105 transition-all duration-300"
                                >
                                    <p className="text-4xl font-bold text-[#f5d28e]">
                                        {item.count}
                                    </p>

                                    <p className="text-sm text-gray-300 mt-3 uppercase tracking-wide">
                                        {item.status}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* COFFEE TYPES */}
                <div
                    className="rounded-3xl overflow-hidden border border-[#4f6f52]/20 shadow-2xl mb-8"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(15,31,23,0.90), rgba(15,31,23,0.90)), url('https://images.unsplash.com/photo-1515442261605-65987783cb6a?q=80&w=1200&auto=format&fit=crop')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <div className="p-6 backdrop-blur-md">
                        <h3 className="text-2xl font-semibold text-white mb-6">
                            Coffee Types (Approved Batches)
                        </h3>

                        <div className="space-y-4">
                            {reports?.coffee_by_type?.map((item) => (
                                <div
                                    key={item.coffee_type}
                                    className="flex items-center justify-between bg-[#1f3328]/70 border border-[#4f6f52]/20 rounded-2xl p-5 shadow-xl hover:bg-[#4f6f52]/10 transition-all duration-300"
                                >
                                    <div>
                                        <p className="text-lg font-semibold text-white">
                                            {item.coffee_type}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-[#f5d28e] font-bold">
                                            {item.count} batches
                                        </p>

                                        <p className="text-sm text-gray-300">
                                            {item.total_kg} kg
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* TOP DEALERS */}
                <div
                    className="rounded-3xl overflow-hidden border border-[#4f6f52]/20 shadow-2xl mb-8"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(20,35,28,0.92), rgba(20,35,28,0.92)), url('https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1200&auto=format&fit=crop')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <div className="p-6 backdrop-blur-md">
                        <h3 className="text-2xl font-semibold text-white mb-6">
                            Top 10 Dealers by Batch Count
                        </h3>

                        <div className="space-y-4">
                            {reports?.top_dealers?.map((dealer, index) => (
                                <div
                                    key={dealer.dealer__id}
                                    className="flex items-center justify-between bg-[#1f3328]/70 border border-[#4f6f52]/20 rounded-2xl p-5 shadow-xl hover:bg-[#4f6f52]/10 transition-all duration-300"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-[#4f6f52]/40 flex items-center justify-center text-[#b7d3b0] font-bold text-lg">
                                            #{index + 1}
                                        </div>

                                        <div>
                                            <p className="font-semibold text-white text-lg">
                                                {dealer.dealer__username}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="font-bold text-[#f5d28e]">
                                            {dealer.batch_count} batches
                                        </p>

                                        <p className="text-sm text-gray-300">
                                            {dealer.total_kg} kg
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* TOP CUSTOMERS */}
                <div
                    className="rounded-3xl overflow-hidden border border-[#4f6f52]/20 shadow-2xl"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(15,31,23,0.90), rgba(15,31,23,0.90)), url('https://images.unsplash.com/photo-1459755486867-b55449bb39ff?q=80&w=1200&auto=format&fit=crop')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <div className="p-6 backdrop-blur-md">
                        <h3 className="text-2xl font-semibold text-white mb-6">
                            Top 10 Customers by Order Count
                        </h3>

                        <div className="space-y-4">
                            {reports?.top_customers?.map((customer, index) => (
                                <div
                                    key={customer.customer__id}
                                    className="flex items-center justify-between bg-[#1f3328]/70 border border-[#4f6f52]/20 rounded-2xl p-5 shadow-xl hover:bg-[#4f6f52]/10 transition-all duration-300"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-[#6f4e37]/40 flex items-center justify-center text-[#f5d28e] font-bold text-lg">
                                            #{index + 1}
                                        </div>

                                        <div>
                                            <p className="font-semibold text-white text-lg">
                                                {customer.customer__username}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="font-bold text-[#b7d3b0]">
                                            {customer.order_count} orders
                                        </p>

                                        <p className="text-sm text-gray-300">
                                            {customer.total_kg} kg
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Reports;