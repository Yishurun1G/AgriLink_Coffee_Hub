// src/pages/dealer/DealerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from '../../api/axios';
import CreateBatchForm from '../../components/batches/CreateBatchForm';
import BatchCard from '../../components/common/BatchCard';

const DealerDashboard = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchMyBatches = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/batches/my_batches/');
      setBatches(response.data);
    } catch (error) {
      console.error("Failed to fetch batches:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBatches();
  }, []);

  const handleBatchCreated = () => {
    fetchMyBatches();
    setShowCreateForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">

        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Welcome, {user?.first_name || user?.username || 'Dealer'}
            </h1>
            <p className="text-gray-600 mt-1">Create and manage your coffee batches</p>
          </div>

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl font-medium flex items-center gap-2"
          >
            {showCreateForm ? 'Cancel' : '+ Add New Batch'}
          </button>
        </div>

        {/* Create Batch Form */}
        {showCreateForm && (
          <div className="mb-12">
            <CreateBatchForm onBatchCreated={handleBatchCreated} />
          </div>
        )}

        {/* My Batches */}
        <h2 className="text-2xl font-semibold mb-6">My Batches ({batches.length})</h2>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading your batches...</div>
        ) : batches.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center">
            <p className="text-gray-500">No batches yet.</p>
            <p className="text-gray-400 mt-2">Click "+ Add New Batch" to create your first batch.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batches.map((batch) => (
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