# reports/models.py
from django.db import models
from django.conf import settings
from django.utils import timezone


class Report(models.Model):
    """
    Stores generated reports for managers and admins.
    Reports can be sales reports, inventory reports, dealer performance, etc.
    """
    
    class ReportType(models.TextChoices):
        SALES = 'SALES', 'Sales Report'
        INVENTORY = 'INVENTORY', 'Inventory Report'
        DEALER_PERFORMANCE = 'DEALER_PERFORMANCE', 'Dealer Performance'
        CUSTOMER_ACTIVITY = 'CUSTOMER_ACTIVITY', 'Customer Activity'
        ORDER_SUMMARY = 'ORDER_SUMMARY', 'Order Summary'
        BATCH_SUMMARY = 'BATCH_SUMMARY', 'Batch Summary'
        REVENUE = 'REVENUE', 'Revenue Report'
        DELIVERY_PERFORMANCE = 'DELIVERY_PERFORMANCE', 'Delivery Performance'
    
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        GENERATING = 'GENERATING', 'Generating'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'
    
    # Report metadata
    title = models.CharField(max_length=255)
    report_type = models.CharField(
        max_length=30,
        choices=ReportType.choices,
        default=ReportType.SALES
    )
    description = models.TextField(blank=True, null=True)
    
    # Who requested the report
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reports_created'
    )
    
    # Date range for the report
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Report data (stored as JSON)
    data = models.JSONField(default=dict, blank=True)
    
    # Status tracking
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    
    # File attachment (optional - for PDF/Excel exports)
    file = models.FileField(
        upload_to='reports/%Y/%m/',
        blank=True,
        null=True
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    # Error tracking
    error_message = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Report'
        verbose_name_plural = 'Reports'
    
    def __str__(self):
        return f"{self.title} - {self.report_type} ({self.status})"
    
    def mark_completed(self):
        """Mark report as completed"""
        self.status = self.Status.COMPLETED
        self.completed_at = timezone.now()
        self.save()
    
    def mark_failed(self, error_message):
        """Mark report as failed with error message"""
        self.status = self.Status.FAILED
        self.error_message = error_message
        self.save()


class ReportSchedule(models.Model):
    """
    Allows scheduling of recurring reports (e.g., weekly sales report)
    """
    
    class Frequency(models.TextChoices):
        DAILY = 'DAILY', 'Daily'
        WEEKLY = 'WEEKLY', 'Weekly'
        MONTHLY = 'MONTHLY', 'Monthly'
        QUARTERLY = 'QUARTERLY', 'Quarterly'
    
    title = models.CharField(max_length=255)
    report_type = models.CharField(
        max_length=30,
        choices=Report.ReportType.choices
    )
    
    # Who should receive the report
    recipients = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='scheduled_reports'
    )
    
    # Schedule settings
    frequency = models.CharField(
        max_length=20,
        choices=Frequency.choices,
        default=Frequency.WEEKLY
    )
    
    # When to run (day of week for weekly, day of month for monthly)
    day_of_week = models.IntegerField(
        blank=True,
        null=True,
        help_text="0=Monday, 6=Sunday"
    )
    day_of_month = models.IntegerField(
        blank=True,
        null=True,
        help_text="1-31"
    )
    
    # Active status
    is_active = models.BooleanField(default=True)
    
    # Last run tracking
    last_run = models.DateTimeField(blank=True, null=True)
    next_run = models.DateTimeField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Report Schedule'
        verbose_name_plural = 'Report Schedules'
    
    def __str__(self):
        return f"{self.title} - {self.frequency}"
