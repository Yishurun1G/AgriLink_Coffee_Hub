from django.db import models

# Create your models here.
# batches/models.py
import uuid
from django.db import models
from django.conf import settings


class Batch(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending Verification'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]

    COFFEE_TYPES = [
        ('ARABICA', 'Arabica'),
        ('ROBUSTA', 'Robusta'),
        ('EXCELSA', 'Excelsa'),
        ('LIBERICA', 'Liberica'),
    ]

    # 1. Identification - UUID is perfect for QR code scanning
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # 2. Relationships
    dealer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_batches'
    )

    validated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='validated_batches'
    )

    # 3. Coffee Information
    coffee_type = models.CharField(
        max_length=20,
        choices=COFFEE_TYPES,
        default='ARABICA'
    )
    origin = models.CharField(
        max_length=255,
        help_text="Specific farm, region, or estate name"
    )
    quantity_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Weight in kilograms"
    )
    harvest_date = models.DateField()

    # 4. Status & Timestamps
    status = models.CharField(
        max_length=15,
        choices=STATUS_CHOICES,
        default='PENDING'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Batches"
        ordering = ['-created_at']
        permissions = [
            ("approve_batch", "Can approve or reject batches"),
        ]

    def __str__(self):
        return f"Batch {self.id} - {self.coffee_type} ({self.origin}) - {self.status}"

    def approve(self, manager):
        """Helper method to approve a batch"""
        self.status = 'APPROVED'
        self.validated_by = manager
        self.save()

    def reject(self, manager):
        """Helper method to reject a batch"""
        self.status = 'REJECTED'
        self.validated_by = manager
        self.save()