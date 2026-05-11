// src/components/common/BatchCard.jsx
import React, { useState, useEffect } from 'react';

const BatchCard = ({ batch, userRole, onApprove, onReject, onUpdate }) => {
  const shortId = batch.id
    ? batch.id.toString().substring(0, 8) + '...'
    : 'N/A';

  const [qty, setQty] = useState(batch.quantity_kg);
  const [origin, setOrigin] = useState(batch.origin);
  const [coffeeType, setCoffeeType] = useState(batch.coffee_type);

  useEffect(() => {
    setQty(batch.quantity_kg);
    setOrigin(batch.origin);
    setCoffeeType(batch.coffee_type);
  }, [batch]);

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/20';
      case 'REJECTED':
        return 'bg-red-500/15 text-red-200 border border-red-400/20';
      case 'PENDING':
      default:
        return 'bg-amber-500/15 text-amber-200 border border-amber-400/20';
    }
  };

  const getCoffeeTypeColor = (type) => {
    const colors = {
      ARABICA: 'bg-[#5c3d2e]/70 text-[#f5d7b2]',
      ROBUSTA: 'bg-[#6b4f3a]/70 text-[#f7e0b2]',
      EXCELSA: 'bg-[#4b2e5a]/70 text-[#e3d0ff]',
      LIBERICA: 'bg-[#5a2f2f]/70 text-[#ffd6d6]',
    };

    return colors[type] || 'bg-white/10 text-white';
  };

  return (
    <div
      className="
        relative overflow-hidden rounded-[30px]
        border border-white/10
        shadow-2xl
        backdrop-blur-md
        transition-all duration-300
        hover:-translate-y-1 hover:shadow-[#6f4e37]/30
      "
      style={{
        backgroundImage: `
          linear-gradient(rgba(20,12,8,0.78), rgba(20,12,8,0.82)),
          url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1600&auto=format&fit=crop')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Blur Overlay */}
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: 'blur(4px)',
          background:
            'linear-gradient(to bottom right, rgba(111,78,55,0.45), rgba(25,15,10,0.72))',
        }}
      />

      {/* Glow */}
      <div className="absolute -top-10 right-0 h-40 w-40 rounded-full bg-[#c28b55]/20 blur-3xl" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 px-6 pt-6 pb-4">
          <div>
            <p className="text-xs tracking-[0.25em] text-[#c7b19c]">
              BATCH ID
            </p>

            <p className="mt-1 font-mono text-lg font-bold tracking-widest text-white">
              {shortId}
            </p>
          </div>

          <span
            className={`rounded-2xl px-5 py-2 text-xs font-bold uppercase tracking-wide ${getStatusColor(
              batch.status
            )}`}
          >
            {batch.status_display || batch.status}
          </span>
        </div>

        {/* Body */}
        <div className="space-y-6 p-6">
          {/* Coffee Type */}
          {userRole === 'Manager' ? (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-[#f5e6d3]">
                Coffee Type
              </label>

              <select
                value={coffeeType}
                onChange={(e) => setCoffeeType(e.target.value)}
                className="
                  w-full rounded-2xl
                  border border-[#8a6a4a]/40
                  bg-[#4b3525]/80
                  px-4 py-3
                  text-[#dbc7b5]
                  outline-none
                  backdrop-blur-md
                  transition-all duration-300
                  focus:border-[#c28b55]
                "
              >
                <option className="bg-[#4b3525] text-[#dbc7b5]" value="ARABICA">
                  Arabica
                </option>

                <option className="bg-[#4b3525] text-[#dbc7b5]" value="ROBUSTA">
                  Robusta
                </option>

                <option className="bg-[#4b3525] text-[#dbc7b5]" value="EXCELSA">
                  Excelsa
                </option>

                <option className="bg-[#4b3525] text-[#dbc7b5]" value="LIBERICA">
                  Liberica
                </option>
              </select>

              <button
                disabled={coffeeType === batch.coffee_type}
                onClick={() =>
                  onUpdate(batch.id, { coffee_type: coffeeType })
                }
                className="
                  rounded-xl bg-[#8b5e34]
                  px-4 py-2 text-sm font-semibold text-white
                  transition hover:bg-[#a06d3f]
                  disabled:opacity-40
                "
              >
                Save Type
              </button>
            </div>
          ) : (
            <div>
              <span
                className={`rounded-2xl px-4 py-2 text-xs font-bold uppercase tracking-wide ${getCoffeeTypeColor(
                  batch.coffee_type
                )}`}
              >
                ☕ {batch.coffee_type_display || batch.coffee_type}
              </span>
            </div>
          )}

          {/* Quantity */}
          <div>
            <p className="mb-2 text-sm text-[#c7b19c]">Quantity</p>

            {userRole === 'Manager' ? (
              <div className="space-y-3">
                <input
                  type="number"
                  min="0"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="
                    w-full rounded-2xl
                    border border-white/10
                    bg-white/10
                    px-4 py-3
                    text-white
                    outline-none
                    backdrop-blur-md
                  "
                />

                <button
                  disabled={qty == batch.quantity_kg}
                  onClick={() =>
                    onUpdate(batch.id, { quantity_kg: qty })
                  }
                  className="
                    rounded-xl bg-[#8b5e34]
                    px-4 py-2 text-sm font-semibold text-white
                    transition hover:bg-[#a06d3f]
                    disabled:opacity-40
                  "
                >
                  Save Quantity
                </button>
              </div>
            ) : (
              <p className="text-3xl font-bold text-white">
                {batch.quantity_kg}
                <span className="ml-1 text-lg text-[#dbc7b5]">kg</span>
              </p>
            )}
          </div>

          {/* Origin */}
          <div>
            <p className="mb-2 text-sm text-[#c7b19c]">Origin</p>

            {userRole === 'Manager' ? (
              <div className="space-y-3">
                <input
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="
                    w-full rounded-2xl
                    border border-white/10
                    bg-white/10
                    px-4 py-3
                    text-white
                    outline-none
                    backdrop-blur-md
                  "
                />

                <button
                  disabled={origin === batch.origin}
                  onClick={() => onUpdate(batch.id, { origin })}
                  className="
                    rounded-xl bg-[#8b5e34]
                    px-4 py-2 text-sm font-semibold text-white
                    transition hover:bg-[#a06d3f]
                    disabled:opacity-40
                  "
                >
                  Save Origin
                </button>
              </div>
            ) : (
              <p className="text-lg font-semibold text-white">
                📍 {batch.origin}
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-5 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
            <div>
              <p className="text-xs uppercase tracking-wide text-[#c7b19c]">
                Harvest Date
              </p>

              <p className="mt-1 text-sm font-semibold text-white">
                {new Date(batch.harvest_date).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-[#c7b19c]">
                Created
              </p>

              <p className="mt-1 text-sm font-semibold text-white">
                {new Date(batch.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Dealer */}
          {batch.dealer_name && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <p className="text-xs uppercase tracking-wide text-[#c7b19c]">
                Dealer
              </p>

              <p className="mt-1 font-semibold text-white">
                👤 {batch.dealer_name}
              </p>
            </div>
          )}

          {/* Validator */}
          {batch.validated_by_name && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <p className="text-xs uppercase tracking-wide text-[#c7b19c]">
                Validated By
              </p>

              <p className="mt-1 font-semibold text-white">
                ✅ {batch.validated_by_name}
              </p>
            </div>
          )}
        </div>

        {/* Manager Actions */}
        {userRole === 'Manager' && batch.status === 'PENDING' && (
          <div className="flex gap-3 border-t border-white/10 bg-black/10 p-5 backdrop-blur-md">
            <button
              onClick={() => onApprove && onApprove(batch.id)}
              className="
                flex-1 rounded-2xl
                bg-emerald-600 py-3
                font-bold text-white
                transition hover:bg-emerald-700
              "
            >
              Approve
            </button>

            <button
              onClick={() => onReject && onReject(batch.id)}
              className="
                flex-1 rounded-2xl
                bg-red-600 py-3
                font-bold text-white
                transition hover:bg-red-700
              "
            >
              Reject
            </button>
          </div>
        )}

        {/* Dealer Status */}
        {userRole === 'Dealer' && batch.status === 'PENDING' && (
          <div className="border-t border-white/10 bg-amber-500/10 px-6 py-4 text-center text-sm font-medium text-amber-200">
            ⏳ Waiting for Manager Approval
          </div>
        )}

        {userRole === 'Dealer' && batch.status === 'APPROVED' && (
          <div className="border-t border-white/10 bg-emerald-500/10 px-6 py-4 text-center text-sm font-medium text-emerald-200">
            ✅ Approved by Manager
          </div>
        )}

        {userRole === 'Dealer' && batch.status === 'REJECTED' && (
          <div className="border-t border-white/10 bg-red-500/10 px-6 py-4 text-center text-sm font-medium text-red-200">
            ❌ Rejected by Manager
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchCard;