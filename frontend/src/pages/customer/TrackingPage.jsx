import { useState, useEffect, useCallback } from 'react';
import { getAllMyTrackings, advanceStatus } from '../../api/trackingApi';
import CustomerTrackingMap from '../../components/tracking/CustomerTrackingMap';
import api from '../../api/axios';

// ── Status config ─────────────────────────────────────────────────────────
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
  PENDING:    { bg: '#f5f5f5', color: '#757575', border: '#e0e0e0' },
  PICKED_UP:  { bg: '#e3f2fd', color: '#1565c0', border: '#90caf9' },
  IN_TRANSIT: { bg: '#f3e5f5', color: '#6a1b9a', border: '#ce93d8' },
  NEARBY:     { bg: '#fff3e0', color: '#e65100', border: '#ffcc80' },
  DELIVERED:  { bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' },
};

// What the customer's "approve" button says for each current status
const ADVANCE_LABEL = {
  PICKED_UP:  { text: '🚚 Confirm In Transit',  desc: 'The dealer has picked up your order. Confirm to mark it in transit.' },
  IN_TRANSIT: { text: '📍 Confirm Nearby',       desc: 'The dealer is on the way. Confirm when they are near your location.' },
  NEARBY:     { text: '✅ Confirm Delivered',    desc: 'The dealer is nearby. Confirm once you have received your order.' },
};

// ── Progress stepper ──────────────────────────────────────────────────────
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

// ── Main page ─────────────────────────────────────────────────────────────
export default function TrackingPage() {
  const [trackings, setTrackings]         = useState([]);
  const [shippedOrders, setShippedOrders] = useState([]);
  const [selected, setSelected]           = useState(null);
  const [loading, setLoading]             = useState(true);
  const [advancing, setAdvancing]         = useState(null);  // tracking.id in progress
  const [advanceMsg, setAdvanceMsg]       = useState({});    // { [id]: msg }

  const load = useCallback(async () => {
    try {
      const [trackingRes, orderRes] = await Promise.all([
        getAllMyTrackings().catch(() => []),
        api.get('/orders/?page_size=100').then((r) => {
          const d = r.data?.results ?? r.data;
          return Array.isArray(d) ? d : [];
        }).catch(() => []),
      ]);

      const allTrackings = Array.isArray(trackingRes) ? trackingRes : [];
      const allOrders    = Array.isArray(orderRes)    ? orderRes    : [];

      setTrackings(allTrackings);

      // Show SHIPPED orders that don't have a tracking record yet
      const trackedIds = new Set(allTrackings.map((t) => String(t.order_id)));
      setShippedOrders(
        allOrders.filter((o) =>
          o.status?.toUpperCase() === 'SHIPPED' && !trackedIds.has(String(o.id))
        )
      );

      setSelected((prev) => prev ?? (allTrackings[0]?.order_id ?? null));
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
      const updated = await advanceStatus(trackingId);
      setTrackings((prev) => prev.map((t) => t.id === trackingId ? { ...t, ...updated } : t));
    } catch (err) {
      setAdvanceMsg((p) => ({
        ...p,
        [trackingId]: err?.response?.data?.detail ?? 'Failed to update status.',
      }));
    } finally {
      setAdvancing(false);
    }
  };

  const isEmpty = trackings.length === 0 && shippedOrders.length === 0;

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
      <div style={{ width: 36, height: 36, border: '4px solid #E8DDD4', borderTop: '4px solid #6F4E37', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#FAF6F1', minHeight: '100vh' }}>
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>

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

        {isEmpty ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <p style={{ fontSize: 48 }}>🚚</p>
            <p style={{ fontSize: 18, color: '#5C3D1E', marginTop: 12 }}>No active shipments</p>
            <p style={{ color: '#9E7B5A', marginTop: 6 }}>
              Your orders will appear here once a manager ships them.
            </p>
          </div>
        ) : (
          <>
            {/* ── Active tracked deliveries ── */}
            {trackings.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                {trackings.map((t) => {
                  const sc          = STEP_COLOR[t.status] ?? STEP_COLOR.PENDING;
                  const isSelected  = String(selected) === String(t.order_id);
                  const isAdvancing = advancing === t.id;
                  const msg         = advanceMsg[t.id];
                  const advance     = ADVANCE_LABEL[t.status]; // null if no action needed

                  return (
                    <div
                      key={t.id}
                      style={{
                        background: '#fff',
                        borderRadius: 16,
                        border: `2px solid ${advance ? '#6F4E37' : isSelected ? '#6F4E37' : '#E8DDD4'}`,
                        padding: '18px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 14,
                        boxShadow: advance ? '0 2px 16px rgba(111,78,55,0.10)' : 'none',
                      }}
                    >
                      {/* Top row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
                            <span style={{ fontWeight: 700, fontSize: 15, color: '#2d1a0e' }}>
                              Order #{t.order_id}
                            </span>
                            <span style={{
                              padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                              background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                            }}>
                              {STEP_ICON[t.status]} {STEP_LABEL[t.status]}
                            </span>
                          </div>
                          <div style={{ fontSize: 13, color: '#9E7B5A', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                            <span>🚚 {t.dealer_name}</span>
                            <span>📦 {t.quantity_kg} kg</span>
                            {t.delivery_address && <span>📍 {t.delivery_address}</span>}
                          </div>
                        </div>

                        {/* Map toggle — only when dealer has shared location */}
                        {t.latitude && t.longitude && t.status !== 'DELIVERED' && (
                          <button
                            onClick={() => setSelected(isSelected ? null : t.order_id)}
                            style={{
                              padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                              background: isSelected ? '#6F4E37' : '#fff',
                              color: isSelected ? '#fff' : '#6F4E37',
                              border: '2px solid #6F4E37', cursor: 'pointer', whiteSpace: 'nowrap',
                            }}
                          >
                            {isSelected ? '📍 Tracking' : '🗺 View Map'}
                          </button>
                        )}
                      </div>

                      {/* Progress stepper */}
                      <Stepper status={t.status} />

                      {/* ── Customer action button ── */}
                      {advance && (
                        <div style={{
                          background: '#FAF6F1', border: '1.5px solid #D4C0A8',
                          borderRadius: 12, padding: '14px 16px',
                        }}>
                          <p style={{ fontSize: 13, color: '#6F4E37', marginBottom: 10 }}>
                            {advance.desc}
                          </p>
                          <button
                            onClick={() => handleAdvance(t.id)}
                            disabled={isAdvancing}
                            style={{
                              padding: '10px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                              background: '#6F4E37', color: '#fff', border: 'none',
                              cursor: isAdvancing ? 'not-allowed' : 'pointer',
                              opacity: isAdvancing ? 0.6 : 1,
                            }}
                          >
                            {isAdvancing ? 'Updating…' : advance.text}
                          </button>
                          {msg && (
                            <p style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: '#c0392b' }}>
                              {msg}
                            </p>
                          )}
                        </div>
                      )}

                      {/* ── Delivered banner ── */}
                      {t.status === 'DELIVERED' && (
                        <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#2e7d32' }}>
                            ✅ Delivery complete! Thank you for your order.
                          </p>
                        </div>
                      )}

                      {/* ── Pending info ── */}
                      {t.status === 'PENDING' && (
                        <div style={{ background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 10, padding: '10px 14px' }}>
                          <p style={{ fontSize: 13, color: '#757575', fontWeight: 600 }}>
                            ⏳ Waiting for the dealer to pick up your order.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Shipped orders with no tracking record yet ── */}
            {shippedOrders.length > 0 && (
              <>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#9E7B5A', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                  Awaiting Dealer Assignment
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
                  {shippedOrders.map((o) => (
                    <div key={o.id} style={{
                      background: '#fff', borderRadius: 14, border: '1px solid #E8DDD4',
                      padding: '14px 18px', display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', flexWrap: 'wrap', gap: 10,
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#2d1a0e', marginBottom: 4 }}>
                          Order #{o.id}
                          <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: '#f5f5f5', color: '#757575', border: '1px solid #e0e0e0' }}>
                            ⏳ Pending
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#9E7B5A', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          <span>📦 {o.quantity_kg} kg</span>
                          <span>🗓 {new Date(o.created_at).toLocaleDateString()}</span>
                          {o.delivery_address && <span>📍 {o.delivery_address}</span>}
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: '#B8A090', fontStyle: 'italic' }}>
                        No dealer assigned yet
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── Live map ── */}
            {selected && trackings.some((t) => String(t.order_id) === String(selected) && t.latitude) && (
              <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #E8DDD4', marginTop: 8 }}>
                <CustomerTrackingMap orderId={selected} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
