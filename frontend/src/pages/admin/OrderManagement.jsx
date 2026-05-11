import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/dashboard/AdminSidebar';
import axios from '../../api/axios';

const OrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);

            const response = await axios.get('/orders/?page_size=100');

            const data = response.data?.results || response.data || [];

            setOrders(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter((order) => {
        if (!statusFilter) return true;
        return order.status === statusFilter;
    });

    const getStatusColor = (status) => {
        const colors = {
            PENDING: 'bg-[#7b5e3b]/30 text-[#f5d28e]',
            CONFIRMED: 'bg-[#4f6f52]/30 text-[#b7d3b0]',
            SHIPPED: 'bg-[#5d4a7d]/30 text-[#d2c0ff]',
            DELIVERED: 'bg-[#3f5c45]/30 text-[#c7f0c2]',
            CANCELLED: 'bg-red-900/30 text-red-300',
        };

        return colors[status] || 'bg-gray-700/30 text-gray-300';
    };

    return (
        <div className="flex min-h-screen bg-[#0f1f17] text-gray-100">
            <AdminSidebar />

            <div className="flex-grow p-8 overflow-y-auto bg-gradient-to-br from-[#0f1f17] via-[#1b2d24] to-[#2d241c]">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white">
                        Order Management
                    </h1>

                    <p className="text-gray-300 mt-2">
                        Monitor all orders in the system
                    </p>
                </div>

                {/* Filter */}
                <div
                    className="rounded-3xl overflow-hidden border border-[#4f6f52]/20 shadow-2xl mb-8"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(15,31,23,0.88), rgba(15,31,23,0.88)), url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200&auto=format&fit=crop')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <div className="p-6 backdrop-blur-md">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-[#1f3328]/80 border border-[#4f6f52]/30 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7a9d76]"
                        >
                            <option className="text-black" value="">
                                All Status
                            </option>

                            <option className="text-black" value="PENDING">
                                Pending
                            </option>

                            <option className="text-black" value="CONFIRMED">
                                Confirmed
                            </option>

                            <option className="text-black" value="SHIPPED">
                                Shipped
                            </option>

                            <option className="text-black" value="DELIVERED">
                                Delivered
                            </option>

                            <option className="text-black" value="CANCELLED">
                                Cancelled
                            </option>
                        </select>
                    </div>
                </div>

                {/* Orders */}
                {loading ? (
                    <div className="text-center py-10 text-gray-300">
                        Loading orders...
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredOrders.map((order) => (
                            <div
                                key={order.id}
                                className="rounded-3xl overflow-hidden border border-[#4f6f52]/20 shadow-2xl transition-all duration-300 hover:scale-[1.01]"
                                style={{
                                    backgroundImage:
                                        "linear-gradient(rgba(20,35,28,0.92), rgba(20,35,28,0.92)), url('https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1200&auto=format&fit=crop')",
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}
                            >
                                <div className="p-6 backdrop-blur-md">

                                    {/* Top */}
                                    <div className="flex items-start justify-between mb-5">
                                        <div>
                                            <h3 className="text-2xl font-bold text-white">
                                                Order #{order.id}
                                            </h3>

                                            <span
                                                className={`inline-block mt-3 px-4 py-1 rounded-full text-xs font-semibold shadow-lg ${getStatusColor(
                                                    order.status
                                                )}`}
                                            >
                                                {order.status}
                                            </span>
                                        </div>

                                        <div className="text-4xl">
                                            📦
                                        </div>
                                    </div>

                                    {/* Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

                                        <div className="bg-[#1f3328]/60 border border-[#4f6f52]/20 rounded-2xl p-4 shadow-lg">
                                            <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                                                Customer
                                            </p>

                                            <p className="text-white font-semibold">
                                                {order.customer_name || 'Unknown'}
                                            </p>
                                        </div>

                                        <div className="bg-[#1f3328]/60 border border-[#4f6f52]/20 rounded-2xl p-4 shadow-lg">
                                            <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                                                Quantity
                                            </p>

                                            <p className="text-white font-semibold">
                                                {order.quantity_kg} kg
                                            </p>
                                        </div>

                                        <div className="bg-[#1f3328]/60 border border-[#4f6f52]/20 rounded-2xl p-4 shadow-lg">
                                            <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                                                Batch
                                            </p>

                                            <p className="text-white font-semibold">
                                                #
                                                {order.batch_id_short ||
                                                    order.batch}
                                            </p>
                                        </div>

                                        <div className="bg-[#1f3328]/60 border border-[#4f6f52]/20 rounded-2xl p-4 shadow-lg">
                                            <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                                                Created
                                            </p>

                                            <p className="text-white font-semibold">
                                                {new Date(
                                                    order.created_at
                                                ).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Address */}
                                    {order.delivery_address && (
                                        <div className="mt-5 bg-[#6f4e37]/20 border border-[#6f4e37]/30 text-[#f5d28e] px-4 py-3 rounded-2xl shadow-lg">
                                            📍 {order.delivery_address}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {filteredOrders.length === 0 && !loading && (
                    <div className="text-center py-16 text-gray-400">
                        No orders found
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderManagement;