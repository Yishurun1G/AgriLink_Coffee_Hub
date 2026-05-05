import { useState, useEffect, useRef } from 'react';
import { getMyOrderTracking } from '../../api/trackingApi';

const STATUS_STEPS = ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'NEARBY', 'DELIVERED'];
const STATUS_LABELS = {
  PENDING:    'Pending',
  PICKED_UP:  'Picked Up',
  IN_TRANSIT: 'In Transit',
  NEARBY:     'Nearby',
  DELIVERED:  'Delivered',
};
const STATUS_ICONS = {
  PENDING: '⏳', PICKED_UP: '📦', IN_TRANSIT: '🚚', NEARBY: '📍', DELIVERED: '✅',
};

export default function CustomerTrackingMap({ orderId }) {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const mapInitRef      = useRef(false);
  const dealerMarkerRef = useRef(null);
  const leafletMapRef   = useRef(null);
  const pollRef         = useRef(null);

  // ── Fetch / poll tracking data ────────────────────────────────────────
  const fetchTracking = async () => {
    try {
      const data = await getMyOrderTracking(orderId);
      setTracking(data);
      setError('');
    } catch {
      setError('Could not load tracking info for this order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    pollRef.current = setInterval(fetchTracking, 10000);
    return () => clearInterval(pollRef.current);
  }, [orderId]);

  // ── Build / update Leaflet map ────────────────────────────────────────
  useEffect(() => {
    if (!tracking?.latitude || !tracking?.longitude) return;

    const lat = parseFloat(tracking.latitude);
    const lng = parseFloat(tracking.longitude);

    // Just move the marker if map already exists
    if (mapInitRef.current && dealerMarkerRef.current) {
      dealerMarkerRef.current.setLatLng([lat, lng]);
      leafletMapRef.current?.panTo([lat, lng]);
      return;
    }

    const buildMap = (L) => {
      if (mapInitRef.current) return;
      mapInitRef.current = true;

      const map = L.map('tracking-map').setView([lat, lng], 14);
      leafletMapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      // Dealer marker
      const dealerIcon = L.divIcon({
        html: `<div style="background:#6F4E37;color:#fff;width:40px;height:40px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 12px rgba(111,78,55,0.4);border:3px solid #fff;"><span style="transform:rotate(45deg)">🚚</span></div>`,
        className: '', iconSize: [40, 40], iconAnchor: [20, 40],
      });
      dealerMarkerRef.current = L.marker([lat, lng], { icon: dealerIcon })
        .addTo(map)
        .bindPopup(`<b>🚚 ${tracking.dealer_name}</b><br>Your delivery is on the way`);

      // Destination marker
      if (tracking.delivery_lat && tracking.delivery_lng) {
        const destLat = parseFloat(tracking.delivery_lat);
        const destLng = parseFloat(tracking.delivery_lng);
        const destIcon = L.divIcon({
          html: `<div style="background:#e65100;color:#fff;width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 3px 10px rgba(230,81,0,0.4);border:2px solid #fff;"><span style="transform:rotate(45deg)">🏠</span></div>`,
          className: '', iconSize: [36, 36], iconAnchor: [18, 36],
        });
        L.marker([destLat, destLng], { icon: destIcon })
          .addTo(map)
          .bindPopup(`<b>📍 Your delivery address</b><br>${tracking.delivery_address || ''}`);

        L.polyline([[lat, lng], [destLat, destLng]], {
          color: '#6F4E37', weight: 2, dashArray: '6 8', opacity: 0.6,
        }).addTo(map);

        map.fitBounds([[lat, lng], [destLat, destLng]], { padding: [40, 40] });
      }
    };

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css'; link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    if (window.L) { buildMap(window.L); return; }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => buildMap(window.L);
    document.head.appendChild(script);
  }, [tracking]);

  if (loading) return (
    <div style={s.center}>
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
      <div style={s.spinner} />
      <p style={{ color: '#9E7B5A', marginTop: 12 }}>Loading map…</p>
    </div>
  );

  if (error) return (
    <div style={s.center}>
      <p style={{ fontSize: 36 }}>📦</p>
      <p style={{ color: '#c0392b', marginTop: 8 }}>{error}</p>
    </div>
  );

  if (!tracking) return null;

  const currentStep = STATUS_STEPS.indexOf(tracking.status);

  return (
    <div style={s.root}>
      <style>{'@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }'}</style>

      {/* Header */}
      <div style={s.header}>
        <div>
          <h2 style={s.title}>Order #{tracking.order_id}</h2>
          <p style={s.subtitle}>🚚 {tracking.dealer_name} · 📦 {tracking.quantity_kg} kg</p>
        </div>
        <div style={{
          ...s.badge,
          background: tracking.status === 'DELIVERED' ? '#e8f5e9' : '#fff8f0',
          color: tracking.status === 'DELIVERED' ? '#2e7d32' : '#6F4E37',
          border: `1px solid ${tracking.status === 'DELIVERED' ? '#a5d6a7' : '#e0c8a8'}`,
        }}>
          {STATUS_ICONS[tracking.status]} {STATUS_LABELS[tracking.status]}
        </div>
      </div>

      {/* Progress stepper */}
      <div style={s.stepsRow}>
        {STATUS_STEPS.map((st, i) => (
          <div key={st} style={s.stepWrapper}>
            <div style={{
              ...s.stepDot,
              background: i < currentStep ? '#6F4E37' : i === currentStep ? '#fff' : '#f0e8df',
              border: `2px solid ${i <= currentStep ? '#6F4E37' : '#e0d0c0'}`,
              color: i < currentStep ? '#fff' : i === currentStep ? '#6F4E37' : '#c0a080',
              boxShadow: i === currentStep ? '0 0 0 4px rgba(111,78,55,0.15)' : 'none',
            }}>
              {i < currentStep ? '✓' : STATUS_ICONS[st]}
            </div>
            <div style={{ ...s.stepLabel, color: i <= currentStep ? '#6F4E37' : '#B8A090', fontWeight: i === currentStep ? 700 : 400 }}>
              {STATUS_LABELS[st]}
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div style={{ ...s.stepLine, background: i < currentStep ? '#6F4E37' : '#e0d0c0' }} />
            )}
          </div>
        ))}
      </div>

      {/* Map */}
      {tracking.latitude && tracking.longitude ? (
        <div style={s.mapWrapper}>
          <div id="tracking-map" style={s.map} />
          {tracking.location_fresh && (
            <div style={s.liveBadge}>
              <span style={{ animation: 'pulse 1.5s infinite', display: 'inline-block', marginRight: 5 }}>●</span>
              Live
            </div>
          )}
        </div>
      ) : (
        <div style={s.noMap}>
          <p style={{ fontSize: 40 }}>🗺️</p>
          <p style={{ color: '#9E7B5A', marginTop: 8, fontSize: 13 }}>
            {tracking.status === 'PENDING'
              ? 'Waiting for dealer to pick up your order.'
              : 'Waiting for dealer to share location…'}
          </p>
        </div>
      )}

      {/* Info cards */}
      <div style={s.infoRow}>
        <div style={s.infoCard}>
          <div style={s.infoLabel}>Delivery Address</div>
          <div style={s.infoValue}>📍 {tracking.delivery_address || 'Not specified'}</div>
        </div>
        <div style={s.infoCard}>
          <div style={s.infoLabel}>Estimated Delivery</div>
          <div style={s.infoValue}>
            🕐 {tracking.estimated_delivery
              ? new Date(tracking.estimated_delivery).toLocaleString()
              : 'Not set'}
          </div>
        </div>
        <div style={s.infoCard}>
          <div style={s.infoLabel}>Last Location Update</div>
          <div style={s.infoValue}>
            🔄 {tracking.last_location_update
              ? new Date(tracking.last_location_update).toLocaleTimeString()
              : 'No updates yet'}
          </div>
        </div>
      </div>

      {tracking.delivery_notes && (
        <div style={s.notes}><strong>Note from dealer:</strong> {tracking.delivery_notes}</div>
      )}
    </div>
  );
}

const s = {
  root:        { fontFamily: "'DM Sans', sans-serif", background: '#FAF6F1', padding: 24 },
  center:      { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200 },
  spinner:     { width: 36, height: 36, border: '4px solid #E8DDD4', borderTop: '4px solid #6F4E37', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  title:       { fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#3E1F00', margin: 0 },
  subtitle:    { fontSize: 13, color: '#9E7B5A', marginTop: 4 },
  badge:       { padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600 },
  stepsRow:    { display: 'flex', alignItems: 'flex-start', marginBottom: 20, overflowX: 'auto', paddingBottom: 8 },
  stepWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', flex: 1, minWidth: 64 },
  stepDot:     { width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, transition: 'all 0.3s', zIndex: 1 },
  stepLabel:   { fontSize: 10, marginTop: 5, textAlign: 'center', lineHeight: 1.3 },
  stepLine:    { position: 'absolute', top: 17, left: '50%', width: '100%', height: 2, zIndex: 0 },
  mapWrapper:  { position: 'relative', borderRadius: 14, overflow: 'hidden', marginBottom: 20, border: '1px solid #E8DDD4' },
  map:         { height: 320, width: '100%' },
  liveBadge:   { position: 'absolute', top: 10, right: 10, background: '#6F4E37', color: '#fff', padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center' },
  noMap:       { height: 160, background: '#F5EFE8', borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: 20, border: '1px dashed #D4C0A8' },
  infoRow:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 14 },
  infoCard:    { background: '#fff', borderRadius: 10, padding: '12px 14px', border: '1px solid #E8DDD4' },
  infoLabel:   { fontSize: 10, fontWeight: 600, color: '#9E7B5A', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 },
  infoValue:   { fontSize: 13, color: '#2d1a0e', fontWeight: 500 },
  notes:       { background: '#FFF8F0', border: '1px solid #E8DDD4', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#5C3D1E' },
};
