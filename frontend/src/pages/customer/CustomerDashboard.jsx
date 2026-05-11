import { useState, useEffect, useRef } from 'react';
import axios from '../../api/axios';
import BatchCard from '../../components/common/BatchCard';
import { useNavigate } from 'react-router-dom';

// ── Order Modal ───────────────────────────────────────────────────────────
function OrderModal({ batch, onClose, onSuccess }) {
  const [quantity, setQuantity] = useState(batch.quantity_kg);
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [address, setAddress] = useState('');
  const [pinLat, setPinLat] = useState(null);
  const [pinLng, setPinLng] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const debounceRef = useRef(null);

  const dropPin = (lat, lng, label) => {
    const L = window.L;
    if (!L || !mapRef.current) return;

    setPinLat(lat);
    setPinLng(lng);

    const pinIcon = L.divIcon({
      html: `<div style="background:#7B4B2A;color:#fff;width:36px;height:36px;
      border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      display:flex;align-items:center;justify-content:center;
      font-size:16px;box-shadow:0 4px 12px rgba(0,0,0,0.35);border:2px solid #fff;">
      <span style="transform:rotate(45deg)">☕</span></div>`,
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]).bindPopup(label).openPopup();
    } else {
      markerRef.current = L.marker([lat, lng], { icon: pinIcon })
        .addTo(mapRef.current)
        .bindPopup(label)
        .openPopup();
    }

    mapRef.current.setView([lat, lng], 15);
  };

  useEffect(() => {
    const initMap = (L) => {
      if (mapRef.current) return;

      const map = L.map('order-map').setView([9.0, 38.7], 12);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;

        fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
        )
          .then((r) => r.json())
          .then((d) => {
            const name =
              d.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

            setAddress(name);
            setSearchInput(name);
            setSuggestions([]);
            dropPin(lat, lng, name);
          });
      });
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
      initMap(window.L);
      return;
    }

    const script = document.createElement('script');
    script.src =
      'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

    script.onload = () => initMap(window.L);
    document.head.appendChild(script);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  const handleSearchInput = (val) => {
    setSearchInput(val);
    setAddress('');

    clearTimeout(debounceRef.current);

    if (val.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            val
          )}&format=json&limit=5&addressdetails=1`
        );

        const data = await res.json();
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      }
    }, 400);
  };

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
    if (!quantity || Number(quantity) <= 0) {
      setError('Enter a valid quantity.');
      return;
    }

    if (!address.trim() || !pinLat || !pinLng) {
      setError('Please select a delivery location.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await axios.post('/orders/', {
        batch: batch.id,
        quantity_kg: Number(quantity),
        notes,
        delivery_address: address,
        delivery_lat: Number(pinLat).toFixed(6),
        delivery_lng: Number(pinLng).toFixed(6),
      });

      onSuccess();
    } catch (err) {
      setError(
        err?.response?.data?.detail ??
          'Failed to place order.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={modal.overlay} onClick={onClose}>
      <div style={modal.box} onClick={(e) => e.stopPropagation()}>
        <div style={modal.header}>
          <div>
            <h2 style={modal.title}>☕ Place Order</h2>
            <p style={modal.subtitle}>
              {batch.coffee_type_display || batch.coffee_type} · {batch.origin}
            </p>
          </div>

          <button style={modal.close} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={modal.field}>
          <label style={modal.label}>Quantity (kg)</label>

          <input
            type="number"
            min="0.1"
            step="0.1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            style={modal.input}
          />
        </div>

        <div style={modal.field}>
          <label style={modal.label}>Delivery Location</label>

          <div style={{ position: 'relative' }}>
            <input
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Search street, landmark or area..."
              style={modal.input}
            />

            {suggestions.length > 0 && (
              <div style={modal.suggestions}>
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    style={modal.suggestionItem}
                    onClick={() => handlePickSuggestion(s)}
                  >
                    <div style={{ fontWeight: 700 }}>
                      {s.address?.road ||
                        s.address?.city ||
                        s.name ||
                        'Location'}
                    </div>

                    <div style={modal.suggestionSub}>
                      {s.display_name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {address && (
            <div style={modal.confirmed}>
              ✅ {address}
            </div>
          )}
        </div>

        <div style={modal.field}>
          <label style={modal.label}>📍 Confirm on Map</label>

          <div id="order-map" style={modal.map} />
        </div>

        <div style={modal.field}>
          <label style={modal.label}>Notes</label>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={modal.textarea}
            placeholder="Any delivery instructions..."
          />
        </div>

        {error && <p style={modal.error}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={modal.button}
        >
          {submitting ? 'Placing Order...' : '☕ Confirm Order'}
        </button>
      </div>
    </div>
  );
}

const modal = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(18, 12, 8, 0.65)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
  },

  box: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '92vh',
    overflowY: 'auto',
    borderRadius: 28,
    padding: 28,
    background:
      'linear-gradient(145deg, rgba(255,248,240,0.96), rgba(245,233,220,0.94))',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.25)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 800,
    color: '#3E1F00',
  },

  subtitle: {
    marginTop: 6,
    color: '#8A6A52',
    fontSize: 14,
  },

  close: {
    background: 'rgba(255,255,255,0.7)',
    border: 'none',
    width: 38,
    height: 38,
    borderRadius: 12,
    cursor: 'pointer',
    fontSize: 18,
    color: '#5C3A21',
  },

  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },

  label: {
    fontSize: 13,
    fontWeight: 700,
    color: '#6B4226',
    letterSpacing: 0.5,
  },

  input: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 16,
    border: '1px solid rgba(111,78,55,0.18)',
    background: 'rgba(255,255,255,0.75)',
    color: '#2D1A0E',
    fontSize: 14,
    outline: 'none',
  },

  textarea: {
    padding: '14px 16px',
    borderRadius: 16,
    border: '1px solid rgba(111,78,55,0.18)',
    background: 'rgba(255,255,255,0.75)',
    minHeight: 90,
    resize: 'vertical',
    fontSize: 14,
    color: '#2D1A0E',
  },

  map: {
    height: 240,
    borderRadius: 20,
    overflow: 'hidden',
    border: '2px solid rgba(111,78,55,0.15)',
  },

  suggestions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    background: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
    zIndex: 20,
    maxHeight: 240,
    overflowY: 'auto',
  },

  suggestionItem: {
    padding: '14px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid #F1E5DA',
  },

  suggestionSub: {
    marginTop: 4,
    fontSize: 12,
    color: '#8A6A52',
  },

  confirmed: {
    background: '#EDF7EE',
    color: '#2E7D32',
    padding: '10px 14px',
    borderRadius: 14,
    border: '1px solid #B7D9BA',
    fontSize: 13,
    fontWeight: 600,
  },

  error: {
    color: '#C0392B',
    fontSize: 13,
    fontWeight: 600,
  },

  button: {
    background:
      'linear-gradient(135deg, #6F4E37, #8B5E3C)',
    color: '#fff',
    border: 'none',
    borderRadius: 18,
    padding: '15px',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 10px 24px rgba(111,78,55,0.3)',
  },
};

// ── Track Button ──────────────────────────────────────────────────────────
function TrackButton({ navigate }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    Promise.all([
      axios
        .get('/tracking/')
        .then((r) => {
          const data = Array.isArray(r.data)
            ? r.data
            : r.data?.results ?? [];

          return data.filter((t) => t.status !== 'DELIVERED');
        })
        .catch(() => []),

      axios
        .get('/orders/?page_size=100')
        .then((r) => {
          const data = Array.isArray(r.data)
            ? r.data
            : r.data?.results ?? [];

          return data.filter(
            (o) => o.status?.toUpperCase() === 'SHIPPED'
          );
        })
        .catch(() => []),
    ]).then(([activeTrackings, shippedOrders]) => {
      const trackedOrderIds = new Set(
        activeTrackings.map((t) => String(t.order_id))
      );

      const untracked = shippedOrders.filter(
        (o) => !trackedOrderIds.has(String(o.id))
      );

      setCount(activeTrackings.length + untracked.length);
    });
  }, []);

  return (
    <button
      onClick={() => navigate('/tracking')}
      className="relative px-6 py-3 rounded-2xl text-white font-semibold shadow-lg transition-all duration-300 hover:scale-105"
      style={{
        background:
          'linear-gradient(135deg, #6F4E37, #9C6B46)',
      }}
    >
      📍 Track My Orders

      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow">
          {count}
        </span>
      )}
    </button>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────
const CustomerDashboard = () => {
  const navigate = useNavigate();

  const [approvedBatches, setApprovedBatches] = useState([]);
  const [displayedBatches, setDisplayedBatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderBatch, setOrderBatch] = useState(null);

  const fetchApprovedBatches = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        '/batches/approved_batches/'
      );

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];

      setApprovedBatches(data);
      setDisplayedBatches(data);
    } catch (err) {
      setError('Failed to load approved batches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedBatches();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setDisplayedBatches(approvedBatches);
    } else {
      const term = searchTerm.toLowerCase();

      setDisplayedBatches(
        approvedBatches.filter(
          (b) =>
            b.id?.toLowerCase().includes(term) ||
            b.origin?.toLowerCase().includes(term) ||
            b.coffee_type?.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, approvedBatches]);

  return (
    <div
      className="min-h-screen py-10 px-4"
      style={{
        backgroundImage: `
          linear-gradient(rgba(18,12,8,0.70), rgba(18,12,8,0.70)),
          url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-end mb-8">
          <TrackButton navigate={navigate} />
        </div>

        <div className="text-center mb-12">
          <h1
            className="text-5xl font-black text-white mb-4"
            style={{
              fontFamily: "'Playfair Display', serif",
            }}
          >
            ☕ Premium Coffee Marketplace
          </h1>

          <p className="text-amber-100 text-lg">
            Discover freshly approved Ethiopian coffee batches
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-12">
          <div
            className="backdrop-blur-xl rounded-3xl p-3 border"
            style={{
              background: 'rgba(255,255,255,0.12)',
              borderColor: 'rgba(255,255,255,0.18)',
            }}
          >
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search coffee batches..."
              className="w-full px-5 py-4 rounded-2xl outline-none text-white placeholder:text-amber-100"
              style={{
                background: 'rgba(255,255,255,0.08)',
              }}
            />
          </div>
        </div>

        {loading && (
          <p className="text-center text-white text-lg">
            Loading coffee batches...
          </p>
        )}

        {error && (
          <p className="text-center text-red-300">
            {error}
          </p>
        )}

        {!loading && displayedBatches.length === 0 && (
          <div
            className="text-center rounded-3xl py-20"
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <p className="text-5xl mb-4">☕</p>
            <p className="text-amber-100">
              No approved coffee batches available
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {displayedBatches.map((batch) => (
            <div
              key={batch.id}
              className="relative group transition-all duration-300 hover:-translate-y-2"
            >
              <div
                className="absolute inset-0 rounded-[30px] blur-2xl opacity-0 group-hover:opacity-100 transition duration-300"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(193,154,107,0.35), rgba(111,78,55,0.45))',
                }}
              />

              <div className="relative">
                <BatchCard
                  batch={batch}
                  userRole="CUSTOMER"
                />

                <button
                  onClick={() => setOrderBatch(batch)}
                  className="absolute bottom-5 right-5 px-5 py-3 rounded-2xl text-white font-semibold shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-105"
                  style={{
                    background:
                      'linear-gradient(135deg, #6F4E37, #A06A42)',
                  }}
                >
                  ☕ Order Now
                </button>
              </div>
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

            alert(
              'Order placed successfully! ☕'
            );
          }}
        />
      )}
    </div>
  );
};

export default CustomerDashboard;