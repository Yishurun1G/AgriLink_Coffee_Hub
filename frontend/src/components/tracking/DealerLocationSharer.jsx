import { useState, useEffect, useRef } from 'react';
import { getDealerDeliveries, updateDealerLocation, markPickedUp } from '../../api/trackingApi';

const STATUS_STEPS = ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'NEARBY', 'DELIVERED'];
const STATUS_LABELS = {
  PENDING:    'Pending Pickup',
  PICKED_UP:  'Picked Up',
  IN_TRANSIT: 'In Transit',
  NEARBY:     'Nearby',
  DELIVERED:  'Delivered',
};
const STATUS_ICONS = {
  PENDING: '⏳', PICKED_UP: '📦', IN_TRANSIT: '🚚', NEARBY: '📍', DELIVERED: '✅',
};

// Info message shown to dealer for each status (after PICKED_UP, customer drives it)
const STATUS_INFO = {
  PICKED_UP:  { bg: '#e3f2fd', border: '#90caf9', color: '#1565c0', text: '📦 Order picked up. The customer will confirm when to move it forward.' },
  IN_TRANSIT: { bg: '#f3e5f5', border: '#ce93d8', color: '#6a1b9a', text: '🚚 In transit — customer is tracking your progress.' },
  NEARBY:     { bg: '#fff3e0', border: '#ffcc80', color: '#e65100', text: '📍 You are nearby — customer will confirm delivery once received.' },
  DELIVERED:  { bg: '#e8f5e9', border: '#a5d6a7', color: '#2e7d32', text: '✅ Delivery complete! Thank you.' },
};

export default function DealerLocationSharer() {
  const [deliveries, setDeliveries]       = useState([]);
  const [active, setActive]               = useState(null);
  const [sharing, setSharing]             = useState(false);
  const [locationError, setLocationError] = useState('');
  const [lastSent, setLastSent]           = useState(null);
  const [loading, setLoading]             = useState(true);
  const [pickingUp, setPickingUp]         = useState(false);
  const [pickupError, setPickupError]     = useState('');
  const [myPosition, setMyPosition]       = useState(null);
  const [mapReady, setMapReady]           = useState(false);

  const watchRef  = useRef(null);
  const mapRef    = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    getDealerDeliveries()
      .then((data) => setDeliveries(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  // ── Init Leaflet map ────────────────────────────────────────────────────
  useEffect(() => {
    if (mapReady || !active) return;

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
  }, [active]);

  const initMap = (L) => {
    if (mapRef.current) return;
    const map = L.map('dealer-map').setView([9.0, 38.7], 13);
    mapRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);
    const icon = L.divIcon({
      html: `<div style="background:#6F4E37;color:#fff;width:42px;height:42px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 12px rgba(111,78,55,0.4);border:3px solid #fff;"><span style="transform:rotate(45deg)">🚚</span></div>`,
      className: '', iconSize: [42, 42], iconAnchor: [21, 42],
    });
    markerRef.current = L.marker([9.0, 38.7], { icon }).addTo(map).bindPopup('<b>Your location</b>');
    setMapReady(true);
  };

  useEffect(() => {
    if (!myPosition || !mapRef.current || !markerRef.current) return;
    const { lat, lng } = myPosition;
    markerRef.current.setLatLng([lat, lng]);
    mapRef.current.setView([lat, lng], 15);
    markerRef.current.bindPopup('<b>Your current location</b>').openPopup();
  }, [myPosition]);

  // ── GPS sharing ─────────────────────────────────────────────────────────
  const startSharing = () => {
    if (!active || !navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setLocationError('');
    setSharing(true);
    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setMyPosition({ lat: latitude, lng: longitude });
        try {
          await updateDealerLocation(active.id, latitude, longitude);
          setLastSent(new Date());
        } catch { /* retry on next tick */ }
      },
      () => {
        setLocationError('Location access denied. Please allow location in your browser.');
        setSharing(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  };

  const stopSharing = () => {
    if (watchRef.current) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null; }
    setSharing(false);
  };

  useEffect(() => () => stopSharing(), []);

  // ── Mark picked up ──────────────────────────────────────────────────────
  const handleMarkPickedUp = async () => {
    if (!active || pickingUp) return;
    setPickingUp(true);
    setPickupError('');
    try {
      const updated = await markPickedUp(active.id);
      setActive(updated);
      setDeliveries((prev) => prev.map((d) => d.id === updated.id ? updated : d));
      // Auto-start location sharing once picked up
      if (!sharing) startSharing();
    } catch (err) {
      setPickupError(err?.response?.data?.detail ?? 'Failed to mark as picked up.');
    } finally {
      setPickingUp(false);
    }
  };

  const handleSelectDelivery = (d) => {
    stopSharing();
    setActive(d);
    setLastSent(null);
    setMyPosition(null);
    setPickupError('');
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markerRef.current = null;
      setMapReady(false);
    }
  };

  if (loading) return (
    <div style={styles.center}>
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
      <div style={styles.spinner} />
      <p style={{ color: '#9E7B5A', marginTop: 12 }}>Loading deliveries…</p>
    </div>
  );

  const currentStepIndex = active ? STATUS_STEPS.indexOf(active.status) : -1;

  return (
    <div style={styles.root}>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .delivery-card:hover  { background: rgba(111,78,55,0.06) !important; }
        .delivery-card.active { background: rgba(111,78,55,0.12) !important; border-color: #6F4E37 !important; }
      `}</style>

      <h2 style={styles.title}>🚚 My Deliveries</h2>

      {/* ── Delivery list ── */}
      {deliveries.length === 0 ? (
        <div style={styles.empty}>
          <p style={{ fontSize: 40 }}>🚚</p>
          <p style={{ color: '#9E7B5A', marginTop: 8 }}>No deliveries assigned yet.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {deliveries.map((d) => (
            <div
              key={d.id}
              className={`delivery-card${active?.id === d.id ? ' active' : ''}`}
              style={styles.deliveryCard}
              onClick={() => handleSelectDelivery(d)}
            >
              <div>
                <div style={styles.cardTitle}>Order #{d.order_id}</div>
                <div style={styles.cardSub}>👤 {d.customer_name} · 📦 {d.quantity_kg} kg</div>
              </div>
              <div style={{
                ...styles.statusPill,
                background: d.status === 'DELIVERED' ? '#e8f5e9' : '#fff8f0',
                color: d.status === 'DELIVERED' ? '#2e7d32' : '#6F4E37',
              }}>
                {STATUS_ICONS[d.status]} {STATUS_LABELS[d.status]}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Active delivery panel ── */}
      {active && (
        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>Order #{active.order_id}</h3>
          <p style={{ fontSize: 13, color: '#9E7B5A', marginBottom: 20 }}>
            👤 {active.customer_name} · 📦 {active.quantity_kg} kg
            {active.delivery_address && ` · 📍 ${active.delivery_address}`}
          </p>

          {/* Progress stepper */}
          <div style={styles.stepperRow}>
            {STATUS_STEPS.map((s, i) => {
              const isDone    = i < currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <div key={s} style={styles.stepWrapper}>
                  {i > 0 && (
                    <div style={{ ...styles.connector, background: i <= currentStepIndex ? '#6F4E37' : '#E0D0C0' }} />
                  )}
                  <div style={{
                    ...styles.stepDot,
                    background: isDone ? '#6F4E37' : isCurrent ? '#fff' : '#F5EDE6',
                    border: `2px solid ${isDone || isCurrent ? '#6F4E37' : '#E0D0C0'}`,
                    color: isDone ? '#fff' : isCurrent ? '#6F4E37' : '#C0A080',
                    boxShadow: isCurrent ? '0 0 0 4px rgba(111,78,55,0.15)' : 'none',
                  }}>
                    {isDone ? '✓' : STATUS_ICONS[s]}
                  </div>
                  <div style={{ ...styles.stepLabel, color: isDone || isCurrent ? '#6F4E37' : '#B8A090', fontWeight: isCurrent ? 700 : 400 }}>
                    {STATUS_LABELS[s]}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Dealer action: only PENDING → PICKED_UP ── */}
          {active.status === 'PENDING' && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: '#6F4E37', marginBottom: 10 }}>
                Ready to pick up this order? Tap below to confirm.
              </p>
              <button
                onClick={handleMarkPickedUp}
                disabled={pickingUp}
                style={{
                  padding: '11px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                  background: '#6F4E37', color: '#fff', border: 'none',
                  cursor: pickingUp ? 'not-allowed' : 'pointer',
                  opacity: pickingUp ? 0.6 : 1,
                }}
              >
                {pickingUp ? 'Updating…' : '📦 Mark as Picked Up'}
              </button>
              {pickupError && <p style={{ color: '#c0392b', fontSize: 13, marginTop: 8 }}>{pickupError}</p>}
            </div>
          )}

          {/* Status info for all other states */}
          {STATUS_INFO[active.status] && (
            <div style={{
              background: STATUS_INFO[active.status].bg,
              border: `1px solid ${STATUS_INFO[active.status].border}`,
              borderRadius: 10, padding: '12px 16px', marginBottom: 20,
            }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: STATUS_INFO[active.status].color }}>
                {STATUS_INFO[active.status].text}
              </p>
            </div>
          )}

          {/* ── Location sharing ── */}
          {active.status !== 'DELIVERED' && active.status !== 'PENDING' && (
            <div style={styles.locationBox}>
              <div style={styles.locationHeader}>
                <span style={styles.locationTitle}>📍 Share Your Location</span>
                {sharing && (
                  <span style={styles.liveTag}>
                    <span style={{ animation: 'pulse 1.5s infinite', display: 'inline-block', marginRight: 4 }}>●</span>
                    Live
                  </span>
                )}
              </div>
              {locationError && <p style={{ color: '#c0392b', fontSize: 13, marginBottom: 10 }}>{locationError}</p>}
              {lastSent && <p style={{ fontSize: 12, color: '#9E7B5A', marginBottom: 10 }}>Last sent: {lastSent.toLocaleTimeString()}</p>}
              <button
                onClick={sharing ? stopSharing : startSharing}
                style={{
                  padding: '10px 22px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                  cursor: 'pointer',
                  background: sharing ? '#fff3e0' : '#6F4E37',
                  color: sharing ? '#e65100' : '#fff',
                  border: sharing ? '2px solid #ffcc80' : 'none',
                }}
              >
                {sharing ? '⏹ Stop Sharing' : '▶ Start Sharing Location'}
              </button>
              <p style={{ fontSize: 12, color: '#B8A090', marginTop: 10 }}>
                Your GPS location is sent to the customer every few seconds while sharing is active.
              </p>
            </div>
          )}

          {/* Live map */}
          {active.status !== 'DELIVERED' && active.status !== 'PENDING' && (
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#6F4E37', marginBottom: 10 }}>🗺 Your Current Location</p>
              {!myPosition && !sharing && (
                <div style={styles.noMap}>
                  <p style={{ fontSize: 32 }}>📍</p>
                  <p style={{ color: '#9E7B5A', marginTop: 8, fontSize: 13 }}>Start sharing your location to see it on the map.</p>
                </div>
              )}
              <div id="dealer-map" style={{ ...styles.map, display: myPosition || mapReady ? 'block' : 'none' }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  root:         { fontFamily: "'DM Sans', sans-serif", background: '#FAF6F1', minHeight: '100vh', padding: 24, maxWidth: 800, margin: '0 auto' },
  center:       { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300 },
  spinner:      { width: 36, height: 36, border: '4px solid #E8DDD4', borderTop: '4px solid #6F4E37', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  title:        { fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#3E1F00', marginBottom: 20 },
  empty:        { textAlign: 'center', padding: 60 },
  list:         { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 },
  deliveryCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#fff', borderRadius: 12, border: '1px solid #E8DDD4', cursor: 'pointer', transition: 'all 0.15s' },
  cardTitle:    { fontSize: 14, fontWeight: 600, color: '#2d1a0e' },
  cardSub:      { fontSize: 12, color: '#9E7B5A', marginTop: 3 },
  statusPill:   { padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' },
  panel:        { background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #E8DDD4' },
  panelTitle:   { fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#3E1F00', marginBottom: 4 },
  stepperRow:   { display: 'flex', alignItems: 'flex-start', marginBottom: 24, overflowX: 'auto', paddingBottom: 4 },
  stepWrapper:  { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 70, position: 'relative' },
  connector:    { position: 'absolute', top: 18, right: '50%', width: '100%', height: 2, zIndex: 0 },
  stepDot:      { width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, zIndex: 1, transition: 'all 0.3s' },
  stepLabel:    { fontSize: 10, marginTop: 6, textAlign: 'center', lineHeight: 1.3 },
  locationBox:    { background: '#FAF6F1', borderRadius: 12, padding: 18, border: '1px solid #E8DDD4', marginBottom: 4 },
  locationHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  locationTitle:  { fontSize: 15, fontWeight: 600, color: '#3E1F00' },
  liveTag:        { background: '#6F4E37', color: '#fff', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center' },
  map:    { height: 320, width: '100%', borderRadius: 12, border: '1px solid #E8DDD4', overflow: 'hidden' },
  noMap:  { height: 160, background: '#F5EFE8', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed #D4C0A8' },
};
