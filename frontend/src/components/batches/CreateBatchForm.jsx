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
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/batches/', formData);

      console.log('Batch created successfully:', response.data);

      setSuccess(
        'Batch created successfully! Waiting for manager approval.'
      );

      setFormData({
        coffee_type: 'ARABICA',
        origin: '',
        quantity_kg: '',
        harvest_date: '',
      });

      if (onBatchCreated) onBatchCreated();
    } catch (err) {
      console.error('Create batch error:', err.response?.data || err);

      setError(
        err.response?.data?.detail ||
          'Failed to create batch. Please check console.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative overflow-hidden rounded-[32px] border border-[#e8d9c9]/60 shadow-2xl backdrop-blur-sm"
      style={{
        backgroundImage: `
          linear-gradient(rgba(32,20,12,0.78), rgba(32,20,12,0.78)),
          url('https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1600&auto=format&fit=crop')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Blurred coffee overlay */}
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: 'blur(3px)',
          background:
            'linear-gradient(to bottom right, rgba(111,78,55,0.55), rgba(44,24,16,0.72))',
        }}
      />

      {/* Floating coffee glow */}
      <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[#c28b55]/20 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-52 w-52 rounded-full bg-[#6f4e37]/30 blur-3xl" />

      <div className="relative z-10 p-8 md:p-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-lg">
              <span className="text-3xl">☕</span>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-white tracking-wide">
                Create Coffee Batch
              </h2>
              <p className="text-[#f3e6d8] text-sm mt-1">
                Register premium Ethiopian coffee harvest batches
              </p>
            </div>
          </div>

          <div className="h-[1px] w-full bg-gradient-to-r from-[#c28b55]/60 via-white/20 to-transparent" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Coffee Type */}
          <div>
            <label className="block text-sm font-semibold text-[#f5e8db] mb-2">
              Coffee Type
            </label>

            <select
              name="coffee_type"
              value={formData.coffee_type}
              onChange={handleChange}
              className="
  w-full
  rounded-2xl
  border border-[#8a6a4a]/40
  bg-[#4b3525]/80
  backdrop-blur-md
  px-5 py-4
  text-[#dbc7b5]
  shadow-inner
  outline-none
  transition-all duration-300
  focus:border-[#c28b55]
  focus:ring-2 focus:ring-[#c28b55]/40
  hover:bg-[#5a4030]/90
"
            >
              <option className="text-black" value="ARABICA">
                Arabica
              </option>
              <option className="text-black" value="ROBUSTA">
                Robusta
              </option>
              <option className="text-black" value="EXCELSA">
                Excelsa
              </option>
              <option className="text-black" value="LIBERICA">
                Liberica
              </option>
            </select>
          </div>

          {/* Origin */}
          <div>
            <label className="block text-sm font-semibold text-[#f5e8db] mb-2">
              Origin (Farm / Region)
            </label>

            <input
              type="text"
              name="origin"
              value={formData.origin}
              onChange={handleChange}
              required
              placeholder="Yirgacheffe, Ethiopia"
              className="w-full rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md px-5 py-4 text-white placeholder:text-[#dbc7b5] outline-none transition-all duration-300 focus:border-[#d9a066] focus:bg-white/15"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-semibold text-[#f5e8db] mb-2">
              Quantity (kg)
            </label>

            <input
              type="number"
              name="quantity_kg"
              value={formData.quantity_kg}
              onChange={handleChange}
              step="0.1"
              min="0"
              required
              placeholder="250.5"
              className="w-full rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md px-5 py-4 text-white placeholder:text-[#dbc7b5] outline-none transition-all duration-300 focus:border-[#d9a066] focus:bg-white/15"
            />
          </div>

          {/* Harvest Date */}
          <div>
            <label className="block text-sm font-semibold text-[#f5e8db] mb-2">
              Harvest Date
            </label>

            <input
              type="date"
              name="harvest_date"
              value={formData.harvest_date}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md px-5 py-4 text-white outline-none transition-all duration-300 focus:border-[#d9a066] focus:bg-white/15"
            />
          </div>

          {/* Alerts */}
          {error && (
            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 backdrop-blur-md">
              ❌ {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl border border-green-400/30 bg-green-500/10 px-4 py-3 text-sm text-green-200 backdrop-blur-md">
              ✅ {success}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#8b5e34] to-[#c28b55] py-4 text-lg font-bold text-white shadow-xl transition-all duration-300 hover:scale-[1.01] hover:shadow-[#c28b55]/40 disabled:opacity-50"
          >
            <span className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <span className="relative z-10">
              {loading ? 'Creating Batch...' : '☕ Create Coffee Batch'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateBatchForm;