from django.contrib import admin
from .models import DeliveryTracking

@admin.register(DeliveryTracking)
class DeliveryTrackingAdmin(admin.ModelAdmin):
    list_display  = ['id', 'order', 'dealer', 'status', 'last_location_update']
    list_filter   = ['status']
    search_fields = ['order__id', 'dealer__username']