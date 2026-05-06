import { useState, useEffect, useCallback } from 'react';
import { getAllMyTrackings, advanceStatus } from '../../api/trackingApi';
import CustomerTrackingMap from '../../components/tracking/CustomerTrackingMap';
import api from '../../api/axios';

// ─────────────────────────────────────────────────────────────────────────────
// Status display config
//
// STEPS        — the ordered list of all 5 delivery stages
// STEP_LABEL   — human-readable name for each stage
// STEP_ICON    — emoji shown on the progress stepper
// STEP_COLOR   — background/text/border colours for the status badge
// ADVANCE_LABEL — the button text and description shown to the customer
//                 when they need to confirm the next step.
//                 Only PICKED_UP, IN_TRANSIT, and NEARBY have a button —
//                 PENDING has no button (waiting for dealer) and
//                 DELIVERED has no button (already done).
// ─────────────────────────────────────────────────────────────────────────────
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

const ADVANCE_LABEL = {
  PICKED_UP:  { text: '🚚 Confirm In Transit',  desc: 'The dealer has picked up your order. Confirm to mark it in transit.' },
  IN_TRANSIT: { text: '📍 Confirm Nearby',       desc: 'The dealer is on the way. Confirm when they are near your location.' },
  NEARBY:     { text: '✅ Confirm Delivered',    desc: 'The dealer is nearby. Confirm once you have received your order.' },
};


// ─────────────────────────────────────────────────────────────────────────────
// Stepper component
//
// Draws the horizontal row of circles (⏳ → 📦 → 🚚 → 📍 → ✅).
// - Steps before the current one are filled brown with a checkmark.
// - The current step has a white circle with a brown ring glow.
// - Future steps are greyed out.
// ─────────────────────────────────────────────────────────────────────────────
function Stepper({ status }) {
  const currentIdx = STEPS.indexOf(status);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 4 }}>
      {STEPS.map((s, i) => {
        const done    = i < currentIdx;
        const current = i === currentIdx;
        return (
          <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 58, position: 'relative' }}>
            {/* Connecting line between dots */}
            {i > 0 && (
              <div style={{
                position: 'absolute', top: 16, right: '50%', width: '100%', height: 2,
                background: i <= currentIdx ? '#6F4E37' : '#E0D0C0', zIndex: 0,
              }} />
            )}
            {/* Circle dot */}
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
            {/* Label below the dot */}
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


// ─────────────────────────────────────────────────────────────────────────────
// TrackingPage — main customer tracking screen
//
// What this page does:
//   1. Loads all the customer's tracking records + all their orders on mount.
//   2. Auto-refreshes every 15 seconds so the status stays up to date.
//   3. Shows a card for each active delivery with a progress stepper.
//   4. Shows a confirm button when the customer needs to approve the next step.
//   5. Shows a separate section for orders that are SHIPPED but don't have a
//      dealer assigned yet (no tracking record exists for them).
//   6. Shows a live map below the cards when the dealer has shared their location.
// ─────────────────────────────────────────────────────────────────────────────
export default function TrackingPage() {
  const [trackings, setTrackings]         = useState([]);
  const [shippedOrders, setShippedOrders] = useState([]);  // SHIPPED orders with no tracking yet
  const [selected, setSelected]           = useState(null); // order_id whose map is open
  const [loading, setLoading]             = useState(true);
  const [advancing, setAdvancing]         = useState(null); // tracking.id currently being confirmed
  const [advanceMsg, setAdvanceMsg]       = useState({});   // error messages keyed by tracking.id

  // ── Load data from the server ─────────────────────────────────────────────
  // Fetches both tracking records and orders in parallel.
  // Orders that are SHIPPED but have no tracking record are shown separately
  // so the customer knows their order is on its way but no dealer is assigned yet.
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

      // Find SHIPPED orders that don't have a tracking record yet
      const trackedIds = new Set(allTrackings.map((t) => String(t.order_id)));
      setShippedOrders(
        allOrders.filter((o) =>
          o.status?.toUpperCase() === 'SHIPPED' && !trackedIds.has(String(o.id))
        )
      );

      // Auto-select the first tracking on first load (opens its map by default)
      setSelected((prev) => prev ?? (allTrackings[0]?.order_id ?? null));
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Auto-refresh every 15 seconds ────────────────────────────────────────
  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval); // clean up when the page unmounts
  }, [load]);

  // ── Handle the customer's confirm button ──────────────────────────────────
  // Calls the backend advance-status endpoint, then updates the local state
  // immediately so the UI reflects the new status without waiting for the
  // next auto-refresh.
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

  // ── Loading spinner ───────────────────────────────────────────────────────
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

        {/* ── Page header with manual refresh button ── */}
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

        {/* ── Empty state — no shipments at all ── */}
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
            {/* ── Section 1: Active tracked deliveries ─────────────────────────
                Each card shows:
                  - order number + status badge
                  - dealer name, quantity, delivery address
                  - a progress stepper showing all 5 stages
                  - a confirm button if the customer needs to act
                  - a "View Map" button if the dealer has shared their location
            ─────────────────────────────────────────────────────────────────── */}
            {trackings.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                {trackings.map((t) => {
                  const sc          = STEP_COLOR[t.status] ?? STEP_COLOR.PENDING;
                  const isSelected  = String(selected) === String(t.order_id);
                  const isAdvancing = advancing === t.id;
                  const msg         = advanceMsg[t.id];
                  // advance is null for PENDING and DELIVERED — no button needed
                  const advance     = ADVANCE_LABEL[t.status];

                  return (
                    <div
                      key={t.id}
                      style={{
                        background: '#fff',
                        borderRadius: 16,
                        // Highlight the card border when the customer needs to act
                        border: `2px solid ${advance ? '#6F4E37' : isSelected ? '#6F4E37' : '#E8DDD4'}`,
                        padding: '18px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 14,
                        boxShadow: advance ? '0 2px 16px rgba(111,78,55,0.10)' : 'none',
                      }}
                    >
                      {/* Order number, status badge, dealer info */}
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

                        {/* Map toggle button — only shown when dealer has a location */}
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

                      {/* ── Confirm button (only shown when customer needs to act) ── */}
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

                      {/* Delivered — show a completion banner instead of a button */}
                      {t.status === 'DELIVERED' && (
                        <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#2e7d32' }}>
                            ✅ Delivery complete! Thank you for your order.
                          </p>
                        </div>
                      )}

                      {/* Pending — show an info message, no button */}
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

            {/* ── Section 2: SHIPPED orders with no dealer assigned yet ─────────
                These are orders the manager has marked as shipped but hasn't
                assigned a dealer to yet. No tracking record exists for them,
                so we just show basic order info and a "no dealer yet" note.
            ─────────────────────────────────────────────────────────────────── */}
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

            {/* ── Section 3: Live map ───────────────────────────────────────────
                Only shown when the customer has clicked "View Map" on a card
                AND the dealer for that order has shared their GPS location.
                The map component polls the server every 10 seconds on its own.
            ─────────────────────────────────────────────────────────────────── */}
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
