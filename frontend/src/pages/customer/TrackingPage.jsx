import { useState, useEffect, useCallback, useRef } from 'react';
import { getAllMyTrackings, advanceStatus } from '../../api/trackingApi';
import api from '../../api/axios';

// ── Status config ─────────────────────────────────────────────────────────────
const STEPS = ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'NEARBY', 'DELIVERED'];

const STEP_LABEL = {
  PENDING:    'Pending Pickup',
  PICKED_UP:  'Picked Up',
  IN_TRANSIT: 'In Transit',
  NEARBY:     'Nearby',
  DELIVERED:  'Delivered',
};

const STEP_ICON = {
  PENDING: '⏳', PICKED_UP: '📦', IN_TRANSIT: '🚚', NEARBY: '📍', DELIVERED: '✅',
};

const STEP_COLOR = {
  PENDING:    { bg: '#f5f5f5',  color: '#757575', border: '#e0e0e0' },
  PICKED_UP:  { bg: '#e3f2fd',  color: '#1565c0', border: '#90caf9' },
  IN_TRANSIT: { bg: '#f3e5f5',  color: '#6a1b9a', border: '#ce93d8' },
  NEARBY:     { bg: '#fff3e0',  color: '#e65100', border: '#ffcc80' },
  DELIVERED:  { bg: '#e8f5e9',  color: '#2e7d32', border: '#a5d6a7' },
};

// Customer confirm buttons — all three transitions:
//   PICKED_UP  → customer confirms → IN_TRANSIT
//   IN_TRANSIT → customer confirms → NEARBY
//   NEARBY     → customer confirms → DELIVERED
const ADVANCE_LABEL = {
  PICKED_UP: {
    text: '🚚 Confirm In Transit',
    desc: 'The dealer has picked up your order. Tap to confirm it is now in transit.',
    color: '#1565c0',
    bg: '#e3f2fd',
    border: '#90caf9',
  },
  IN_TRANSIT: {
    text: '📍 Confirm Nearby',
    desc: 'The dealer is on the way. Tap to confirm they are near your location.',
    color: '#e65100',
    bg: '#fff3e0',
    border: '#ffcc80',
  },
  NEARBY: {
    text: '✅ Confirm Delivered',
    desc: 'The dealer is nearby. Tap once you have received your order.',
    color: '#2e7d32',
    bg: '#e8f5e9',
    border: '#a5d6a7',
  },
};

// ── Stepper ───────────────────────────────────────────────────────────────────
function Stepper({ status }) {
  const currentIdx = STEPS.indexOf(status);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 4 }}>
      {STEPS.map((s, i) => {
        const done    = i < currentIdx;
        const current = i === currentIdx;
        return (
          <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 58, position: 'relative' }}>
            {i > 0 && (
              <div style={{
                position: 'absolute', top: 16, right: '50%', width: '100%', height: 2,
                background: i <= currentIdx ? '#6F4E37' : '#E0D0C0', zIndex: 0,
              }} />
            )}
            <div style={{
              width: 32, height: 32, borderRadius: '50%', zIndex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700,
              background: done ? '#6F4E37' : current ? '#fff' : '#F5EDE6',
              border: `2px solid ${done || current ? '#6F4E37' : '#E0D0C0'}`,
              color: done ? '#fff' : current ? '#6F4E37' : '#C0A080',
              boxShadow: current ? '0 0 0 4px rgba(111,78,55,0.15)' : 'none',
            }}>
              {done ? '✓' : STEP_ICON[s]}
            </div>
            <div style={{
              fontSize: 9, marginTop: 5, textAlign: 'center', lineHeight: 1.3,
              color: done || current ? '#6F4E37' : '#B8A090',
              fontWeight: current ? 700 : 400,
            }}>
              {STEP_LABEL[s]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Inline live map (Leaflet, loaded from CDN) ────────────────────────────────
// Renders inside the tracking card when the dealer has shared their location.
// Polls every 10 s to move the truck marker as the dealer drives.
function LiveMap({ tracking }) {
  const mapRef    = useRef(null);
  const markerRef = useRef(null);
  const initRef   = useRef(false);
  const pollRef   = useRef(null);
  const [fresh, setFresh] = useState(tracking);

  // Poll for updated location every 10 s
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`tracking/${tracking.id}/`);
        setFresh(res.data);
      } catch { /* silent */ }
    }, 10000);
    return () => clearInterval(pollRef.current);
  }, [tracking.id]);

  // Build / update map
  useEffect(() => {
    if (!fresh?.latitude || !fresh?.longitude) return;
    const lat = parseFloat(fresh.latitude);
    const lng = parseFloat(fresh.longitude);

    // Just move the marker if map already exists
    if (initRef.current && markerRef.current && mapRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapRef.current.panTo([lat, lng]);
      return;
    }

    const build = (L) => {
      if (initRef.current) return;
      initRef.current = true;

      const map = L.map(`live-map-${tracking.id}`).setView([lat, lng], 14);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      // Dealer truck marker
      const truckIcon = L.divIcon({
        html: `<div style="background:#6F4E37;color:#fff;width:40px;height:40px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 12px rgba(111,78,55,0.4);border:3px solid #fff;"><span style="transform:rotate(45deg)">🚚</span></div>`,
        className: '', iconSize: [40, 40], iconAnchor: [20, 40],
      });
      markerRef.current = L.marker([lat, lng], { icon: truckIcon })
        .addTo(map)
        .bindPopup(`<b>🚚 ${fresh.dealer_name}</b><br>Your delivery is on the way`);

      // Destination marker
      if (fresh.delivery_lat && fresh.delivery_lng) {
        const dLat = parseFloat(fresh.delivery_lat);
        const dLng = parseFloat(fresh.delivery_lng);
        const homeIcon = L.divIcon({
          html: `<div style="background:#e65100;color:#fff;width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 3px 10px rgba(230,81,0,0.4);border:2px solid #fff;"><span style="transform:rotate(45deg)">🏠</span></div>`,
          className: '', iconSize: [36, 36], iconAnchor: [18, 36],
        });
        L.marker([dLat, dLng], { icon: homeIcon })
          .addTo(map)
          .bindPopup(`<b>📍 Your delivery address</b><br>${fresh.delivery_address || ''}`);
        L.polyline([[lat, lng], [dLat, dLng]], {
          color: '#6F4E37', weight: 2, dashArray: '6 8', opacity: 0.6,
        }).addTo(map);
        map.fitBounds([[lat, lng], [dLat, dLng]], { padding: [40, 40] });
      }
    };

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css'; link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    if (window.L) { build(window.L); return; }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => build(window.L);
    document.head.appendChild(script);
  }, [fresh]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch (_) {}
        mapRef.current = null;
        markerRef.current = null;
        initRef.current = false;
      }
    };
  }, []);

  const isLive = fresh?.location_fresh;

  return (
    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid #E8DDD4', marginTop: 4 }}>
      <div id={`live-map-${tracking.id}`} style={{ height: 280, width: '100%' }} />
      {isLive && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          background: '#6F4E37', color: '#fff',
          padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <span style={{ animation: 'pulse 1.5s infinite', display: 'inline-block' }}>●</span>
          Live
        </div>
      )}
      {!fresh?.latitude && (
        <div style={{
          position: 'absolute', inset: 0, background: '#F5EFE8',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <p style={{ fontSize: 32 }}>🗺️</p>
          <p style={{ color: '#9E7B5A', fontSize: 13, marginTop: 8 }}>Waiting for dealer to share location…</p>
        </div>
      )}
    </div>
  );
}

// ── TrackingPage ──────────────────────────────────────────────────────────────
export default function TrackingPage() {
  const [trackings, setTrackings]         = useState([]);
  const [shippedOrders, setShippedOrders] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [advancing, setAdvancing]         = useState(null);
  const [advanceMsg, setAdvanceMsg]       = useState({});
  const [mapOpen, setMapOpen]             = useState({});  // trackingId → bool

  const load = useCallback(async () => {
    try {
      // Fetch orders and trackings in parallel
      const [orderRes, trackingRes] = await Promise.all([
        api.get('orders/?page_size=100').then((r) => {
          const d = r.data?.results ?? r.data;
          return Array.isArray(d) ? d : [];
        }).catch(() => []),
        getAllMyTrackings().catch(() => []),
      ]);

      const allOrders    = Array.isArray(orderRes)    ? orderRes    : [];
      const allTrackings = Array.isArray(trackingRes) ? trackingRes : [];

      // Build a map of order_id → tracking record for quick lookup
      const trackingByOrderId = {};
      allTrackings.forEach((t) => { trackingByOrderId[String(t.order_id)] = t; });

      // Active tracking cards: any order that has a tracking record
      setTrackings(allTrackings);

      // "Awaiting dealer" section: SHIPPED orders with NO tracking record yet
      setShippedOrders(
        allOrders.filter((o) =>
          o.status?.toUpperCase() === 'SHIPPED' &&
          !trackingByOrderId[String(o.id)]
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const handleAdvance = async (trackingId) => {
    setAdvancing(trackingId);
    setAdvanceMsg((p) => ({ ...p, [trackingId]: '' }));
    try {
      console.log('Calling advanceStatus for tracking:', trackingId);
      const updated = await advanceStatus(trackingId);
      console.log('Received updated tracking:', updated);
      // Update the tracking record with the new status
      setTrackings((prev) => {
        const newTrackings = prev.map((t) => t.id === trackingId ? { ...t, ...updated } : t);
        console.log('Updated trackings state:', newTrackings);
        return newTrackings;
      });
      // Clear any error messages
      setAdvanceMsg((p) => ({ ...p, [trackingId]: '' }));
    } catch (err) {
      console.error('Advance status error:', err);
      console.error('Error response:', err?.response?.data);
      const errorMsg = err?.response?.data?.detail ?? err?.message ?? 'Failed to update status.';
      setAdvanceMsg((p) => ({
        ...p,
        [trackingId]: errorMsg,
      }));
    } finally {
      setAdvancing(null);
    }
  };

  const toggleMap = (id) => setMapOpen((p) => ({ ...p, [id]: !p[id] }));

  const isEmpty = trackings.length === 0 && shippedOrders.length === 0;

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
      <div style={{ width: 36, height: 36, border: '4px solid #E8DDD4', borderTop: '4px solid #6F4E37', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  const sorted = [...trackings].sort((a, b) => {
    if (a.status === 'DELIVERED' && b.status !== 'DELIVERED') return 1;
    if (a.status !== 'DELIVERED' && b.status === 'DELIVERED') return -1;
    return 0;
  });

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#FAF6F1', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#3E1F00', margin: 0 }}>
              📍 My Shipments
            </h1>
            <p style={{ color: '#9E7B5A', fontSize: 14, marginTop: 6 }}>
              Track and confirm your deliveries. Auto-refreshes every 15 s.
            </p>
          </div>
          <button
            onClick={() => { setLoading(true); load(); }}
            style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: '#6F4E37', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Empty state */}
        {isEmpty ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <p style={{ fontSize: 48 }}>🚚</p>
            <p style={{ fontSize: 18, color: '#5C3D1E', marginTop: 12 }}>No shipments yet</p>
            <p style={{ color: '#9E7B5A', marginTop: 6 }}>Your shipped orders will appear here once a manager processes them.</p>
          </div>
        ) : (
          <>
            {/* ── Active tracking cards ── */}
            {sorted.filter(t => t.status !== 'DELIVERED').length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#6F4E37', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                  🚚 Active Shipments ({sorted.filter(t => t.status !== 'DELIVERED').length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {sorted.filter(t => t.status !== 'DELIVERED').map((t) => {
                    const sc          = STEP_COLOR[t.status] ?? STEP_COLOR.PENDING;
                    const isAdvancing = advancing === t.id;
                    const msg         = advanceMsg[t.id];
                    const advance     = ADVANCE_LABEL[t.status];
                    const hasLocation = !!(t.latitude && t.longitude);
                    const showMap     = mapOpen[t.id];

                    return (
                      <div key={t.id} style={{
                        background: '#fff', borderRadius: 16,
                        border: `2px solid ${advance ? advance.border : '#E8DDD4'}`,
                        padding: '18px 20px',
                        display: 'flex', flexDirection: 'column', gap: 14,
                        boxShadow: advance ? `0 2px 16px ${advance.border}` : 'none',
                      }}>

                        {/* Top row: order info + map button */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
                              <span style={{ fontWeight: 700, fontSize: 15, color: '#2d1a0e' }}>Order #{t.order_id}</span>
                              <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                                {STEP_ICON[t.status]} {STEP_LABEL[t.status]}
                              </span>
                            </div>
                            <div style={{ fontSize: 13, color: '#9E7B5A', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                              <span>🚚 {t.dealer_name}</span>
                              <span>📦 {t.quantity_kg} kg</span>
                              {t.delivery_address && <span>📍 {t.delivery_address}</span>}
                            </div>
                          </div>

                          {/* Show map button whenever dealer has location */}
                          {hasLocation && (
                            <button
                              onClick={() => toggleMap(t.id)}
                              style={{
                                padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                                background: showMap ? '#6F4E37' : '#fff',
                                color: showMap ? '#fff' : '#6F4E37',
                                border: '2px solid #6F4E37', cursor: 'pointer', whiteSpace: 'nowrap',
                              }}
                            >
                              {showMap ? '📍 Hide Map' : '🗺 View Map'}
                            </button>
                          )}
                        </div>

                        {/* Progress stepper */}
                        <Stepper status={t.status} />

                        {/* PENDING info */}
                        {t.status === 'PENDING' && (
                          <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 10, padding: '10px 14px' }}>
                            <p style={{ fontSize: 13, color: '#f57f17', fontWeight: 600 }}>
                              ⏳ A dealer has been assigned and will pick up your order soon.
                            </p>
                          </div>
                        )}

                        {/* Customer confirm button — PICKED_UP, IN_TRANSIT, NEARBY */}
                        {advance && (
                          <div style={{
                            background: advance.bg,
                            border: `2px solid ${advance.border}`,
                            borderRadius: 12, padding: '14px 16px',
                          }}>
                            <p style={{ fontSize: 13, color: advance.color, marginBottom: 10, fontWeight: 500 }}>{advance.desc}</p>
                            <button
                              onClick={() => handleAdvance(t.id)}
                              disabled={isAdvancing}
                              style={{
                                padding: '11px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                                background: advance.color, color: '#fff', border: 'none',
                                cursor: isAdvancing ? 'not-allowed' : 'pointer',
                                opacity: isAdvancing ? 0.6 : 1,
                                boxShadow: `0 2px 8px ${advance.border}`,
                              }}
                            >
                              {isAdvancing ? 'Updating…' : advance.text}
                            </button>
                            {msg && (
                              <p style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: msg.startsWith('✅') ? '#2e7d32' : '#c0392b' }}>
                                {msg}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Live map — inline inside the card */}
                        {showMap && hasLocation && (
                          <LiveMap tracking={t} />
                        )}

                        {/* No location yet but dealer is active — show placeholder */}
                        {!hasLocation && ['PICKED_UP', 'IN_TRANSIT', 'NEARBY'].includes(t.status) && (
                          <div style={{ background: '#F5EFE8', borderRadius: 12, padding: '16px', textAlign: 'center', border: '1px dashed #D4C0A8' }}>
                            <p style={{ fontSize: 28 }}>🗺️</p>
                            <p style={{ fontSize: 13, color: '#9E7B5A', marginTop: 6 }}>Waiting for dealer to share their location…</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── SHIPPED orders with no dealer yet ── */}
            {shippedOrders.length > 0 && (
              <>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#e65100', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                  🚚 Shipped — Awaiting Dealer Assignment ({shippedOrders.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
                  {shippedOrders.map((o) => (
                    <div key={o.id} style={{
                      background: '#fff', borderRadius: 14, border: '2px solid #ffcc80',
                      padding: '14px 18px', display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', flexWrap: 'wrap', gap: 10,
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#2d1a0e', marginBottom: 4 }}>
                          Order #{o.id}
                          <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: '#fff3e0', color: '#e65100', border: '1px solid #ffcc80' }}>
                            🚚 Shipped
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#9E7B5A', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          <span>📦 {o.quantity_kg} kg</span>
                          <span>🗓 {new Date(o.created_at).toLocaleDateString()}</span>
                          {o.delivery_address && <span>📍 {o.delivery_address}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <span style={{ fontSize: 12, color: '#B8A090', fontStyle: 'italic' }}>Waiting for dealer assignment</span>
                        <span style={{ fontSize: 11, color: '#e65100' }}>⏳ A manager will assign a dealer soon</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── Delivered history ── */}
            {sorted.filter(t => t.status === 'DELIVERED').length > 0 && (
              <>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#2e7d32', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                  ✅ Delivered ({sorted.filter(t => t.status === 'DELIVERED').length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
                  {sorted.filter(t => t.status === 'DELIVERED').map((t) => (
                    <div key={t.id} style={{
                      background: '#fff', borderRadius: 14, border: '1px solid #a5d6a7',
                      padding: '14px 18px', display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', flexWrap: 'wrap', gap: 10,
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#2d1a0e', marginBottom: 4 }}>
                          Order #{t.order_id}
                          <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7' }}>
                            ✅ Delivered
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#9E7B5A', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          <span>🚚 {t.dealer_name}</span>
                          <span>📦 {t.quantity_kg} kg</span>
                          {t.delivery_address && <span>📍 {t.delivery_address}</span>}
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: '#2e7d32', fontWeight: 600 }}>Delivery complete</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
