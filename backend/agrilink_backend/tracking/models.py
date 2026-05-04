from django.db import models
from django.conf import settings
from orders.models import Order


class DeliveryTracking(models.Model):
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

    # Live location
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    last_location_update = models.DateTimeField(null=True, blank=True)

    # Status steps
    class DeliveryStatus(models.TextChoices):
        PENDING    = 'PENDING',    'Pending Pickup'
        PICKED_UP  = 'PICKED_UP',  'Picked Up'
        IN_TRANSIT = 'IN_TRANSIT', 'In Transit'
        NEARBY     = 'NEARBY',     'Nearby'
        DELIVERED  = 'DELIVERED',  'Delivered'

    status = models.CharField(
        max_length=20,
        choices=DeliveryStatus.choices,
        default=DeliveryStatus.PENDING
    )

    estimated_delivery = models.DateTimeField(null=True, blank=True)
    delivery_notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Tracking for Order #{self.order.id} — {self.status}"