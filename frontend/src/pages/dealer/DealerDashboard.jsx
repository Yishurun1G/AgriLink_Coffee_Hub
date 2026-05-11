import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from '../../api/axios';
import CreateBatchForm from '../../components/batches/CreateBatchForm';
import BatchCard from '../../components/common/BatchCard';
import { useNavigate } from 'react-router-dom';

const DealerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [batches, setBatches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchMyBatches = async () => {
    try {
      const res = await axios.get('/batches/my_batches/');
      const data = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];

      setBatches(data);
    } catch (err) {
      console.error('Failed to fetch batches:', err);
      setBatches([]);
    }
  };

  const fetchIncomingOrders = async () => {
    try {
      const res = await axios.get('/orders/');
      const data = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];

      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setOrders([]);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      await Promise.all([
        fetchMyBatches(),
        fetchIncomingOrders(),
      ]);

      setLoading(false);
    };

    load();
  }, []);

  const handleBatchCreated = () => {
    fetchMyBatches();
    setShowCreateForm(false);
  };

  return (
    <div className="min-h-screen py-8 bg-gradient-to-br from-[#191511] via-[#221b15] to-[#1c2a20] relative overflow-hidden">

      {/* Main Background */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1461988320302-91bde64fc8e4?q=80&w=1800&auto=format&fit=crop')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(2px)',
        }}
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">

        {/* ── Quick-action buttons ── */}
        <div className="mb-6 flex gap-3 flex-wrap">
          <button
            onClick={() => navigate('/chat')}
            className="bg-[#355c3a] hover:bg-[#44724a] text-white px-5 py-3 rounded-2xl font-medium shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition-all duration-300"
          >
            💬 Open Chat
          </button>

          <button
            onClick={() => navigate('/dealer/tracking')}
            className="bg-[#6b4b36] hover:bg-[#7d5b45] text-white px-5 py-3 rounded-2xl font-medium shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition-all duration-300"
          >
            🚚 My Deliveries
          </button>
        </div>

        {/* ── Header ── */}
        <div className="flex justify-between items-center mb-10 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white drop-shadow-xl">
              ☕ Welcome, {user?.first_name || user?.username || 'Dealer'}
            </h1>

            <p className="text-[#d2c2b1] mt-2 text-lg">
              Manage your coffee batches & incoming orders
            </p>
          </div>

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-[#355c3a] hover:bg-[#44724a] text-white px-7 py-3 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.45)] transition-all duration-300"
          >
            {showCreateForm ? 'Cancel' : '+ Add Batch'}
          </button>
        </div>

        {/* ── Create form ── */}
        {showCreateForm && (
          <div
            className="mb-10 rounded-[28px] border border-[#5d4a3a] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur-md overflow-hidden"
            style={{
              backgroundImage: `
                linear-gradient(rgba(28,22,18,0.90), rgba(28,22,18,0.94)),
                url('https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=1400&auto=format&fit=crop')
              `,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <CreateBatchForm onBatchCreated={handleBatchCreated} />
          </div>
        )}

        {/* ── Orders ── */}
        <div className="mb-5">
          <h2 className="text-3xl font-bold text-white">
            📦 Incoming Orders
          </h2>

          <p className="text-[#c7b6a5] mt-1">
            {orders.length} active incoming orders
          </p>
        </div>

        {loading ? (
          <p className="text-[#d0c0af]">Loading orders...</p>
        ) : orders.length === 0 ? (
          <div className="bg-[#2a231d]/90 border border-[#5d4a3a] p-10 rounded-[28px] text-center text-[#d4c4b3] shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-md">
            No incoming orders
          </div>
        ) : (
          <div className="space-y-5 mb-14">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-[28px] border border-[#5a4b3d] p-6 shadow-[0_20px_45px_rgba(0,0,0,0.45)] backdrop-blur-md overflow-hidden relative transition-all duration-300 hover:scale-[1.01]"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(25,20,16,0.88), rgba(25,20,16,0.92)),
                    url('https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=1400&auto=format&fit=crop')
                  `,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="relative z-10 text-[#f4eee6] space-y-3">
                  <p>
                    <strong className="text-[#d8c6b4]">Order:</strong>{' '}
                    #{order.id}
                  </p>

                  <p>
                    <strong className="text-[#d8c6b4]">Customer:</strong>{' '}
                    {order.customer_name || 'N/A'}
                  </p>

                  <p>
                    <strong className="text-[#d8c6b4]">Batch:</strong>{' '}
                    {order.batch_id_short || order.batch}
                  </p>

                  <p>
                    <strong className="text-[#d8c6b4]">Quantity:</strong>{' '}
                    {order.quantity_kg} kg
                  </p>

                  <p>
                    <strong className="text-[#d8c6b4]">Status:</strong>{' '}
                    <span className="text-green-300 font-semibold">
                      {order.status}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Batches ── */}
        <div className="mb-5">
          <h2 className="text-3xl font-bold text-white">
            🌱 My Coffee Batches
          </h2>

          <p className="text-[#c7b6a5] mt-1">
            {batches.length} available coffee batches
          </p>
        </div>

        {loading ? (
          <p className="text-[#d0c0af]">Loading batches...</p>
        ) : batches.length === 0 ? (
          <div className="bg-[#2a231d]/90 border border-[#5d4a3a] p-10 rounded-[28px] text-center text-[#d4c4b3] shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-md">
            No batches yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {batches.map((batch) => (
              <div
                key={batch.id}
                className="rounded-[30px] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.45)] border border-[#5a4b3d] backdrop-blur-md transition-all duration-300 hover:scale-[1.02]"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(24,20,16,0.84), rgba(24,20,16,0.90)),
                    url('https://images.unsplash.com/photo-1504630083234-14187a9df0f5?q=80&w=1400&auto=format&fit=crop')
                  `,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="p-1">
                  <BatchCard
                    batch={batch}
                    userRole="Dealer"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default DealerDashboard;