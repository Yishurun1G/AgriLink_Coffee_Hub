// src/pages/manager/ManagerDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BatchCard from '../../components/common/BatchCard';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

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

  // ✅ NORMALIZED FILTER (IMPORTANT FIX)
  const filteredBatches = batches.filter((batch) => {
    const status = batch.status?.toUpperCase();

    if (activeTab === 'pending') return status === 'PENDING';
    if (activeTab === 'approved') return status === 'APPROVED';
    if (activeTab === 'rejected') return status === 'REJECTED';

    return true;
  });

  // ✅ SAFE COUNTS (FIXED)
  const countByStatus = (status) =>
    batches.filter(b => b.status?.toUpperCase() === status).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">

        <h1 className="text-4xl font-bold mb-2">Manager Dashboard</h1>
        <p className="text-gray-600 mb-8">Review coffee batches</p>

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

        {/* LOADING */}
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
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default ManagerDashboard;