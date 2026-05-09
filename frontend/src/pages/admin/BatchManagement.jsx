import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/dashboard/AdminSidebar';
import axios from '../../api/axios';

const BatchManagement = () => {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchBatches();
    }, []);

    const fetchBatches = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/batches/?page_size=100');
            const data = response.data?.results || response.data || [];
            setBatches(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch batches:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredBatches = batches.filter(batch => {
        if (!statusFilter) return true;
        return batch.status === statusFilter;
    });

    const getStatusColor = (status) => {
        const colors = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            APPROVED: 'bg-green-100 text-green-800',
            REJECTED: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="flex">
            <AdminSidebar />
            <div className="flex-grow p-8 bg-gray-50 overflow-y-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Coffee Batch Management</h1>
                    <p className="text-gray-600 mt-1">Monitor all coffee batches in the system</p>
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
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                </div>

                {/* Batches Grid */}
                {loading ? (
                    <div className="text-center py-10">Loading batches...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredBatches.map((batch) => (
                            <div key={batch.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                <div className="flex items-start justify-between mb-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(batch.status)}`}>
                                        {batch.status}
                                    </span>
                                    <span className="text-2xl">☕</span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-2">{batch.coffee_type}</h3>
                                <div className="space-y-2 text-sm text-gray-600">
                                    <p><strong>Origin:</strong> {batch.origin}</p>
                                    <p><strong>Quantity:</strong> {batch.quantity_kg} kg</p>
                                    <p><strong>Dealer:</strong> {batch.dealer_name || 'Unknown'}</p>
                                    <p><strong>Harvest:</strong> {new Date(batch.harvest_date).toLocaleDateString()}</p>
                                    <p><strong>Created:</strong> {new Date(batch.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {filteredBatches.length === 0 && !loading && (
                    <div className="text-center py-10 text-gray-500">
                        No batches found
                    </div>
                )}
            </div>
        </div>
    );
};

export default BatchManagement;
