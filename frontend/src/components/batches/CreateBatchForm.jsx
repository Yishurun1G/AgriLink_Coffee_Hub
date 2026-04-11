// src/components/batches/CreateBatchForm.jsx
import React, { useState } from 'react';
import api from '../../api/axios';

const CreateBatchForm = ({ onBatchCreated }) => {
  const [formData, setFormData] = useState({
    coffee_type: 'ARABICA',
    origin: '',
    quantity_kg: '',
    harvest_date: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log("Sending batch data:", formData);   // Debug

      const response = await api.post('/batches/', formData);
      
      console.log("Batch created successfully:", response.data);
      setSuccess('Batch created successfully! Waiting for manager approval.');

      setFormData({
        coffee_type: 'ARABICA',
        origin: '',
        quantity_kg: '',
        harvest_date: '',
      });

      if (onBatchCreated) onBatchCreated();

    } catch (err) {
      console.error("Create batch error:", err.response?.data || err);
      setError(err.response?.data?.detail || 'Failed to create batch. Please check console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg p-8">
      <h2 className="text-2xl font-semibold mb-6">Create New Coffee Batch</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Coffee Type</label>
          <select
            name="coffee_type"
            value={formData.coffee_type}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-2xl"
          >
            <option value="ARABICA">Arabica</option>
            <option value="ROBUSTA">Robusta</option>
            <option value="EXCELSA">Excelsa</option>
            <option value="LIBERICA">Liberica</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Origin (Farm/Region)</label>
          <input
            type="text"
            name="origin"
            value={formData.origin}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-2xl"
            placeholder="Yirgacheffe, Ethiopia"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (kg)</label>
          <input
            type="number"
            name="quantity_kg"
            value={formData.quantity_kg}
            onChange={handleChange}
            step="0.01"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-2xl"
            placeholder="250.5"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Harvest Date</label>
          <input
            type="date"
            name="harvest_date"
            value={formData.harvest_date}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-2xl"
          />
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}
        {success && <div className="text-green-600 text-sm">{success}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-4 rounded-2xl font-semibold hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? 'Creating Batch...' : 'Create Batch'}
        </button>
      </form>
    </div>
  );
};

export default CreateBatchForm;