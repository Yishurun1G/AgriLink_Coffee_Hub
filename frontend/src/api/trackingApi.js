import api from './axios';

// ── Customer ──────────────────────────────────────────────────────────────
export const getMyOrderTracking = (orderId) =>
  api.get(`tracking/my-order/${orderId}/`).then((r) => r.data);

export const getAllMyTrackings = () =>
  api.get('tracking/').then((r) => r.data.results ?? r.data);

// Customer advances the delivery: PICKED_UP → IN_TRANSIT → NEARBY → DELIVERED
export const advanceStatus = (trackingId) =>
  api.post(`tracking/${trackingId}/advance-status/`).then((r) => r.data);

// ── Dealer ────────────────────────────────────────────────────────────────
export const getDealerDeliveries = () =>
  api.get('tracking/').then((r) => r.data.results ?? r.data);

export const updateDealerLocation = (trackingId, latitude, longitude) =>
  api.post(`tracking/${trackingId}/update-location/`, { latitude, longitude })
    .then((r) => r.data);

// Dealer marks the order as picked up (only action dealer takes on status)
export const markPickedUp = (trackingId) =>
  api.post(`tracking/${trackingId}/mark-picked-up/`).then((r) => r.data);

// ── Manager ───────────────────────────────────────────────────────────────
export const assignDelivery = (orderId, dealerId, estimatedDelivery) =>
  api.post('tracking/assign/', {
    order_id: orderId,
    dealer_id: dealerId,
    estimated_delivery: estimatedDelivery,
  }).then((r) => r.data);
