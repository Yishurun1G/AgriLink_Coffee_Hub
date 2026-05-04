// src/pages/dealer/DealerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from '../../api/axios';
import CreateBatchForm from '../../components/batches/CreateBatchForm';
import BatchCard from '../../components/common/BatchCard';
import { useNavigate } from "react-router-dom";

const DealerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate(); // ✅ FIXED

  const [batches, setBatches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // =========================
  // FETCH BATCHES
  // =========================
  const fetchMyBatches = async () => {
    try {
      const res = await axios.get('/batches/my_batches/');

      console.log("BATCH RESPONSE:", res.data);

      const data = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];

      setBatches(data);
    } catch (err) {
      console.error('Failed to fetch batches:', err);
      setBatches([]);
    }
  };

  // =========================
  // FETCH ORDERS
  // =========================
  const fetchIncomingOrders = async () => {
    try {
      const res = await axios.get('/orders/');

      console.log("ORDER RESPONSE:", res.data);

      const data = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];

      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setOrders([]);
    }
  };

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchMyBatches(), fetchIncomingOrders()]);
      setLoading(false);
    };

    load();
  }, []);

  const handleBatchCreated = () => {
    fetchMyBatches();
    setShowCreateForm(false);
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">

        {/* ✅ CHAT BUTTON */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/chat')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl"
          >
            💬 Open Chat
          </button>
        </div>

        {/* HEADER */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Welcome, {user?.first_name || user?.username || 'Dealer'}
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your batches & incoming orders
            </p>
          </div>

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl"
          >
            {showCreateForm ? 'Cancel' : '+ Add Batch'}
          </button>
        </div>

        {/* CREATE FORM */}
        {showCreateForm && (
          <div className="mb-10">
            <CreateBatchForm onBatchCreated={handleBatchCreated} />
          </div>
        )}

        {/* ================= ORDERS ================= */}
        <h2 className="text-2xl font-semibold mb-4">
          📦 Incoming Orders ({orders.length})
        </h2>

        {loading ? (
          <p className="text-gray-500">Loading orders...</p>
        ) : orders.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl text-center text-gray-500">
            No incoming orders
          </div>
        ) : (
          <div className="space-y-4 mb-12">
            {orders.map(order => (
              <div key={order.id} className="bg-white p-5 rounded-2xl shadow-sm border">
                <p><strong>Order:</strong> #{order.id}</p>
                <p><strong>Customer:</strong> {order.customer_name || 'N/A'}</p>
                <p><strong>Batch:</strong> {order.batch_id_short || order.batch}</p>
                <p><strong>Quantity:</strong> {order.quantity_kg} kg</p>
                <p>
                  <strong>Status:</strong>{' '}
                  <span className="text-green-600">{order.status}</span>
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ================= BATCHES ================= */}
        <h2 className="text-2xl font-semibold mb-4">
          My Batches ({batches.length})
        </h2>

        {loading ? (
          <p className="text-gray-500">Loading batches...</p>
        ) : batches.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl text-center text-gray-500">
            No batches yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {batches.map(batch => (
              <BatchCard
                key={batch.id}
                batch={batch}
                userRole="Dealer"
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default DealerDashboard;