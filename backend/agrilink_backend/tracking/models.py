from django.db import models
from django.conf import settings
from orders.models import Order


# ─────────────────────────────────────────────────────────────────────────────
# DeliveryTracking model
#
# One tracking record is created for every order that gets shipped.
# It stores:
#   - which order and which dealer this belongs to
#   - the dealer's live GPS location (updated while they are on the road)
#   - the current delivery status (see the 5 steps below)
#   - timestamps for when it was created and last changed
#
# Delivery flow (who moves it forward):
#   PENDING    → PICKED_UP   : Dealer taps "Mark as Picked Up"
#   PICKED_UP  → IN_TRANSIT  : Customer confirms
#   IN_TRANSIT → NEARBY      : Customer confirms
#   NEARBY     → DELIVERED   : Customer confirms
#
# The manager only assigns the shipment — they don't touch the status.
# ─────────────────────────────────────────────────────────────────────────────
class DeliveryTracking(models.Model):

    # ── Links to the order and the dealer assigned to deliver it ─────────────
    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE,
        related_name='tracking'
    )
    dealer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='deliveries'
    )

    # ── Live GPS location sent by the dealer's phone ──────────────────────────
    # These fields are updated every few seconds while the dealer is sharing.
    # null means the dealer hasn't started sharing yet.
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    last_location_update = models.DateTimeField(null=True, blank=True)

    # ── The 5 delivery status steps ───────────────────────────────────────────
    class DeliveryStatus(models.TextChoices):
        PENDING    = 'PENDING',    'Pending Pickup'   # assigned, dealer hasn't picked up yet
        PICKED_UP  = 'PICKED_UP',  'Picked Up'        # dealer has the order
        IN_TRANSIT = 'IN_TRANSIT', 'In Transit'       # dealer is on the road
        NEARBY     = 'NEARBY',     'Nearby'           # dealer is close to the customer
        DELIVERED  = 'DELIVERED',  'Delivered'        # customer received the order

    status = models.CharField(
        max_length=20,
        choices=DeliveryStatus.choices,
        default=DeliveryStatus.PENDING
    )

    # ── Optional extra info ───────────────────────────────────────────────────
    estimated_delivery = models.DateTimeField(null=True, blank=True)
    delivery_notes = models.TextField(blank=True, null=True)

    # ── Legacy approval flags (kept for DB compatibility, no longer used) ─────
    manager_approved_transit = models.BooleanField(default=False)
    customer_approved_nearby = models.BooleanField(default=False)

    # ── Auto-managed timestamps ───────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Tracking for Order #{self.order.id} — {self.status}"
