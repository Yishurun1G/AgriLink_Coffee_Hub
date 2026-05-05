import { useState, useEffect, useRef } from 'react';
import axios from '../../api/axios';
import BatchCard from '../../components/common/BatchCard';
import { useNavigate } from 'react-router-dom';
import { assignDelivery } from '../../api/trackingApi';

// ── Manager live tracking map ─────────────────────────────────────────────
function ManagerTrackingView({ trackings }) {
  const [selected, setSelected] = useState(null);
  const mapRef = useRef(null);

  const active = selected
    ? trackings.find((t) => t.id === selected)
    : trackings[0] || null;

  useEffect(() => {
    if (!active) return;

    const initMap = (L) => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

      const lat = active.latitude ? parseFloat(active.latitude) : 9.0;
      const lng = active.longitude ? parseFloat(active.longitude) : 38.7;

      const map = L.map('manager-tracking-map').setView([lat, lng], 13);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      // Dealer marker
      if (active.latitude && active.longitude) {
        const dealerIcon = L.divIcon({
          html: `<div style="background:#6F4E37;color:#fff;width:40px;height:40px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 12px rgba(111,78,55,0.4);border:3px solid #fff;"><span style="transform:rotate(45deg)">🚚</span></div>`,
          className: '', iconSize: [40, 40], iconAnchor: [20, 40],
        });
        L.marker([lat, lng], { icon: dealerIcon })
          .addTo(map)
          .bindPopup(`<b>🚚 ${active.dealer_name}</b><br>Order #${active.order_id}<br>Status: ${active.status}`)
          .openPopup();
      }

      // Customer destination marker
      if (active.delivery_lat && active.delivery_lng) {
        const destLat = parseFloat(active.delivery_lat);
        const destLng = parseFloat(active.delivery_lng);
        const destIcon = L.divIcon({
          html: `<div style="background:#e65100;color:#fff;width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 3px 10px rgba(230,81,0,0.4);border:2px solid #fff;"><span style="transform:rotate(45deg)">🏠</span></div>`,
          className: '', iconSize: [36, 36], iconAnchor: [18, 36],
        });
        L.marker([destLat, destLng], { icon: destIcon })
          .addTo(map)
          .bindPopup(`<b>📍 Delivery address</b><br>${active.delivery_address || 'Customer location'}`);

        if (active.latitude && active.longitude) {
          L.polyline([[lat, lng], [destLat, destLng]], { color: '#6F4E37', weight: 2, dashArray: '6 8', opacity: 0.6 }).addTo(map);
          map.fitBounds([[lat, lng], [destLat, destLng]], { padding: [40, 40] });
        }
      }
    };

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css'; link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    if (window.L) { initMap(window.L); return; }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => initMap(window.L);
    document.head.appendChild(script);

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [active?.id, active?.latitude, active?.longitude]);

  if (trackings.length === 0) return (
    <div className="bg-white p-10 rounded-2xl text-center text-gray-500">
      No active deliveries to track yet.
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Delivery selector */}
      <div className="flex gap-3 flex-wrap">
        {trackings.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelected(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-colors ${
              (selected ?? trackings[0]?.id) === t.id
                ? 'bg-amber-700 text-white border-amber-700'
                : 'bg-white text-amber-700 border-amber-700'
            }`}
          >
            🚚 {t.dealer_name} — Order #{t.order_id}
          </button>
        ))}
      </div>

      {/* Info bar */}
      {active && (
        <div className="bg-white rounded-2xl p-4 border flex flex-wrap gap-6 text-sm">
          <div><span className="text-gray-400 text-xs uppercase font-semibold">Dealer</span><p className="font-semibold">🚚 {active.dealer_name}</p></div>
          <div><span className="text-gray-400 text-xs uppercase font-semibold">Customer</span><p className="font-semibold">👤 {active.customer_name}</p></div>
          <div><span className="text-gray-400 text-xs uppercase font-semibold">Status</span><p className="font-semibold">{active.status}</p></div>
          <div><span className="text-gray-400 text-xs uppercase font-semibold">Delivery Address</span><p className="font-semibold">📍 {active.delivery_address || '—'}</p></div>
          <div><span className="text-gray-400 text-xs uppercase font-semibold">Last Update</span><p className="font-semibold">{active.last_location_update ? new Date(active.last_location_update).toLocaleTimeString() : 'No updates'}</p></div>
        </div>
      )}

      {/* Map */}
      <div id="manager-tracking-map" style={{ height: 420, borderRadius: 16, border: '1px solid #E8DDD4', overflow: 'hidden' }} />
    </div>
  );
}

const ManagerDashboard = () => {
  const navigate   = useNavigate();

  const [batches, setBatches]       = useState([]);
  const [orders, setOrders]         = useState([]);
  const [dealers, setDealers]       = useState([]);
  const [trackings, setTrackings]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('orders');

  // Assign modal state
  const [assignModal, setAssignModal]       = useState(null); // order object
  const [selectedDealer, setSelectedDealer] = useState('');
  const [estimatedDate, setEstimatedDate]   = useState('');
  const [assigning, setAssigning]           = useState(false);
  const [assignError, setAssignError]       = useState('');

  // ── Fetch all data ──────────────────────────────────────────────────────
  const fetchBatches = async () => {
    try {
      const res  = await axios.get('/batches/');
      const data = res.data?.results ?? res.data;
      setBatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch batches:', err);
      setBatches([]);
    }
  };

  const fetchOrders = async () => {
    try {
      const res  = await axios.get('/orders/');
      const data = res.data?.results ?? res.data;
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setOrders([]);
    }
  };

  const fetchDealers = async () => {
    try {
      // Fetch all users without pagination limit to ensure all dealers are available
      const res  = await axios.get('/users/?page_size=100');
      const data = res.data?.results ?? res.data;
      const all  = Array.isArray(data) ? data : [];
      setDealers(all.filter((u) => u.role?.toUpperCase() === 'DEALER'));
    } catch (err) {
      console.error('Failed to fetch dealers:', err);
      setDealers([]);
    }
  };

  const fetchTrackings = async () => {
    try {
      const res  = await axios.get('/tracking/');
      const data = res.data?.results ?? res.data;
      setTrackings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch trackings:', err);
      setTrackings([]);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchBatches(), fetchOrders(), fetchDealers(), fetchTrackings()]);
      setLoading(false);
    };
    load();
  }, []);

  // ── Batch actions ───────────────────────────────────────────────────────
  const updateBatch = async (batchId, data) => {
    try {
      await axios.patch(`/batches/${batchId}/`, data);
      fetchBatches();
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const handleApprove = async (batchId) => {
    try { await axios.post(`/batches/${batchId}/approve/`); fetchBatches(); }
    catch (err) { console.error('Approve failed:', err); }
  };

  const handleReject = async (batchId) => {
    try { await axios.post(`/batches/${batchId}/reject/`); fetchBatches(); }
    catch (err) { console.error('Reject failed:', err); }
  };

  // ── Assign dealer to order ──────────────────────────────────────────────
  const handleAssign = async () => {
    if (!selectedDealer) { setAssignError('Please select a dealer.'); return; }
    setAssigning(true); setAssignError('');
    try {
      await assignDelivery(
        assignModal.id,
        parseInt(selectedDealer),
        estimatedDate || null,
      );
      await Promise.all([fetchOrders(), fetchTrackings()]);
      setAssignModal(null);
      setSelectedDealer('');
      setEstimatedDate('');
    } catch (err) {
      const detail = err?.response?.data;
      const msg = typeof detail === 'string'
        ? detail
        : detail?.detail ?? JSON.stringify(detail) ?? 'Failed to assign. Try again.';
      setAssignError(msg);
    } finally {
      setAssigning(false);
    }
  };

  // ── Filter / counts ─────────────────────────────────────────────────────
  const filteredBatches = batches.filter((b) => {
    const s = b.status?.toUpperCase();
    if (activeTab === 'pending')  return s === 'PENDING';
    if (activeTab === 'approved') return s === 'APPROVED';
    if (activeTab === 'rejected') return s === 'REJECTED';
    return true;
  });

  const countByStatus = (s) =>
    batches.filter((b) => b.status?.toUpperCase() === s).length;

  const statusColor = (s) => ({
    PENDING:   'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    SHIPPED:   'bg-purple-100 text-purple-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  }[s?.toUpperCase()] ?? 'bg-gray-100 text-gray-600');

  const tabs = ['pending', 'approved', 'rejected', 'orders', 'tracking'];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">

        {/* ── Header ── */}
        <div className="flex justify-between items-start mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Manager Dashboard</h1>
            <p className="text-gray-600 mt-1">Review batches & manage orders</p>
          </div>
          <button
            onClick={() => navigate('/chat')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-medium"
          >
            💬 Open Chat
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 capitalize whitespace-nowrap font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-4 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'orders'
                ? <span>Orders {orders.filter(o => ['PENDING','CONFIRMED'].includes(o.status?.toUpperCase())).length > 0 && <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{orders.filter(o => ['PENDING','CONFIRMED'].includes(o.status?.toUpperCase())).length}</span>} ({orders.length})</span>
                : tab === 'tracking'
                ? `🗺 Tracking (${trackings.length})`
                : `${tab} (${countByStatus(tab.toUpperCase())})`}
            </button>
          ))}
        </div>

        {/* ── Action needed banners ── */}
        {!loading && (() => {
          const pendingApproval = trackings.filter(t => ['PICKED_UP','IN_TRANSIT'].includes(t.status) && !t.manager_approved_transit);
          return pendingApproval.length > 0 ? (
            <div className="mb-4 bg-blue-50 border border-blue-300 rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-blue-800 font-semibold text-sm">
                � {pendingApproval.length} delivery{pendingApproval.length > 1 ? 'ies' : ''} waiting for your Nearby approval
              </p>
              <button onClick={() => setActiveTab('tracking')} className="text-xs font-bold text-blue-700 underline">
                Go to Tracking →
              </button>
            </div>
          ) : null;
        })()}

        {/* ── Content ── */}
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : activeTab === 'tracking' ? (

          /* ══ TRACKING TAB ════════════════════════════════════════════ */
          <ManagerTrackingView trackings={trackings} />

        ) : activeTab === 'orders' ? (

          /* ══ ORDERS TAB ══════════════════════════════════════════════ */
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white p-10 rounded-2xl text-center text-gray-500">
                No orders yet
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white p-5 rounded-2xl shadow-sm border flex justify-between items-start gap-4 flex-wrap"
                >
                  {/* Order info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-lg font-bold text-gray-900">
                        Order #{order.id}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                      <div>
                        <p className="text-xs text-gray-400 uppercase font-medium">Customer</p>
                        <p className="font-medium text-gray-800">
                          {order.customer_name ?? order.customer ?? '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase font-medium">Batch</p>
                        <p className="font-medium text-gray-800">
                          #{order.batch_id_short ?? order.batch}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase font-medium">Quantity</p>
                        <p className="font-medium text-gray-800">{order.quantity_kg} kg</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase font-medium">Placed</p>
                        <p className="font-medium text-gray-800">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Delivery address */}
                    {order.delivery_address && (
                      <div className="mt-2 text-sm text-amber-800 bg-amber-50 px-3 py-2 rounded-lg w-fit">
                        📍 {order.delivery_address}
                      </div>
                    )}

                  {/* Show assigned dealer + Approve Nearby if shipped */}
                  {(order.status === 'SHIPPED' || order.status === 'DELIVERED') && (() => {
                    // Match by string comparison to avoid int/string mismatch
                    const tracking = trackings.find(t => String(t.order_id) === String(order.id));
                    const needsApproval = tracking && ['PICKED_UP', 'IN_TRANSIT'].includes(tracking.status) && !tracking.manager_approved_transit;
                    return (
                      <div className="mt-3 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-sm text-purple-700 bg-purple-50 px-3 py-2 rounded-lg w-fit flex-wrap">
                          🚚 {tracking ? `Assigned to: ${tracking.dealer_name}` : 'Delivery assigned'}
                          {tracking && (
                            <span className="text-xs font-bold bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
                              {tracking.status.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        {needsApproval && (
                          <button
                            onClick={async () => {
                              try {
                                await approveTransit(tracking.id);
                                await fetchTrackings();
                              } catch (err) {
                                alert(err?.response?.data?.detail ?? 'Failed to approve.');
                              }
                            }}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold w-fit"
                          >
                            ✅ Approve Nearby
                          </button>
                        )}
                        {tracking?.manager_approved_transit && tracking.status === 'NEARBY' && (
                          <span className="text-xs text-green-700 font-semibold bg-green-50 px-3 py-1 rounded-lg w-fit">
                            ✅ Nearby approved — waiting for customer confirmation
                          </span>
                        )}
                      </div>
                    );
                  })()}
                  </div>

                  {/* Assign button — only for CONFIRMED or PENDING orders not yet shipped */}
                  {['PENDING', 'CONFIRMED'].includes(order.status?.toUpperCase()) && (
                    <button
                      onClick={() => {
                        setAssignModal(order);
                        setAssignError('');
                        setSelectedDealer('');
                        setEstimatedDate('');
                      }}
                      className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap"
                    >
                      🚚 Assign Dealer
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

        ) : (

          /* ══ BATCH TABS ══════════════════════════════════════════════ */
          filteredBatches.length === 0 ? (
            <p className="text-gray-500">No {activeTab} batches</p>
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
          )
        )}
      </div>

      {/* ══ ASSIGN MODAL ══════════════════════════════════════════════════ */}
      {assignModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setAssignModal(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              🚚 Assign Shipment
            </h2>
            <p className="text-sm text-gray-500 mb-1">
              Order #{assignModal.id} · {assignModal.quantity_kg} kg
            </p>
            <p className="text-sm text-gray-500 mb-1">
              Customer: <span className="font-semibold text-gray-700">{assignModal.customer_name ?? assignModal.customer}</span>
            </p>
            {assignModal.delivery_address && (
              <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-4">
                📍 Deliver to: <span className="font-semibold">{assignModal.delivery_address}</span>
              </p>
            )}

            {/* Dealer select */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Select Dealer
              </label>
              {dealers.length === 0 ? (
                <p className="text-sm text-red-500">No dealers found.</p>
              ) : (
                <select
                  value={selectedDealer}
                  onChange={(e) => setSelectedDealer(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                >
                  <option value="">— Pick a dealer —</option>
                  {dealers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.username}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Estimated delivery */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Estimated Delivery (optional)
              </label>
              <input
                type="datetime-local"
                value={estimatedDate}
                onChange={(e) => setEstimatedDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            {assignError && (
              <p className="text-red-500 text-sm mb-4">{assignError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setAssignModal(null)}
                className="flex-1 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={assigning}
                className="flex-1 bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
              >
                {assigning ? 'Assigning…' : 'Assign & Ship'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;