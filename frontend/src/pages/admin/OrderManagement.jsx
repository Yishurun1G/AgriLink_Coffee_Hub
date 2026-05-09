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

    const filteredOrders = orders.filter(order => {
        if (!statusFilter) return true;
        return order.status === statusFilter;
    });

    const getStatusColor = (status) => {
        const colors = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            CONFIRMED: 'bg-blue-100 text-blue-800',
            SHIPPED: 'bg-purple-100 text-purple-800',
            DELIVERED: 'bg-green-100 text-green-800',
            CANCELLED: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="flex">
            <AdminSidebar />
            <div className="flex-grow p-8 bg-gray-50 overflow-y-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Order Management</h1>
                    <p className="text-gray-600 mt-1">Monitor all orders in the system</p>
                </div>

                {/* Filter */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <option value="">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>

                {/* Orders List */}
                {loading ? (
                    <div className="text-center py-10">Loading orders...</div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map((order) => (
                            <div key={order.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">Order #{order.id}</h3>
                                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <span className="text-2xl">📦</span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-medium">Customer</p>
                                        <p className="font-medium text-gray-800">{order.customer_name || 'Unknown'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-medium">Quantity</p>
                                        <p className="font-medium text-gray-800">{order.quantity_kg} kg</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-medium">Batch</p>
                                        <p className="font-medium text-gray-800">#{order.batch_id_short || order.batch}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-medium">Created</p>
                                        <p className="font-medium text-gray-800">{new Date(order.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                {order.delivery_address && (
                                    <div className="mt-3 text-sm text-amber-800 bg-amber-50 px-3 py-2 rounded-lg">
                                        📍 {order.delivery_address}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {filteredOrders.length === 0 && !loading && (
                    <div className="text-center py-10 text-gray-500">
                        No orders found
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderManagement;
