# orders/models.py

from django.db import models
from django.conf import settings
from batches.models import Batch


class Order(models.Model):

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Confirmation'
        CONFIRMED = 'CONFIRMED', 'Confirmed by Dealer'
        SHIPPED = 'SHIPPED', 'Shipped'
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

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # 🔥 VALIDATION (VERY IMPORTANT)
from django.core.exceptions import ValidationError

class Order(models.Model):

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Confirmation'
        CONFIRMED = 'CONFIRMED', 'Confirmed by Dealer'
        SHIPPED = 'SHIPPED', 'Shipped'
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

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ✅ NOW INSIDE CLASS
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
