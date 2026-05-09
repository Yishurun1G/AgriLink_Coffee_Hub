import api from './axios';

// ─────────────────────────────────────────────────────────────────────────────
// Tracking API — all HTTP calls related to delivery tracking.
//
// Split into three sections by who uses each function:
//   Customer  — reads their own trackings, confirms status steps
//   Dealer    — reads their deliveries, shares GPS, marks picked up
//   Manager   — assigns a dealer to an order
// ─────────────────────────────────────────────────────────────────────────────


// ── Customer ──────────────────────────────────────────────────────────────────

// Fetch the tracking record for one specific order (used by the map component).
export const getMyOrderTracking = (orderId) =>
  api.get(`tracking/my-order/${orderId}/`).then((r) => r.data);

// Fetch all tracking records that belong to the logged-in customer.
export const getAllMyTrackings = () =>
  api.get('tracking/').then((r) => {
    const d = r.data;
    return Array.isArray(d) ? d : (d?.results ?? []);
  });

// Move the delivery to the next status step.
// The backend decides what "next" means based on the current status:
//   PICKED_UP → IN_TRANSIT → NEARBY → DELIVERED
export const advanceStatus = (trackingId) => {
  console.log('advanceStatus called with trackingId:', trackingId);
  return api.post(`tracking/${trackingId}/advance-status/`)
    .then((r) => {
      console.log('advanceStatus response:', r.data);
      return r.data;
    })
    .catch((err) => {
      console.error('advanceStatus error:', err);
      console.error('Error response:', err?.response);
      throw err;
    });
};


// ── Dealer ────────────────────────────────────────────────────────────────────

// Fetch all deliveries assigned to the logged-in dealer.
export const getDealerDeliveries = () =>
  api.get('tracking/').then((r) => {
    const d = r.data;
    return Array.isArray(d) ? d : (d?.results ?? []);
  });

// Send the dealer's current GPS coordinates to the server.
// Called every few seconds while the dealer has location sharing turned on.
export const updateDealerLocation = (trackingId, latitude, longitude) =>
  api.post(`tracking/${trackingId}/update-location/`, { latitude, longitude })
    .then((r) => r.data);

// Mark the order as picked up — the only status action the dealer takes.
export const markPickedUp = (trackingId) =>
  api.post(`tracking/${trackingId}/mark-picked-up/`).then((r) => r.data);


// ── Manager ───────────────────────────────────────────────────────────────────

// Assign a dealer to an order and create the tracking record.
// This sets the order status to SHIPPED and starts the delivery flow.
export const assignDelivery = (orderId, dealerId, estimatedDelivery) =>
  api.post('tracking/assign/', {
    order_id: orderId,
    dealer_id: dealerId,
    estimated_delivery: estimatedDelivery,
  }).then((r) => r.data);

// Manager: approve the delivery as nearby, advancing status to NEARBY.
export const approveTransit = (trackingId) =>
  api.post(`tracking/${trackingId}/approve-transit/`).then((r) => r.data);
