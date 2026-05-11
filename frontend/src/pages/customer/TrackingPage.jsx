import { useState, useEffect, useCallback, useRef } from 'react';
import { getAllMyTrackings, advanceStatus } from '../../api/trackingApi';
import api from '../../api/axios';

// ── THEME ────────────────────────────────────────────────────────────────────
const THEME = {
  bg: '#1F1A17',
  surface: '#2B241F',
  surfaceSoft: '#332B25',
  cardOverlay: 'rgba(28,22,18,0.78)',
  border: '#4A3C32',
  text: '#F5EFE7',
  muted: '#C7B299',
  green: '#5E7C4F',
  greenSoft: '#7A9B69',
  brown: '#6F4E37',
  brownLight: '#9B7356',
  shadow: '0 10px 30px rgba(0,0,0,0.35)',
};

const CARD_BG =
  'https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=1600&auto=format&fit=crop';

const FARM_BG =
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1600&auto=format&fit=crop';

// ── Status config ────────────────────────────────────────────────────────────
const STEPS = ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'NEARBY', 'DELIVERED'];

const STEP_LABEL = {
  PENDING: 'Pending Pickup',
  PICKED_UP: 'Picked Up',
  IN_TRANSIT: 'In Transit',
  NEARBY: 'Nearby',
  DELIVERED: 'Delivered',
};

const STEP_ICON = {
  PENDING: '⏳',
  PICKED_UP: '📦',
  IN_TRANSIT: '🚚',
  NEARBY: '📍',
  DELIVERED: '✅',
};

const STEP_COLOR = {
  PENDING: { bg: '#3A312B', color: '#C7B299', border: '#5A4A3E' },
  PICKED_UP: { bg: '#2E3B34', color: '#D7E4D0', border: '#5E7C4F' },
  IN_TRANSIT: { bg: '#3B2E2E', color: '#F5EFE7', border: '#6F4E37' },
  NEARBY: { bg: '#4A3728', color: '#F5EFE7', border: '#9B7356' },
  DELIVERED: { bg: '#2E3B34', color: '#D7E4D0', border: '#7A9B69' },
};

const ADVANCE_LABEL = {
  PICKED_UP: {
    text: '🚚 Confirm In Transit',
    desc: 'The dealer has picked up your order. Tap to confirm it is now in transit.',
  },
  IN_TRANSIT: {
    text: '📍 Confirm Nearby',
    desc: 'The dealer is on the way. Tap to confirm they are near your location.',
  },
  NEARBY: {
    text: '✅ Confirm Delivered',
    desc: 'The dealer is nearby. Tap once you have received your order.',
  },
};

// ── Stepper ──────────────────────────────────────────────────────────────────
function Stepper({ status }) {
  const currentIdx = STEPS.indexOf(status);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        overflowX: 'auto',
        paddingBottom: 4,
      }}
    >
      {STEPS.map((s, i) => {
        const done = i < currentIdx;
        const current = i === currentIdx;

        return (
          <div
            key={s}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1,
              minWidth: 58,
              position: 'relative',
            }}
          >
            {i > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 16,
                  right: '50%',
                  width: '100%',
                  height: 2,
                  background:
                    i <= currentIdx
                      ? 'linear-gradient(90deg,#6F4E37,#5E7C4F)'
                      : '#4A3C32',
                  zIndex: 0,
                }}
              />
            )}

            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                background: done
                  ? 'linear-gradient(135deg,#6F4E37,#4E6A42)'
                  : current
                  ? '#2E2823'
                  : '#3A312B',
                border: `2px solid ${
                  done || current ? '#7FA36B' : '#5A4A3E'
                }`,
                color: done ? '#fff' : '#F5EFE7',
                boxShadow: current
                  ? '0 0 0 4px rgba(127,163,107,0.2)'
                  : '0 4px 10px rgba(0,0,0,0.25)',
              }}
            >
              {done ? '✓' : STEP_ICON[s]}
            </div>

            <div
              style={{
                fontSize: 9,
                marginTop: 6,
                textAlign: 'center',
                lineHeight: 1.3,
                color: done || current ? '#F5EFE7' : '#BCA48E',
                fontWeight: current ? 700 : 400,
              }}
            >
              {STEP_LABEL[s]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Live Map ─────────────────────────────────────────────────────────────────
function LiveMap({ tracking }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const initRef = useRef(false);
  const pollRef = useRef(null);

  const [fresh, setFresh] = useState(tracking);

  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`tracking/${tracking.id}/`);
        setFresh(res.data);
      } catch {}
    }, 10000);

    return () => clearInterval(pollRef.current);
  }, [tracking.id]);

  useEffect(() => {
    if (!fresh?.latitude || !fresh?.longitude) return;

    const lat = parseFloat(fresh.latitude);
    const lng = parseFloat(fresh.longitude);

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

      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '© OpenStreetMap contributors',
        }
      ).addTo(map);

      const truckIcon = L.divIcon({
        html: `<div style="background:#6F4E37;color:#fff;width:40px;height:40px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 12px rgba(0,0,0,0.4);border:3px solid #fff;"><span style="transform:rotate(45deg)">🚚</span></div>`,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });

      markerRef.current = L.marker([lat, lng], { icon: truckIcon })
        .addTo(map)
        .bindPopup(
          `<b>🚚 ${fresh.dealer_name}</b><br>Your delivery is on the way`
        );
    };

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href =
        'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';

      document.head.appendChild(link);
    }

    if (window.L) {
      build(window.L);
      return;
    }

    const script = document.createElement('script');
    script.src =
      'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

    script.onload = () => build(window.L);

    document.head.appendChild(script);
  }, [fresh, tracking.id]);

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 18,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        marginTop: 8,
        boxShadow: THEME.shadow,
      }}
    >
      <div
        id={`live-map-${tracking.id}`}
        style={{ height: 280, width: '100%' }}
      />
    </div>
  );
}

// ── Tracking Page ────────────────────────────────────────────────────────────
export default function TrackingPage() {
  const [trackings, setTrackings] = useState([]);
  const [shippedOrders, setShippedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(null);
  const [advanceMsg, setAdvanceMsg] = useState({});
  const [mapOpen, setMapOpen] = useState({});

  const load = useCallback(async () => {
    try {
      const [orderRes, trackingRes] = await Promise.all([
        api
          .get('orders/?page_size=100')
          .then((r) => {
            const d = r.data?.results ?? r.data;
            return Array.isArray(d) ? d : [];
          })
          .catch(() => []),

        getAllMyTrackings().catch(() => []),
      ]);

      const allOrders = Array.isArray(orderRes) ? orderRes : [];
      const allTrackings = Array.isArray(trackingRes)
        ? trackingRes
        : [];

      const trackingByOrderId = {};

      allTrackings.forEach((t) => {
        trackingByOrderId[String(t.order_id)] = t;
      });

      setTrackings(allTrackings);

      setShippedOrders(
        allOrders.filter(
          (o) =>
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

    try {
      const updated = await advanceStatus(trackingId);

      setTrackings((prev) =>
        prev.map((t) =>
          t.id === trackingId ? { ...t, ...updated } : t
        )
      );
    } catch (err) {
      setAdvanceMsg((p) => ({
        ...p,
        [trackingId]:
          err?.response?.data?.detail ??
          'Failed to update status.',
      }));
    } finally {
      setAdvancing(null);
    }
  };

  const toggleMap = (id) =>
    setMapOpen((p) => ({
      ...p,
      [id]: !p[id],
    }));

  const isEmpty =
    trackings.length === 0 && shippedOrders.length === 0;

  if (loading)
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: 80,
          background: THEME.bg,
          minHeight: '100vh',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: '4px solid #3A312B',
            borderTop: '4px solid #7A9B69',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      </div>
    );

  const sorted = [...trackings].sort((a, b) => {
    if (a.status === 'DELIVERED' && b.status !== 'DELIVERED')
      return 1;

    if (a.status !== 'DELIVERED' && b.status === 'DELIVERED')
      return -1;

    return 0;
  });

  return (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        minHeight: '100vh',
        background: `
          linear-gradient(rgba(18,15,12,0.88), rgba(18,15,12,0.92)),
          url(${FARM_BG})
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <div
        style={{
          maxWidth: 920,
          margin: '0 auto',
          padding: '30px 20px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 28,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 30,
                color: THEME.text,
                margin: 0,
              }}
            >
              📍 My Shipments
            </h1>

            <p
              style={{
                color: THEME.muted,
                fontSize: 14,
                marginTop: 6,
              }}
            >
              Track and confirm your deliveries.
            </p>
          </div>

          <button
            onClick={() => {
              setLoading(true);
              load();
            }}
            style={{
              padding: '10px 18px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 700,
              background:
                'linear-gradient(135deg,#6F4E37,#4E6A42)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
              boxShadow: THEME.shadow,
            }}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Empty */}
        {isEmpty ? (
          <div
            style={{
              textAlign: 'center',
              padding: 90,
              background: 'rgba(0,0,0,0.28)',
              borderRadius: 24,
              backdropFilter: 'blur(10px)',
              border:
                '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <p style={{ fontSize: 48 }}>🚚</p>

            <p
              style={{
                fontSize: 20,
                color: THEME.text,
                marginTop: 12,
              }}
            >
              No shipments yet
            </p>

            <p
              style={{
                color: THEME.muted,
                marginTop: 6,
              }}
            >
              Your shipped orders will appear here soon.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}
          >
            {sorted.map((t) => {
              const sc =
                STEP_COLOR[t.status] ?? STEP_COLOR.PENDING;

              const advance = ADVANCE_LABEL[t.status];

              const hasLocation =
                !!(t.latitude && t.longitude);

              const showMap = mapOpen[t.id];

              return (
                <div
                  key={t.id}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 22,
                    padding: '20px',
                    border:
                      '1px solid rgba(255,255,255,0.06)',
                    background: `
                      linear-gradient(${THEME.cardOverlay}, ${THEME.cardOverlay}),
                      url(${CARD_BG})
                    `,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backdropFilter: 'blur(8px)',
                    boxShadow: THEME.shadow,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  {/* Top */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          flexWrap: 'wrap',
                          marginBottom: 5,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 15,
                            color: THEME.text,
                          }}
                        >
                          Order #{t.order_id}
                        </span>

                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: 99,
                            fontSize: 12,
                            fontWeight: 600,
                            background:
                              'rgba(255,255,255,0.08)',
                            color: '#F5EFE7',
                            border:
                              '1px solid rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(6px)',
                          }}
                        >
                          {STEP_ICON[t.status]}{' '}
                          {STEP_LABEL[t.status]}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: 13,
                          color: '#D7C2A8',
                          display: 'flex',
                          gap: 14,
                          flexWrap: 'wrap',
                        }}
                      >
                        <span>🚚 {t.dealer_name}</span>
                        <span>📦 {t.quantity_kg} kg</span>

                        {t.delivery_address && (
                          <span>
                            📍 {t.delivery_address}
                          </span>
                        )}
                      </div>
                    </div>

                    {hasLocation && (
                      <button
                        onClick={() => toggleMap(t.id)}
                        style={{
                          padding: '9px 18px',
                          borderRadius: 12,
                          fontSize: 13,
                          fontWeight: 700,
                          background: showMap
                            ? 'linear-gradient(135deg,#6F4E37,#4E6A42)'
                            : 'rgba(255,255,255,0.06)',
                          color: '#fff',
                          border:
                            '1px solid rgba(255,255,255,0.1)',
                          cursor: 'pointer',
                          backdropFilter: 'blur(8px)',
                          boxShadow:
                            '0 4px 14px rgba(0,0,0,0.25)',
                        }}
                      >
                        {showMap
                          ? '📍 Hide Map'
                          : '🗺 View Map'}
                      </button>
                    )}
                  </div>

                  {/* Stepper */}
                  <Stepper status={t.status} />

                  {/* Advance */}
                  {advance && (
                    <div
                      style={{
                        background:
                          'rgba(255,255,255,0.05)',
                        border:
                          '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 18,
                        padding: '16px',
                        backdropFilter: 'blur(12px)',
                        boxShadow:
                          '0 8px 24px rgba(0,0,0,0.25)',
                      }}
                    >
                      <p
                        style={{
                          fontSize: 13,
                          color: '#D7C2A8',
                          marginBottom: 12,
                        }}
                      >
                        {advance.desc}
                      </p>

                      <button
                        onClick={() =>
                          handleAdvance(t.id)
                        }
                        disabled={advancing === t.id}
                        style={{
                          padding: '12px 30px',
                          borderRadius: 12,
                          fontSize: 14,
                          fontWeight: 700,
                          background:
                            'linear-gradient(135deg,#6F4E37,#5E7C4F)',
                          color: '#fff',
                          border: 'none',
                          cursor:
                            advancing === t.id
                              ? 'not-allowed'
                              : 'pointer',
                          opacity:
                            advancing === t.id ? 0.6 : 1,
                          boxShadow:
                            '0 8px 20px rgba(0,0,0,0.35)',
                        }}
                      >
                        {advancing === t.id
                          ? 'Updating...'
                          : advance.text}
                      </button>
                    </div>
                  )}

                  {/* Map */}
                  {showMap && hasLocation && (
                    <LiveMap tracking={t} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}