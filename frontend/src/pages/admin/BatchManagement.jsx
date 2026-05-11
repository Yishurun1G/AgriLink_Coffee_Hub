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
            PENDING: 'bg-amber-500/10 text-amber-400 border border-amber-400/30',
            APPROVED: 'bg-emerald-500/10 text-emerald-400 border border-emerald-400/30',
            REJECTED: 'bg-red-500/10 text-red-400 border border-red-400/30',
        };
        return colors[status] || 'bg-zinc-500/10 text-zinc-400 border border-zinc-400/30';
    };

    return (
        <div className="flex h-screen overflow-hidden bg-zinc-950">
            <AdminSidebar />
            
            {/* Main Content */}
            <div 
                className="flex-grow overflow-y-auto relative"
                style={{
                    backgroundImage: `linear-gradient(rgba(9, 9, 11, 0.92), rgba(9, 9, 11, 0.95)), 
                                     url('https://images.unsplash.com/photo-1495474472285-4d8a2d5f1e0e?ixlib=rb-4.0.3&auto=format&fit=crop&q=85')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed'
                }}
            >
                <div className="p-8 min-h-full">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-zinc-100 tracking-tight">Coffee Batch Management</h1>
                        <p className="text-zinc-400 mt-2 text-lg">Monitor and track all coffee batches across the platform</p>
                    </div>

                    {/* Filter */}
                    <div className="bg-zinc-900/80 backdrop-blur-xl p-5 rounded-2xl border border-zinc-700/50 shadow-xl mb-8">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all w-full md:w-auto"
                        >
                            <option value="">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>

                    {/* Batches Grid */}
                    {loading ? (
                        <div className="text-center py-20">
                            <div className="inline-flex items-center gap-3 text-zinc-400">
                                <div className="w-5 h-5 border-2 border-zinc-400 border-t-emerald-500 animate-spin rounded-full"></div>
                                Loading batches...
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredBatches.map((batch) => (
                                <div 
                                    key={batch.id} 
                                    className="group bg-zinc-900/70 backdrop-blur-xl border border-zinc-700/50 rounded-3xl p-7 hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1 shadow-2xl"
                                >
                                    <div className="flex items-start justify-between mb-5">
                                        <span className={`px-4 py-1.5 rounded-2xl text-xs font-semibold tracking-wider uppercase ${getStatusColor(batch.status)}`}>
                                            {batch.status}
                                        </span>
                                        <span className="text-4xl opacity-75 group-hover:scale-110 transition-transform">☕</span>
                                    </div>

                                    <h3 className="text-2xl font-semibold text-zinc-100 mb-4 leading-tight">
                                        {batch.coffee_type}
                                    </h3>

                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between text-zinc-400">
                                            <span>Origin</span>
                                            <span className="text-zinc-200 font-medium">{batch.origin}</span>
                                        </div>
                                        <div className="flex justify-between text-zinc-400">
                                            <span>Quantity</span>
                                            <span className="text-zinc-200 font-medium">{batch.quantity_kg} kg</span>
                                        </div>
                                        <div className="flex justify-between text-zinc-400">
                                            <span>Dealer</span>
                                            <span className="text-zinc-200 font-medium">{batch.dealer_name || 'Unknown'}</span>
                                        </div>
                                        <div className="flex justify-between text-zinc-400">
                                            <span>Harvest Date</span>
                                            <span className="text-zinc-200 font-medium">
                                                {new Date(batch.harvest_date).toLocaleDateString('en-US', { 
                                                    year: 'numeric', 
                                                    month: 'short', 
                                                    day: 'numeric' 
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-zinc-400 pt-2 border-t border-zinc-800">
                                            <span>Created</span>
                                            <span className="text-zinc-200 font-medium">
                                                {new Date(batch.created_at).toLocaleDateString('en-US', { 
                                                    year: 'numeric', 
                                                    month: 'short', 
                                                    day: 'numeric' 
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {filteredBatches.length === 0 && !loading && (
                        <div className="text-center py-20">
                            <div className="mx-auto w-20 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center mb-6">
                                ☕
                            </div>
                            <p className="text-zinc-400 text-xl">No batches found matching your criteria</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BatchManagement;