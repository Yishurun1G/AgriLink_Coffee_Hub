import { useState, useEffect, useRef } from 'react';
import axios from '../../api/axios';
import BatchCard from '../../components/common/BatchCard';
import { useNavigate } from 'react-router-dom';

// ── Order Modal ───────────────────────────────────────────────────────────
function OrderModal({ batch, onClose, onSuccess }) {
  const [quantity, setQuantity]       = useState(batch.quantity_kg);
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [address, setAddress]         = useState('');
  const [pinLat, setPinLat]           = useState(null);
  const [pinLng, setPinLng]           = useState(null);
  const [notes, setNotes]             = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');
  const mapRef      = useRef(null);
  const markerRef   = useRef(null);
  const debounceRef = useRef(null);

  // Drop or move the pin on the map
  const dropPin = (lat, lng, label) => {
    const L = window.L;
    if (!L || !mapRef.current) return;
    setPinLat(lat);
    setPinLng(lng);
    const pinIcon = L.divIcon({
      html: `<div style="background:#e65100;color:#fff;width:36px;height:36px;
        border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        display:flex;align-items:center;justify-content:center;
        font-size:16px;box-shadow:0 3px 10px rgba(0,0,0,0.3);border:2px solid #fff;">
        <span style="transform:rotate(45deg)">📍</span></div>`,
      className: '', iconSize: [36, 36], iconAnchor: [18, 36],
    });
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]).bindPopup(label).openPopup();
    } else {
      markerRef.current = L.marker([lat, lng], { icon: pinIcon })
        .addTo(mapRef.current).bindPopup(label).openPopup();
    }
    mapRef.current.setView([lat, lng], 15);
  };

  // Init Leaflet map
  useEffect(() => {
    const initMap = (L) => {
      if (mapRef.current) return;
      const map = L.map('order-map').setView([9.0, 38.7], 12);
      mapRef.current = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);
      // Clicking the map drops a pin and reverse-geocodes
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
          .then((r) => r.json())
          .then((d) => {
            const name = d.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            setAddress(name);
            setSearchInput(name);
            setSuggestions([]);
            dropPin(lat, lng, name);
          })
          .catch(() => {
            const name = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            setAddress(name);
            setSearchInput(name);
            dropPin(lat, lng, name);
          });
      });
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

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null; }
    };
  }, []);

  // Debounced autocomplete — fetch suggestions as user types
  const handleSearchInput = (val) => {
    setSearchInput(val);
    setAddress('');
    setPinLat(null);
    setPinLng(null);
    clearTimeout(debounceRef.current);
    if (val.trim().length < 3) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5&addressdetails=1`
        );
        const data = await res.json();
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      }
    }, 400);
  };

  // User picks a suggestion — pin it and close dropdown
  const handlePickSuggestion = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const name = item.display_name;
    setAddress(name);
    setSearchInput(name);
    setSuggestions([]);
    dropPin(lat, lng, name);
  };

  const handleSubmit = async () => {
    if (!quantity || Number(quantity) <= 0) { setError('Enter a valid quantity.'); return; }
    if (!address.trim() || !pinLat || !pinLng) {
      setError('Please select a delivery location from the suggestions or click the map.');
      return;
    }
    setSubmitting(true); setError('');
    try {
      await axios.post('/orders/', {
        batch: batch.id,
        quantity_kg: Number(quantity),
        notes,
        delivery_address: address,
        delivery_lat: pinLat,
        delivery_lng: pinLng,
      });
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.detail ?? 'Failed to place order. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={modal.overlay} onClick={onClose}>
      <div style={modal.box} onClick={(e) => e.stopPropagation()}>
        <div style={modal.header}>
          <span style={modal.title}>Place Order</span>
          <button style={modal.close} onClick={onClose}>✕</button>
        </div>

        <p style={{ fontSize: 13, color: '#9E7B5A' }}>
          {batch.coffee_type_display || batch.coffee_type} · {batch.origin}
        </p>

        {/* Quantity */}
        <div style={modal.field}>
          <label style={modal.label}>Quantity (kg)</label>
          <input
            type="number" min="0.1" step="0.1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            style={modal.input}
          />
        </div>

        {/* Address autocomplete */}
        <div style={modal.field}>
          <label style={modal.label}>Delivery Location</label>
          <div style={{ position: 'relative' }}>
            <input
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Type your area, street or landmark…"
              style={{ ...modal.input, width: '100%' }}
              autoComplete="off"
            />
            {/* Suggestions dropdown */}
            {suggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: '#fff', border: '1.5px solid #E0D4C8',
                borderRadius: '0 0 10px 10px', zIndex: 999,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 220, overflowY: 'auto',
              }}>
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    onClick={() => handlePickSuggestion(s)}
                    style={{
                      padding: '10px 14px', cursor: 'pointer', fontSize: 13,
                      borderBottom: i < suggestions.length - 1 ? '1px solid #F0E9E1' : 'none',
                      color: '#2d1a0e', lineHeight: 1.4,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#FAF6F1'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                  >
                    <span style={{ fontWeight: 600 }}>
                      {s.address?.road || s.address?.suburb || s.address?.city || s.name || s.display_name.split(',')[0]}
                    </span>
                    <br />
                    <span style={{ color: '#9E7B5A', fontSize: 11 }}>{s.display_name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirmed address */}
          {address && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 6, background: '#F0FFF4', border: '1px solid #a5d6a7', borderRadius: 8, padding: '8px 12px' }}>
              <span style={{ fontSize: 16 }}>✅</span>
              <span style={{ fontSize: 12, color: '#2e7d32', fontWeight: 500 }}>{address}</span>
            </div>
          )}
          <p style={{ fontSize: 11, color: '#B8A090', marginTop: 4 }}>
            Or click anywhere on the map below to pin your exact location.
          </p>
        </div>

        {/* Map */}
        <div style={modal.field}>
          <label style={modal.label}>📍 Confirm on Map</label>
          <div id="order-map" style={{ height: 220, borderRadius: 10, border: '1.5px solid #E0D4C8', overflow: 'hidden' }} />
        </div>

        {/* Notes */}
        <div style={modal.field}>
          <label style={modal.label}>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ ...modal.input, height: 56, resize: 'vertical' }}
            placeholder="Any special instructions…"
          />
        </div>

        {error && <p style={{ color: '#c0392b', fontSize: 13 }}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{ ...modal.btn, opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? 'Placing…' : '✅ Confirm Order'}
        </button>
      </div>
    </div>
  );
}

const modal = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(30,10,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  box:     { background: '#FDF9F5', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 24px 60px rgba(30,10,0,0.2)', fontFamily: "'DM Sans', sans-serif" },
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title:   { fontSize: 20, fontWeight: 700, color: '#3E1F00', fontFamily: "'Playfair Display', serif" },
  close:   { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9E7B5A' },
  field:   { display: 'flex', flexDirection: 'column', gap: 5 },
  label:   { fontSize: 12, fontWeight: 600, color: '#6F4E37', textTransform: 'uppercase', letterSpacing: 0.5 },
  input:   { border: '1.5px solid #E0D4C8', borderRadius: 10, padding: '10px 12px', fontSize: 14, fontFamily: "'DM Sans', sans-serif", background: '#fff', color: '#2d1a0e', outline: 'none' },
  btn:     { background: '#6F4E37', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
};

// ── Main CustomerDashboard ────────────────────────────────────────────────
const CustomerDashboard = () => {
  const navigate = useNavigate();

  const [approvedBatches, setApprovedBatches]   = useState([]);
  const [displayedBatches, setDisplayedBatches] = useState([]);
  const [searchTerm, setSearchTerm]             = useState('');
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState('');
  const [orderBatch, setOrderBatch]             = useState(null);

  const fetchApprovedBatches = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/batches/approved_batches/');
      const data = Array.isArray(response.data) ? response.data : response.data?.results || [];
      setApprovedBatches(data);
      setDisplayedBatches(data);
    } catch (err) {
      console.error('Error fetching batches:', err);
      setError('Failed to load approved coffee batches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApprovedBatches(); }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setDisplayedBatches(approvedBatches);
    } else {
      const term = searchTerm.toLowerCase();
      setDisplayedBatches(
        approvedBatches.filter((b) =>
          b.id?.toLowerCase().includes(term) ||
          b.origin?.toLowerCase().includes(term) ||
          b.coffee_type?.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, approvedBatches]);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-7xl mx-auto">

        <div className="flex justify-end mb-6">
          <button
            onClick={() => navigate('/tracking')}
            className="bg-amber-700 hover:bg-amber-800 text-white px-5 py-2 rounded-xl font-medium flex items-center gap-2"
          >
            📍 Track My Orders
          </button>
        </div>

        <h1 className="text-4xl font-bold text-center mb-10">☕ Approved Coffee Batches</h1>

        <div className="max-w-2xl mx-auto mb-10">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search batches..."
            className="w-full p-3 border rounded-xl"
          />
        </div>

        {loading && <p className="text-center">Loading...</p>}
        {error   && <p className="text-red-600 text-center">{error}</p>}
        {!loading && displayedBatches.length === 0 && (
          <p className="text-center text-gray-500">No approved batches available</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayedBatches.map((batch) => (
            <div key={batch.id} className="relative group">
              <BatchCard batch={batch} userRole="CUSTOMER" />
              <button
                onClick={() => setOrderBatch(batch)}
                className="absolute bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Order
              </button>
            </div>
          ))}
        </div>
      </div>

      {orderBatch && (
        <OrderModal
          batch={orderBatch}
          onClose={() => setOrderBatch(null)}
          onSuccess={() => {
            setOrderBatch(null);
            alert('Order placed! Track it from "Track My Orders".');
          }}
        />
      )}
    </div>
  );
};

export default CustomerDashboard;
