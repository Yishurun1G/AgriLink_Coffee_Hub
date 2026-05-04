// src/pages/manager/ManagerDashboard.jsx

import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BatchCard from '../../components/common/BatchCard';
import { useNavigate } from 'react-router-dom'; // ✅ FIX

const ManagerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate(); // ✅ FIX

  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  // =========================
  // UPDATE BATCH (EDIT FIX)
  // =========================
  const updateBatch = async (batchId, data) => {
    try {
      await axios.patch(`/batches/${batchId}/`, data);
      fetchBatches();
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  // =========================
  // FETCH BATCHES
  // =========================
  const fetchBatches = async () => {
    try {
      setLoading(true);

      const response = await axios.get('/batches/');
      let data = response.data;

      if (data?.results) {
        data = data.results;
      }

      if (!Array.isArray(data)) {
        data = [];
      }

      setBatches(data);
    } catch (error) {
      console.error("Failed to fetch batches:", error);
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  // =========================
  // APPROVE / REJECT
  // =========================
  const handleApprove = async (batchId) => {
    try {
      await axios.post(`/batches/${batchId}/approve/`);
      fetchBatches();
    } catch (error) {
      console.error("Approve failed:", error);
    }
  };

  const handleReject = async (batchId) => {
    try {
      await axios.post(`/batches/${batchId}/reject/`);
      fetchBatches();
    } catch (error) {
      console.error("Reject failed:", error);
    }
  };

  // =========================
  // FILTER
  // =========================
  const filteredBatches = batches.filter((batch) => {
    const status = batch.status?.toUpperCase();

    if (activeTab === 'pending') return status === 'PENDING';
    if (activeTab === 'approved') return status === 'APPROVED';
    if (activeTab === 'rejected') return status === 'REJECTED';

    return true;
  });

  // =========================
  // COUNTS
  // =========================
  const countByStatus = (status) =>
    batches.filter(b => b.status?.toUpperCase() === status).length;

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">

        <h1 className="text-4xl font-bold mb-2">Manager Dashboard</h1>
        <p className="text-gray-600 mb-6">Review coffee batches</p>

        {/* ✅ CHAT BUTTON FIXED */}
        <button
          onClick={() => navigate('/chat')}
          className="bg-blue-600 text-white px-4 py-2 rounded mb-6"
        >
          Open Chat
        </button>

        {/* TABS */}
        <div className="flex border-b mb-8">
          {['pending', 'approved', 'rejected'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 capitalize ${
                activeTab === tab
                  ? 'border-b-4 border-blue-600 text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              {tab} ({countByStatus(tab.toUpperCase())})
            </button>
          ))}
        </div>

        {/* CONTENT */}
        {loading ? (
          <p>Loading...</p>
        ) : filteredBatches.length === 0 ? (
          <p>No {activeTab} batches</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredBatches.map((batch) => (
              <BatchCard
                key={batch.id}
                batch={batch}
                userRole="Manager"
                onApprove={handleApprove}
                onReject={handleReject}
                onUpdate={updateBatch}   
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default ManagerDashboard;