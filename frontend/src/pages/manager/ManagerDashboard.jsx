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
      console.log("Manager fetching all batches...");

      const response = await axios.get('/batches/');
      console.log("Raw response data:", response.data);

      // Handle both array and object responses (DRF router sometimes wraps)
      let data = response.data;

      if (data && typeof data === 'object' && !Array.isArray(data)) {
        // If it's an object with 'results' (pagination) or just the list
        data = data.results || Object.values(data).flat() || [];
      }

      if (!Array.isArray(data)) {
        data = [];
      }

      setBatches(data);
      console.log(`Successfully loaded ${data.length} batches`);
    } catch (error) {
      console.error("Failed to fetch batches for manager:", error);
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
      alert("Failed to approve the batch");
    }
  };

  const handleReject = async (batchId) => {
    try {
      await axios.post(`/batches/${batchId}/reject/`);
      fetchBatches();
    } catch (error) {
      console.error("Reject failed:", error);
      alert("Failed to reject the batch");
    }
  };

  const filteredBatches = batches.filter((batch) => {
    if (activeTab === 'pending') return batch.status === 'PENDING';
    if (activeTab === 'approved') return batch.status === 'APPROVED';
    if (activeTab === 'rejected') return batch.status === 'REJECTED';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-600 mt-2">Review and verify coffee batches from dealers</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          {['pending', 'approved', 'rejected'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-4 font-medium capitalize transition-colors ${
                activeTab === tab 
                  ? 'border-b-4 border-blue-600 text-blue-600 font-semibold' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className="ml-2 text-sm">
                ({filteredBatches.filter(b => 
                  tab === 'pending' ? b.status === 'PENDING' : 
                  tab === 'approved' ? b.status === 'APPROVED' : 
                  b.status === 'REJECTED'
                ).length})
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center">
            <p className="text-2xl text-gray-400">
              No {activeTab} batches found
            </p>
            <p className="text-gray-500 mt-4">
              {activeTab === 'pending' 
                ? "Dealers have not created any batches yet." 
                : `No ${activeTab} batches yet.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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