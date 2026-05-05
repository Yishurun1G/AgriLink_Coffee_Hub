# orders/models.py
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from batches.models import Batch


class Order(models.Model):

    class Status(models.TextChoices):
        PENDING   = 'PENDING',   'Pending Confirmation'
        CONFIRMED = 'CONFIRMED', 'Confirmed by Dealer'
        SHIPPED   = 'SHIPPED',   'Shipped'
        DELIVERED = 'DELIVERED', 'Delivered'
        CANCELLED = 'CANCELLED', 'Cancelled'

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='orders'
    )

    batch = models.ForeignKey(
        Batch,
        on_delete=models.CASCADE,
        related_name='batch_orders'
    )

    quantity_kg = models.DecimalField(max_digits=10, decimal_places=2)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    notes = models.TextField(blank=True, null=True)

    # Delivery address specified by the customer when ordering
    delivery_address = models.CharField(max_length=500, blank=True, null=True)
    delivery_lat     = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    delivery_lng     = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.quantity_kg <= 0:
            raise ValidationError("Quantity must be greater than 0")
        if self.quantity_kg > self.batch.quantity_kg:
            raise ValidationError("Cannot order more than available batch quantity")

    def __str__(self):
        return f"Order #{self.id} - {self.customer.username} - Batch {self.batch.id} ({self.status})"

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Orders"
