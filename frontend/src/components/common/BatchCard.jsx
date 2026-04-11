// src/components/common/BatchCard.jsx
import React from 'react';

const BatchCard = ({ batch, userRole, onApprove, onReject }) => {
  const shortId = batch.id ? batch.id.toString().substring(0, 8) + '...' : 'N/A';

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'PENDING':
      default:
        return 'bg-amber-100 text-amber-800 border border-amber-200';
    }
  };

  const getCoffeeTypeColor = (type) => {
    const colors = {
      ARABICA: 'bg-emerald-100 text-emerald-700',
      ROBUSTA: 'bg-amber-100 text-amber-700',
      EXCELSA: 'bg-purple-100 text-purple-700',
      LIBERICA: 'bg-rose-100 text-rose-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex justify-between items-start">
        <div>
          <p className="text-xs text-gray-500 font-mono">BATCH ID</p>
          <p className="font-mono font-semibold text-lg text-gray-900 tracking-wider">{shortId}</p>
        </div>

        <span className={`px-5 py-2 text-sm font-semibold rounded-2xl border ${getStatusColor(batch.status)}`}>
          {batch.status_display || batch.status}
        </span>
      </div>

      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <span className={`px-4 py-1.5 text-xs font-bold rounded-2xl ${getCoffeeTypeColor(batch.coffee_type)}`}>
            {batch.coffee_type_display || batch.coffee_type}
          </span>
          <span className="text-lg font-semibold text-gray-900">
            {batch.quantity_kg} kg
          </span>
        </div>

        <div>
          <p className="text-sm text-gray-500">Origin</p>
          <p className="font-medium text-gray-900">{batch.origin}</p>
        </div>

        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-gray-500">Harvest Date</p>
            <p className="font-medium">
              {new Date(batch.harvest_date).toLocaleDateString('en-US', { 
                year: 'numeric', month: 'short', day: 'numeric' 
              })}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Created</p>
            <p className="font-medium">
              {new Date(batch.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', month: 'short', day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        {batch.dealer_name && (
          <div>
            <p className="text-gray-500 text-sm">Dealer</p>
            <p className="font-medium text-gray-900">{batch.dealer_name}</p>
          </div>
        )}

        {batch.validated_by_name && (
          <div>
            <p className="text-gray-500 text-sm">Validated By</p>
            <p className="font-medium text-gray-900">{batch.validated_by_name}</p>
          </div>
        )}
      </div>

      {/* Approve / Reject Buttons - Only for Manager on Pending batches */}
      {userRole === 'Manager' && batch.status === 'PENDING' && (
        <div className="border-t border-gray-100 p-5 flex gap-3 bg-gray-50">
          <button
            onClick={() => onApprove && onApprove(batch.id)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-2xl transition"
          >
            Approve
          </button>
          <button
            onClick={() => onReject && onReject(batch.id)}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-2xl transition"
          >
            Reject
          </button>
        </div>
      )}

      {/* Status message for Dealer */}
      {userRole === 'Dealer' && batch.status === 'PENDING' && (
        <div className="bg-amber-50 border-t border-amber-100 px-6 py-4 text-center text-amber-700 text-sm font-medium">
          ⏳ Waiting for Manager Approval
        </div>
      )}

      {userRole === 'Dealer' && batch.status === 'APPROVED' && (
        <div className="bg-green-50 border-t border-green-100 px-6 py-4 text-center text-green-700 text-sm font-medium">
          ✅ Approved by Manager
        </div>
      )}

      {userRole === 'Dealer' && batch.status === 'REJECTED' && (
        <div className="bg-red-50 border-t border-red-100 px-6 py-4 text-center text-red-700 text-sm font-medium">
          ❌ Rejected by Manager
        </div>
      )}
    </div>
  );
};

export default BatchCard;