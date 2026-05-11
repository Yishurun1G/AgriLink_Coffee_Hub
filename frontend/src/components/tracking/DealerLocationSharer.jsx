// ─────────────────────────────────────────────────────────────────────────────
// DealerLocationSharer
//
// The dealer's delivery management screen. It does three things:
//   1. Shows a list of all deliveries assigned to this dealer.
//   2. Lets the dealer tap "Mark as Picked Up" when they collect the order.
//      That is the only status action the dealer takes — the customer
//      confirms all the steps after that.
//   3. Lets the dealer share their live GPS location so the customer can
//      see the truck moving on the map.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import { getDealerDeliveries, updateDealerLocation, markPickedUp } from '../../api/trackingApi';

const STATUS_STEPS = ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'NEARBY', 'DELIVERED'];

const STATUS_LABELS = {
  PENDING: 'Pending Pickup',
  PICKED_UP: 'Picked Up',
  IN_TRANSIT: 'In Transit',
  NEARBY: 'Nearby',
  DELIVERED: 'Delivered',
};

const STATUS_ICONS = {
  PENDING: '⏳',
  PICKED_UP: '📦',
  IN_TRANSIT: '🚚',
  NEARBY: '📍',
  DELIVERED: '✅',
};

const STATUS_INFO = {
  PICKED_UP: {
    bg: 'rgba(64,115,158,0.18)',
    border: 'rgba(144,202,249,0.35)',
    color: '#CDE7FF',
    text: '📦 Order picked up. The customer will confirm when to move it forward.',
  },

  IN_TRANSIT: {
    bg: 'rgba(121,74,130,0.18)',
    border: 'rgba(206,147,216,0.35)',
    color: '#E9CFFF',
    text: '🚚 In transit — customer is tracking your progress.',
  },

  NEARBY: {
    bg: 'rgba(230,126,34,0.18)',
    border: 'rgba(255,204,128,0.35)',
    color: '#FFD9A3',
    text: '📍 You are nearby — customer will confirm delivery once received.',
  },

  DELIVERED: {
    bg: 'rgba(46,125,50,0.18)',
    border: 'rgba(165,214,167,0.35)',
    color: '#C8F5CB',
    text: '✅ Delivery complete! Thank you.',
  },
};

export default function DealerLocationSharer() {
  const [deliveries, setDeliveries] = useState([]);
  const [active, setActive] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [lastSent, setLastSent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pickingUp, setPickingUp] = useState(false);
  const [pickupError, setPickupError] = useState('');
  const [myPosition, setMyPosition] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  const watchRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    getDealerDeliveries()
      .then((data) => setDeliveries(Array.isArray(data) ? data : []))
      .catch(() => setDeliveries([]))
      .finally(() => setLoading(false));
  }, []);

  const needsMap =
    active &&
    active.status !== 'PENDING' &&
    active.status !== 'DELIVERED';

  useEffect(() => {
    if (!needsMap || mapReady) return;

    const timer = setTimeout(() => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href =
          'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (window.L) {
        initMap(window.L);
        return;
      }

      const script = document.createElement('script');
      script.src =
        'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => initMap(window.L);
      document.head.appendChild(script);
    }, 50);

    return () => clearTimeout(timer);
  }, [needsMap, mapReady]);

  const initMap = (L) => {
    if (mapRef.current) return;

    const container = document.getElementById('dealer-map');
    if (!container) return;

    const map = L.map('dealer-map').setView([9.0, 38.7], 13);
    mapRef.current = map;

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '© OpenStreetMap contributors',
      }
    ).addTo(map);

    const icon = L.divIcon({
      html: `
        <div style="
          background:#6B4F3A;
          color:#fff;
          width:42px;
          height:42px;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:20px;
          box-shadow:0 6px 18px rgba(0,0,0,0.35);
          border:3px solid #fff;
        ">
          <span style="transform:rotate(45deg)">🚚</span>
        </div>
      `,
      className: '',
      iconSize: [42, 42],
      iconAnchor: [21, 42],
    });

    markerRef.current = L.marker([9.0, 38.7], { icon })
      .addTo(map)
      .bindPopup('<b>Your location</b>');

    setMapReady(true);
  };

  useEffect(() => {
    if (!myPosition || !mapRef.current || !markerRef.current) return;

    const { lat, lng } = myPosition;

    markerRef.current.setLatLng([lat, lng]);
    mapRef.current.setView([lat, lng], 15);

    markerRef.current
      .bindPopup('<b>Your current location</b>')
      .openPopup();
  }, [myPosition]);

  const startSharing = () => {
    if (!active || !navigator.geolocation) {
      setLocationError(
        'Geolocation is not supported by your browser.'
      );
      return;
    }

    setLocationError('');
    setSharing(true);

    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        setMyPosition({
          lat: latitude,
          lng: longitude,
        });

        try {
          await updateDealerLocation(
            active.id,
            latitude,
            longitude
          );

          setLastSent(new Date());
        } catch {}
      },

      () => {
        setLocationError(
          'Location access denied. Please allow location in your browser.'
        );

        setSharing(false);
      },

      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );
  };

  const stopSharing = () => {
    if (watchRef.current) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }

    setSharing(false);
  };

  useEffect(() => () => stopSharing(), []);

  const handleMarkPickedUp = async () => {
    if (!active || pickingUp) return;

    setPickingUp(true);
    setPickupError('');

    try {
      const updated = await markPickedUp(active.id);

      setActive(updated);

      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === updated.id ? updated : d
        )
      );

      if (!sharing) startSharing();
    } catch (err) {
      setPickupError(
        err?.response?.data?.detail ??
          'Failed to mark as picked up.'
      );
    } finally {
      setPickingUp(false);
    }
  };

  const handleSelectDelivery = (d) => {
    stopSharing();

    if (mapRef.current) {
      try {
        mapRef.current.remove();
      } catch (_) {}

      mapRef.current = null;
      markerRef.current = null;
    }

    setMapReady(false);
    setLastSent(null);
    setMyPosition(null);
    setPickupError('');

    setActive(d);
  };

  if (loading)
    return (
      <div style={styles.center}>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>

        <div style={styles.spinner} />

        <p style={{ color: '#D6C4B3', marginTop: 14 }}>
          Loading deliveries…
        </p>
      </div>
    );

  const currentStepIndex = active
    ? STATUS_STEPS.indexOf(active.status)
    : -1;

  return (
    <div style={styles.root}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%,100% { opacity:1; }
          50% { opacity:0.4; }
        }

        .delivery-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 35px rgba(0,0,0,0.38);
        }

        .delivery-card.active {
          border-color: rgba(143,166,122,0.7) !important;
          box-shadow: 0 20px 40px rgba(0,0,0,0.45);
        }
      `}</style>

      <h2 style={styles.title}>🚚 My Deliveries</h2>

      {deliveries.length === 0 ? (
        <div style={styles.empty}>
          <p style={{ fontSize: 50 }}>🚚</p>

          <p style={{ marginTop: 10 }}>
            No deliveries assigned yet.
          </p>
        </div>
      ) : (
        <div style={styles.list}>
          {deliveries.map((d) => (
            <div
              key={d.id}
              className={`delivery-card ${
                active?.id === d.id ? 'active' : ''
              }`}
              style={styles.deliveryCard}
              onClick={() => handleSelectDelivery(d)}
            >
              <div>
                <div style={styles.cardTitle}>
                  Order #{d.order_id}
                </div>

                <div style={styles.cardSub}>
                  👤 {d.customer_name} · 📦 {d.quantity_kg} kg
                </div>
              </div>

              <div style={styles.statusPill}>
                {STATUS_ICONS[d.status]}{' '}
                {STATUS_LABELS[d.status]}
              </div>
            </div>
          ))}
        </div>
      )}

      {active && (
        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>
            Order #{active.order_id}
          </h3>

          <p
            style={{
              fontSize: 13,
              color: '#D6C4B3',
              marginBottom: 24,
            }}
          >
            👤 {active.customer_name} · 📦{' '}
            {active.quantity_kg} kg
            {active.delivery_address &&
              ` · 📍 ${active.delivery_address}`}
          </p>

          <div style={styles.stepperRow}>
            {STATUS_STEPS.map((s, i) => {
              const isDone = i < currentStepIndex;
              const isCurrent = i === currentStepIndex;

              return (
                <div key={s} style={styles.stepWrapper}>
                  {i > 0 && (
                    <div
                      style={{
                        ...styles.connector,
                        background:
                          i <= currentStepIndex
                            ? '#8FA67A'
                            : 'rgba(255,255,255,0.12)',
                      }}
                    />
                  )}

                  <div
                    style={{
                      ...styles.stepDot,
                      background: isDone
                        ? '#8FA67A'
                        : isCurrent
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(255,255,255,0.04)',

                      border: `2px solid ${
                        isDone || isCurrent
                          ? '#8FA67A'
                          : 'rgba(255,255,255,0.12)'
                      }`,

                      color: isDone
                        ? '#fff'
                        : '#D9E8C9',

                      boxShadow: isCurrent
                        ? '0 0 0 5px rgba(143,166,122,0.15)'
                        : 'none',
                    }}
                  >
                    {isDone ? '✓' : STATUS_ICONS[s]}
                  </div>

                  <div
                    style={{
                      ...styles.stepLabel,
                      color:
                        isDone || isCurrent
                          ? '#F7F1EA'
                          : '#9F8C7C',

                      fontWeight: isCurrent ? 700 : 400,
                    }}
                  >
                    {STATUS_LABELS[s]}
                  </div>
                </div>
              );
            })}
          </div>

          {active.status === 'PENDING' && (
            <div style={{ marginBottom: 24 }}>
              <p
                style={{
                  fontSize: 13,
                  color: '#F7F1EA',
                  marginBottom: 12,
                }}
              >
                Ready to pick up this order?
              </p>

              <button
                onClick={handleMarkPickedUp}
                disabled={pickingUp}
                style={{
                  padding: '12px 24px',
                  borderRadius: 14,
                  fontSize: 14,
                  fontWeight: 700,
                  background:
                    'linear-gradient(135deg,#6B4F3A,#8FA67A)',
                  color: '#fff',
                  border: 'none',
                  cursor: pickingUp
                    ? 'not-allowed'
                    : 'pointer',

                  opacity: pickingUp ? 0.6 : 1,
                  boxShadow:
                    '0 10px 24px rgba(0,0,0,0.35)',
                }}
              >
                {pickingUp
                  ? 'Updating…'
                  : '📦 Mark as Picked Up'}
              </button>

              {pickupError && (
                <p
                  style={{
                    color: '#ffb3b3',
                    fontSize: 13,
                    marginTop: 8,
                  }}
                >
                  {pickupError}
                </p>
              )}
            </div>
          )}

          {STATUS_INFO[active.status] && (
            <div
              style={{
                background:
                  STATUS_INFO[active.status].bg,

                border: `1px solid ${STATUS_INFO[active.status].border}`,
                borderRadius: 18,
                padding: '14px 18px',
                marginBottom: 24,
                backdropFilter: 'blur(12px)',
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color:
                    STATUS_INFO[active.status].color,
                }}
              >
                {STATUS_INFO[active.status].text}
              </p>
            </div>
          )}

          {active.status !== 'DELIVERED' &&
            active.status !== 'PENDING' && (
              <div style={styles.locationBox}>
                <div style={styles.locationHeader}>
                  <span style={styles.locationTitle}>
                    📍 Share Your Location
                  </span>

                  {sharing && (
                    <span style={styles.liveTag}>
                      <span
                        style={{
                          animation:
                            'pulse 1.5s infinite',
                          display: 'inline-block',
                          marginRight: 4,
                        }}
                      >
                        ●
                      </span>

                      Live
                    </span>
                  )}
                </div>

                {locationError && (
                  <p
                    style={{
                      color: '#ffb3b3',
                      fontSize: 13,
                      marginBottom: 10,
                    }}
                  >
                    {locationError}
                  </p>
                )}

                {lastSent && (
                  <p
                    style={{
                      fontSize: 12,
                      color: '#D6C4B3',
                      marginBottom: 12,
                    }}
                  >
                    Last sent:{' '}
                    {lastSent.toLocaleTimeString()}
                  </p>
                )}

                <button
                  onClick={
                    sharing
                      ? stopSharing
                      : startSharing
                  }
                  style={{
                    padding: '11px 24px',
                    borderRadius: 14,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',

                    background: sharing
                      ? 'rgba(255,255,255,0.08)'
                      : 'linear-gradient(135deg,#6B4F3A,#8FA67A)',

                    color: '#fff',

                    border: sharing
                      ? '1px solid rgba(255,255,255,0.12)'
                      : 'none',

                    boxShadow:
                      '0 10px 24px rgba(0,0,0,0.25)',
                  }}
                >
                  {sharing
                    ? '⏹ Stop Sharing'
                    : '▶ Start Sharing Location'}
                </button>

                <p
                  style={{
                    fontSize: 12,
                    color: '#BFAE9E',
                    marginTop: 12,
                  }}
                >
                  Your GPS location is sent to the
                  customer every few seconds while
                  sharing is active.
                </p>
              </div>
            )}

          {active.status !== 'DELIVERED' &&
            active.status !== 'PENDING' && (
              <div style={{ marginTop: 22 }}>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#F7F1EA',
                    marginBottom: 12,
                  }}
                >
                  🗺 Your Current Location
                </p>

                {!myPosition && !sharing && (
                  <div style={styles.noMap}>
                    <p style={{ fontSize: 40 }}>
                      📍
                    </p>

                    <p
                      style={{
                        marginTop: 10,
                        fontSize: 13,
                      }}
                    >
                      Start sharing your location
                      to see it on the map.
                    </p>
                  </div>
                )}

                <div
                  id="dealer-map"
                  style={{
                    ...styles.map,
                    display:
                      myPosition || mapReady
                        ? 'block'
                        : 'none',
                  }}
                />
              </div>
            )}
        </div>
      )}
    </div>
  );
}

const styles = {
  root: {
    fontFamily: "'DM Sans', sans-serif",
  minHeight: '100vh',
  width: '100%',
  padding: 24,
  color: '#F5E6D3',
  

    background: `
      linear-gradient(rgba(20,20,20,0.72), rgba(20,20,20,0.78)),
      url('https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=1600&auto=format&fit=crop')
    `,

    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
  },

  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },

  spinner: {
    width: 36,
    height: 36,
    border: '4px solid rgba(255,255,255,0.2)',
    borderTop: '4px solid #8FA67A',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },

  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 30,
    color: '#F7F3EE',
    marginBottom: 24,
    textShadow: '0 4px 18px rgba(0,0,0,0.45)',
  },

  empty: {
    textAlign: 'center',
    padding: 60,
    borderRadius: 24,
    backdropFilter: 'blur(14px)',
    background: 'rgba(45,35,28,0.58)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#E8DCCF',
    boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
  },

  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    marginBottom: 28,
  },

  deliveryCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 22px',
    borderRadius: 22,
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    backdropFilter: 'blur(14px)',

    background: `
  linear-gradient(
    rgba(24,18,14,0.90),
    rgba(24,18,14,0.92)
  ),
  url('https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1200&auto=format&fit=crop')
`,

backgroundSize: 'cover',
backgroundPosition: 'center',
backgroundBlendMode: 'darken',
backdropFilter: 'blur(18px) saturate(120%)',

    backgroundSize: 'cover',
    backgroundPosition: 'center',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#F8F4EF',
    marginBottom: 4,
  },

  cardSub: {
    fontSize: 13,
    color: '#D6C4B3',
  },

  statusPill: {
    padding: '7px 14px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    background: 'rgba(143,166,122,0.18)',
    border: '1px solid rgba(143,166,122,0.4)',
    color: '#DDEBCF',
    backdropFilter: 'blur(10px)',
  },

  panel: {
    borderRadius: 30,
    padding: 28,
    backdropFilter: 'blur(16px)',

    background: `
      linear-gradient(rgba(34,26,20,0.82), rgba(34,26,20,0.82)),
      url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1600&auto=format&fit=crop')
    `,

    backgroundSize: 'cover',
    backgroundPosition: 'center',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 18px 45px rgba(0,0,0,0.42)',
  },

  panelTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 24,
    color: '#FFF8F2',
    marginBottom: 6,
    textShadow: '0 3px 12px rgba(0,0,0,0.35)',
  },

  stepperRow: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: 28,
    overflowX: 'auto',
    paddingBottom: 4,
  },

  stepWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    minWidth: 75,
    position: 'relative',
  },

  connector: {
    position: 'absolute',
    top: 18,
    right: '50%',
    width: '100%',
    height: 3,
    zIndex: 0,
    borderRadius: 999,
  },

  stepDot: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 700,
    zIndex: 1,
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
  },

  stepLabel: {
    fontSize: 11,
    marginTop: 7,
    textAlign: 'center',
    lineHeight: 1.3,
  },

  locationBox: {
    borderRadius: 22,
    padding: 22,
    marginBottom: 8,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(14px)',
    boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
  },

  locationHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },

  locationTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#F7F1EA',
  },

  liveTag: {
    background: '#7A9B63',
    color: '#fff',
    padding: '4px 12px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(122,155,99,0.45)',
  },

  map: {
    height: 340,
    width: '100%',
    borderRadius: 24,
    border: '1px solid rgba(255,255,255,0.08)',
    overflow: 'hidden',
    boxShadow: '0 12px 35px rgba(0,0,0,0.35)',
  },

  noMap: {
    height: 180,
    borderRadius: 24,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(12px)',
    background: 'rgba(255,255,255,0.05)',
    border: '1px dashed rgba(255,255,255,0.15)',
    color: '#E7D9CB',
  },
};