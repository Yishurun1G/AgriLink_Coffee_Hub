// src/pages/dealer/DealerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from '../../api/axios';
import CreateBatchForm from '../../components/batches/CreateBatchForm';
import BatchCard from '../../components/common/BatchCard';

const DealerDashboard = () => {
  const { user } = useAuth();

  const [batches, setBatches] = useState([]);
  const [orders, setOrders] = useState([]); // ✅ NEW
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // ✅ FETCH BATCHES
  const fetchMyBatches = async () => {
    try {
      const response = await axios.get('/batches/my_batches/');
      setBatches(response.data);
    } catch (error) {
      console.error("Failed to fetch batches:", error);
    }
  };

  // ✅ FETCH ORDERS
  const fetchOrders = async () => {
  try {
    const response = await axios.get('/orders/');
    console.log("Dealer Orders:", response.data);

    // ✅ Handle pagination
    const data = response.data.results || response.data;

    setOrders(data);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
  }
};

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchMyBatches(), fetchOrders()]);
      setLoading(false);
    };

    loadData();
  }, []);

  const handleBatchCreated = () => {
    fetchMyBatches();
    setShowCreateForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Welcome, {user?.first_name || user?.username || 'Dealer'}
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your batches and incoming orders
            </p>
          </div>

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl font-medium"
          >
            {showCreateForm ? 'Cancel' : '+ Add New Batch'}
          </button>
        </div>

        {/* CREATE FORM */}
        {showCreateForm && (
          <div className="mb-12">
            <CreateBatchForm onBatchCreated={handleBatchCreated} />
          </div>
        )}

        {/* 🔥 INCOMING ORDERS SECTION */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">
            📦 Incoming Orders ({orders.length})
          </h2>

          {loading ? (
            <p>Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="text-gray-500">No incoming orders</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white p-4 rounded-xl shadow">
                  <p><strong>Order ID:</strong> {order.id}</p>
                  <p><strong>Customer:</strong> {order.customer_name}</p>
                  <p><strong>Batch:</strong> {order.batch_id_short}</p>
                  <p><strong>Quantity:</strong> {order.quantity_kg} kg</p>
                  <p><strong>Status:</strong> {order.status}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BATCHES SECTION */}
        <h2 className="text-2xl font-semibold mb-6">
          My Batches ({batches.length})
        </h2>

        {loading ? (
          <div className="text-center py-20 text-gray-500">
            Loading your batches...
          </div>
        ) : batches.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center">
            <p className="text-gray-500">No batches yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batches.map((batch) => (
              <BatchCard key={batch.id} batch={batch} userRole="Dealer" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DealerDashboard;