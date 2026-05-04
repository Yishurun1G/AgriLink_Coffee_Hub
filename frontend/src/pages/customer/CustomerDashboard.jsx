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

  const fetchApprovedBatches = async () => {
    try {
      setLoading(true);

      const response = await axios.get('/batches/');

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];

      console.log("ALL batches:", data);

      const approved = data.filter(
        (batch) => batch.status === 'APPROVED'
      );

      console.log("APPROVED only:", approved);

      setApprovedBatches(approved);
      setDisplayedBatches(approved);
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

  useEffect(() => {
    if (!searchTerm.trim()) {
      setDisplayedBatches(approvedBatches);
    } else {
      const term = searchTerm.toLowerCase();
      setDisplayedBatches(
        approvedBatches.filter(
          (b) =>
            b.id?.toLowerCase().includes(term) ||
            b.origin?.toLowerCase().includes(term) ||
            b.coffee_type?.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, approvedBatches]);

  const handleOrder = async (batch) => {
    const quantity = prompt(
      "Enter quantity (kg):",
      batch.quantity_kg
    );

    if (!quantity) return;

    try {
      await axios.post('/orders/', {
        batch: batch.id,
        quantity_kg: Number(quantity),
        notes: ''
      });

      alert("Order placed successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to place order");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-7xl mx-auto">

        <h1 className="text-4xl font-bold text-center mb-10">
          ☕ Approved Coffee Batches
        </h1>

        <div className="max-w-2xl mx-auto mb-10">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search batches..."
            className="w-full p-3 border rounded-xl"
          />
        </div>

        {loading && <p className="text-center">Loading...</p>}
        {error && <p className="text-red-600 text-center">{error}</p>}

        {!loading && displayedBatches.length === 0 && (
          <p className="text-center text-gray-500">
            No approved batches available
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayedBatches.map((batch) => (
            <div key={batch.id} className="relative group">
              <BatchCard batch={batch} userRole="CUSTOMER" />

              <button
                onClick={() => handleOrder(batch)}
                className="absolute bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100"
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