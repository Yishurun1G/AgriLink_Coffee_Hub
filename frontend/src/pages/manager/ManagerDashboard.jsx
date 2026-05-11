import { useState, useEffect, useRef } from 'react';
import axios from '../../api/axios';
import BatchCard from '../../components/common/BatchCard';
import { useNavigate } from 'react-router-dom';
import { assignDelivery, approveTransit } from '../../api/trackingApi';

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
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const lat = active.latitude ? parseFloat(active.latitude) : 9.0;
      const lng = active.longitude ? parseFloat(active.longitude) : 38.7;

      const map = L.map('manager-tracking-map').setView([lat, lng], 13);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      if (active.latitude && active.longitude) {
        const dealerIcon = L.divIcon({
          html: `
            <div style="
              background:#6F4E37;
              color:#fff;
              width:42px;
              height:42px;
              border-radius:50% 50% 50% 0;
              transform:rotate(-45deg);
              display:flex;
              align-items:center;
              justify-content:center;
              font-size:18px;
              box-shadow:0 6px 18px rgba(0,0,0,0.45);
              border:3px solid #fff;
            ">
              <span style="transform:rotate(45deg)">🚚</span>
            </div>
          `,
          className: '',
          iconSize: [42, 42],
          iconAnchor: [21, 42],
        });

        L.marker([lat, lng], { icon: dealerIcon })
          .addTo(map)
          .bindPopup(
            `<b>🚚 ${active.dealer_name}</b><br>Order #${active.order_id}<br>Status: ${active.status}`
          )
          .openPopup();
      }

      if (active.delivery_lat && active.delivery_lng) {
        const destLat = parseFloat(active.delivery_lat);
        const destLng = parseFloat(active.delivery_lng);

        const destIcon = L.divIcon({
          html: `
            <div style="
              background:#355c3a;
              color:#fff;
              width:38px;
              height:38px;
              border-radius:50% 50% 50% 0;
              transform:rotate(-45deg);
              display:flex;
              align-items:center;
              justify-content:center;
              font-size:16px;
              box-shadow:0 4px 12px rgba(0,0,0,0.45);
              border:2px solid #fff;
            ">
              <span style="transform:rotate(45deg)">🏠</span>
            </div>
          `,
          className: '',
          iconSize: [38, 38],
          iconAnchor: [19, 38],
        });

        L.marker([destLat, destLng], { icon: destIcon })
          .addTo(map)
          .bindPopup(
            `<b>📍 Delivery Address</b><br>${
              active.delivery_address || 'Customer location'
            }`
          );

        if (active.latitude && active.longitude) {
          L.polyline(
            [
              [lat, lng],
              [destLat, destLng],
            ],
            {
              color: '#8B5E3C',
              weight: 3,
              dashArray: '6 8',
              opacity: 0.7,
            }
          ).addTo(map);

          map.fitBounds(
            [
              [lat, lng],
              [destLat, destLng],
            ],
            { padding: [40, 40] }
          );
        }
      }
    };

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (window.L) {
      initMap(window.L);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => initMap(window.L);
    document.body.appendChild(script);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [active?.id, active?.latitude, active?.longitude]);

  if (trackings.length === 0)
    return (
      <div className="bg-[#2a231d]/90 border border-[#5d4a3a] p-10 rounded-3xl text-center text-[#d6c7b5] shadow-2xl backdrop-blur-md">
        No active deliveries to track yet.
      </div>
    );

  return (
    <div className="space-y-5">
      {/* Delivery selector */}
      <div className="flex gap-3 flex-wrap">
        {trackings.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelected(t.id)}
            className={`px-4 py-2 rounded-2xl text-sm font-semibold border transition-all duration-300 shadow-lg ${
              (selected ?? trackings[0]?.id) === t.id
                ? 'bg-[#6F4E37] text-white border-[#6F4E37]'
                : 'bg-[#2a231d]/80 text-[#d6c7b5] border-[#5c4939] hover:bg-[#3a2f26]'
            }`}
          >
            🚚 {t.dealer_name} — Order #{t.order_id}
          </button>
        ))}
      </div>

      {/* Info bar */}
      {active && (
        <div
          className="bg-[#2a231d]/90 rounded-3xl p-5 border border-[#5d4a3a] shadow-[0_15px_40px_rgba(0,0,0,0.45)] backdrop-blur-md flex flex-wrap gap-6 text-sm text-[#f2ece5]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(25,20,15,0.92), rgba(25,20,15,0.94)),
              url('https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1200&auto=format&fit=crop')
            `,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div>
            <span className="text-[#b89d83] text-xs uppercase font-semibold">
              Dealer
            </span>
            <p className="font-semibold">🚚 {active.dealer_name}</p>
          </div>

          <div>
            <span className="text-[#b89d83] text-xs uppercase font-semibold">
              Customer
            </span>
            <p className="font-semibold">👤 {active.customer_name}</p>
          </div>

          <div>
            <span className="text-[#b89d83] text-xs uppercase font-semibold">
              Status
            </span>
            <p className="font-semibold">{active.status}</p>
          </div>

          <div>
            <span className="text-[#b89d83] text-xs uppercase font-semibold">
              Delivery Address
            </span>
            <p className="font-semibold">
              📍 {active.delivery_address || '—'}
            </p>
          </div>

          <div>
            <span className="text-[#b89d83] text-xs uppercase font-semibold">
              Last Update
            </span>
            <p className="font-semibold">
              {active.last_location_update
                ? new Date(active.last_location_update).toLocaleTimeString()
                : 'No updates'}
            </p>
          </div>
        </div>
      )}

      {/* Map */}
      <div
        id="manager-tracking-map"
        style={{
          height: 420,
          borderRadius: 24,
          border: '1px solid rgba(111,78,55,0.5)',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.45)',
        }}
        className="backdrop-blur-md"
      />
    </div>
  );
}

const ManagerDashboard = () => {
  const navigate = useNavigate();

  const [batches, setBatches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [trackings, setTrackings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');

  const [assignModal, setAssignModal] = useState(null);
  const [selectedDealer, setSelectedDealer] = useState('');
  const [estimatedDate, setEstimatedDate] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');

  // ── Fetch all data ──────────────────────────────────────────────────────
  const fetchBatches = async () => {
    try {
      const res = await axios.get('/batches/?page_size=100');
      const data = res.data?.results ?? res.data;
      setBatches(Array.isArray(data) ? data : []);
    } catch {
      setBatches([]);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get('/orders/');
      const data = res.data?.results ?? res.data;
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    }
  };

  const fetchDealers = async () => {
    try {
      const res = await axios.get('/users/?role=DEALER&page_size=100');
      const data = res.data?.results ?? res.data;
      setDealers(Array.isArray(data) ? data : []);
    } catch {
      setDealers([]);
    }
  };

  const fetchTrackings = async () => {
    try {
      const res = await axios.get('/tracking/');
      const data = res.data?.results ?? res.data;
      setTrackings(Array.isArray(data) ? data : []);
    } catch {
      setTrackings([]);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      await Promise.all([
        fetchBatches(),
        fetchOrders(),
        fetchDealers(),
        fetchTrackings(),
      ]);

      setLoading(false);
    };

    load();

    const interval = setInterval(load, 30000);

    return () => clearInterval(interval);
  }, []);

  // ── Batch actions ───────────────────────────────────────────────────────
  const updateBatch = async (batchId, data) => {
    try {
      await axios.patch(`/batches/${batchId}/`, data);
      fetchBatches();
    } catch {}
  };

  const handleApprove = async (batchId) => {
    try {
      await axios.post(`/batches/${batchId}/approve/`);
      fetchBatches();
    } catch {}
  };

  const handleReject = async (batchId) => {
    try {
      await axios.post(`/batches/${batchId}/reject/`);
      fetchBatches();
    } catch {}
  };

  // ── Assign dealer ───────────────────────────────────────────────────────
  const handleAssign = async () => {
    if (!selectedDealer) {
      setAssignError('Please select a dealer.');
      return;
    }

    setAssigning(true);
    setAssignError('');

    try {
      await assignDelivery(
        assignModal.id,
        parseInt(selectedDealer),
        estimatedDate || null
      );

      await Promise.all([fetchOrders(), fetchTrackings()]);

      setAssignModal(null);
      setSelectedDealer('');
      setEstimatedDate('');
    } catch (err) {
      const detail = err?.response?.data;

      const msg =
        typeof detail === 'string'
          ? detail
          : detail?.detail ??
            JSON.stringify(detail) ??
            'Failed to assign.';

      setAssignError(msg);
    } finally {
      setAssigning(false);
    }
  };

  // ── Filters ─────────────────────────────────────────────────────────────
  const filteredBatches = batches.filter((b) => {
    const s = b.status?.toUpperCase();

    if (activeTab === 'pending') return s === 'PENDING';
    if (activeTab === 'approved') return s === 'APPROVED';
    if (activeTab === 'rejected') return s === 'REJECTED';

    return true;
  });

  const countByStatus = (s) =>
    batches.filter((b) => b.status?.toUpperCase() === s).length;

  const statusColor = (s) =>
    ({
      PENDING:
        'bg-yellow-900/40 text-yellow-300 border border-yellow-700',
      CONFIRMED:
        'bg-blue-900/40 text-blue-300 border border-blue-700',
      SHIPPED:
        'bg-purple-900/40 text-purple-300 border border-purple-700',
      DELIVERED:
        'bg-green-900/40 text-green-300 border border-green-700',
      CANCELLED:
        'bg-red-900/40 text-red-300 border border-red-700',
    }[s?.toUpperCase()] ??
    'bg-gray-800 text-gray-300 border border-gray-700');

  const tabs = ['pending', 'approved', 'rejected', 'orders', 'tracking'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1c1713] via-[#241d17] to-[#1f2d22] py-8 text-[#f4efe8] relative overflow-hidden">
      {/* Background overlay */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1600&auto=format&fit=crop')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(2px)',
        }}
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-4xl font-bold text-white drop-shadow-lg tracking-wide">
              ☕ Manager Dashboard
            </h1>

            <p className="text-[#cbb9a6] mt-2">
              Review batches & manage orders • Auto-refreshes every 30s
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={async () => {
                setLoading(true);

                await Promise.all([
                  fetchBatches(),
                  fetchOrders(),
                  fetchDealers(),
                  fetchTrackings(),
                ]);

                setLoading(false);
              }}
              className="bg-[#355c3a] hover:bg-[#406d46] text-white px-5 py-2 rounded-2xl font-medium shadow-2xl shadow-black/30 transition-all duration-300"
            >
              🔄 Refresh
            </button>

            <button
              onClick={() => navigate('/manager/reports')}
              className="bg-[#5c3d2e] hover:bg-[#6b4937] text-white px-5 py-2 rounded-2xl font-medium shadow-2xl shadow-black/30 transition-all duration-300"
            >
              📊 Reports
            </button>

            <button
              onClick={() => navigate('/chat')}
              className="bg-[#6F4E37] hover:bg-[#7d5a42] text-white px-5 py-2 rounded-2xl font-medium shadow-2xl shadow-black/30 transition-all duration-300"
            >
              💬 Open Chat
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border border-[#4e4439] mb-8 overflow-x-auto rounded-2xl bg-white/5 backdrop-blur-md shadow-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 capitalize whitespace-nowrap font-medium rounded-xl transition-all duration-300 ${
                activeTab === tab
                  ? 'bg-[#6F4E37] text-white shadow-lg'
                  : 'text-[#cbbba8] hover:text-white hover:bg-white/5'
              }`}
            >
              {tab === 'orders'
                ? `Orders (${orders.length})`
                : tab === 'tracking'
                ? `🗺 Tracking (${trackings.length})`
                : `${tab} (${countByStatus(tab.toUpperCase())})`}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20 text-[#d6c7b5]">
            Loading...
          </div>
        ) : activeTab === 'tracking' ? (
          <ManagerTrackingView trackings={trackings} />
        ) : activeTab === 'orders' ? (
          <div className="space-y-5">
            {orders.map((order) => (
              <div
                key={order.id}
                className="relative overflow-hidden rounded-3xl border border-[#5a4d42] bg-[#2b241e]/90 backdrop-blur-md shadow-[0_15px_40px_rgba(0,0,0,0.45)] p-5 flex justify-between items-start gap-4 flex-wrap transition-all duration-300 hover:scale-[1.01]"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(24,20,16,0.88), rgba(24,20,16,0.92)),
                    url('https://images.unsplash.com/photo-1515442261605-65987783cb6a?q=80&w=1200&auto=format&fit=crop')
                  `,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span className="text-xl font-bold text-white">
                      Order #{order.id}
                    </span>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-[#ddd2c5]">
                    <div>
                      <p className="text-xs text-[#b89d83] uppercase font-medium">
                        Customer
                      </p>
                      <p className="font-semibold text-white">
                        {order.customer_name ?? order.customer ?? '—'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#b89d83] uppercase font-medium">
                        Batch
                      </p>
                      <p className="font-semibold text-white">
                        #{order.batch_id_short ?? order.batch}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#b89d83] uppercase font-medium">
                        Quantity
                      </p>
                      <p className="font-semibold text-white">
                        {order.quantity_kg} kg
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#b89d83] uppercase font-medium">
                        Placed
                      </p>
                      <p className="font-semibold text-white">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {order.delivery_address && (
                    <div className="mt-3 text-sm text-[#eadcc8] bg-[#4a3728]/70 border border-[#7a5b43] px-4 py-2 rounded-xl w-fit shadow-md backdrop-blur-sm">
                      📍 {order.delivery_address}
                    </div>
                  )}
                </div>

                {['PENDING', 'CONFIRMED'].includes(
                  order.status?.toUpperCase()
                ) && (
                  <button
                    onClick={() => {
                      setAssignModal(order);
                      setAssignError('');
                      setSelectedDealer('');
                      setEstimatedDate('');
                    }}
                    className="bg-[#6F4E37] hover:bg-[#7d5a42] text-white px-5 py-2 rounded-2xl text-sm font-semibold shadow-xl shadow-black/30 transition-all duration-300"
                  >
                    🚚 Assign Dealer
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="bg-[#2a231d]/90 border border-[#5d4a3a] p-10 rounded-3xl text-center text-[#d6c7b5] shadow-2xl backdrop-blur-md">
            No {activeTab} batches
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredBatches.map((batch) => (
              <div
                key={batch.id}
                className="rounded-3xl overflow-hidden border border-[#5c4939] shadow-[0_15px_40px_rgba(0,0,0,0.45)]"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(25,20,15,0.88), rgba(25,20,15,0.92)),
                    url('https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1200&auto=format&fit=crop')
                  `,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <BatchCard
                  batch={batch}
                  userRole="Manager"
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onUpdate={updateBatch}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {assignModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setAssignModal(null)}
        >
          <div
            className="bg-[#2a231d]/95 border border-[#5c4939] rounded-3xl p-6 w-full max-w-md shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl text-[#f4eee6]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(32,26,20,0.92), rgba(32,26,20,0.95)),
                url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200&auto=format&fit=crop')
              `,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-2">
              🚚 Assign Shipment
            </h2>

            <p className="text-[#d1c2b3] mb-4">
              Order #{assignModal.id}
            </p>

            <select
              value={selectedDealer}
              onChange={(e) => setSelectedDealer(e.target.value)}
              className="w-full bg-[#201914]/80 border border-[#5b4738] text-[#f5ede4] rounded-2xl px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#7b5a40]"
            >
              <option value="">Select Dealer</option>

              {dealers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.username}
                </option>
              ))}
            </select>

            <input
              type="datetime-local"
              value={estimatedDate}
              onChange={(e) => setEstimatedDate(e.target.value)}
              className="w-full bg-[#201914]/80 border border-[#5b4738] text-[#f5ede4] rounded-2xl px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#7b5a40]"
            />

            {assignError && (
              <p className="text-red-400 text-sm mb-4">{assignError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setAssignModal(null)}
                className="flex-1 border border-[#5c4939] text-[#d7c6b3] px-4 py-3 rounded-2xl hover:bg-white/5 transition-all duration-300"
              >
                Cancel
              </button>

              <button
                onClick={handleAssign}
                disabled={assigning}
                className="flex-1 bg-[#6F4E37] hover:bg-[#7d5a42] text-white px-4 py-3 rounded-2xl shadow-xl transition-all duration-300"
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