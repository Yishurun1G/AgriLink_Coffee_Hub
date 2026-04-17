// src/pages/customer/CustomerDashboard.jsx

import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import BatchCard from '../../components/common/BatchCard';

const CustomerDashboard = () => {
  const [approvedBatches, setApprovedBatches] = useState([]);
  const [displayedBatches, setDisplayedBatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ✅ Fetch ONLY approved batches (backend handles filtering)
  const fetchApprovedBatches = async () => {
    try {
      setLoading(true);

      const response = await axios.get('/batches/approved/');
      const data = Array.isArray(response.data) ? response.data : [];

      console.log("Approved batches:", data);

      setApprovedBatches(data);
      setDisplayedBatches(data);

    } catch (err) {
      console.error("Error fetching batches:", err);
      setError("Failed to load approved coffee batches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedBatches();
  }, []);

  // 🔍 Search functionality
  useEffect(() => {
    if (!searchTerm) {
      setDisplayedBatches(approvedBatches);
    } else {
      const term = searchTerm.toLowerCase();

      const filtered = approvedBatches.filter(batch =>
        (batch.id && batch.id.toString().toLowerCase().includes(term)) ||
        (batch.origin && batch.origin.toLowerCase().includes(term)) ||
        (batch.coffee_type && batch.coffee_type.toLowerCase().includes(term))
      );

      setDisplayedBatches(filtered);
    }
  }, [searchTerm, approvedBatches]);

  // 🛒 Order handler (placeholder for now)
  const handleOrder = async (batch) => {
  try {
    const quantity = prompt("Enter quantity (kg):");

    if (!quantity) return;

    await axios.post('/orders/', {
      batch: batch.id,
      quantity_kg: parseFloat(quantity),
      notes: ""
    });

    alert("✅ Order placed successfully!");

  } catch (error) {
    console.error(error);
    alert("❌ Failed to place order");
  }
};
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900">
            ☕ Explore Coffee Batches
          </h1>
          <p className="text-gray-600 mt-2">
            Browse verified and approved coffee products
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-10">
          <input
            type="text"
            placeholder="Search by Batch ID, origin, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20 text-gray-500">
            Loading approved batches...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center text-red-600 py-10">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && displayedBatches.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            No approved batches found.
          </div>
        )}

        {/* Batch Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedBatches.map((batch) => (
            <div key={batch.id} className="relative group">
              
              {/* Batch Card */}
              <BatchCard batch={batch} userRole="CUSTOMER" />

              {/* Order Button */}
              <button
                onClick={() => handleOrder(batch)}
                className="absolute bottom-4 right-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow opacity-0 group-hover:opacity-100 transition"
              >
                Order
              </button>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default CustomerDashboard;