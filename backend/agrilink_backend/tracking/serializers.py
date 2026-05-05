from rest_framework import serializers
from django.utils import timezone
from .models import DeliveryTracking


class LocationUpdateSerializer(serializers.Serializer):
    latitude  = serializers.DecimalField(max_digits=9, decimal_places=6)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6)


class DeliveryTrackingSerializer(serializers.ModelSerializer):
    order_id          = serializers.IntegerField(source='order.id', read_only=True)
    customer_name     = serializers.CharField(source='order.customer.username', read_only=True)
    dealer_name       = serializers.CharField(source='dealer.username', read_only=True)
    batch_id          = serializers.CharField(source='order.batch.id', read_only=True)
    quantity_kg       = serializers.DecimalField(source='order.quantity_kg', max_digits=10, decimal_places=2, read_only=True)
    delivery_address  = serializers.CharField(source='order.delivery_address', read_only=True)
    delivery_lat      = serializers.DecimalField(source='order.delivery_lat', max_digits=9, decimal_places=6, read_only=True, allow_null=True)
    delivery_lng      = serializers.DecimalField(source='order.delivery_lng', max_digits=9, decimal_places=6, read_only=True, allow_null=True)
    location_fresh    = serializers.SerializerMethodField()

    class Meta:
        model  = DeliveryTracking
        fields = [
            'id', 'order_id', 'customer_name', 'dealer_name',
            'batch_id', 'quantity_kg',
            'delivery_address', 'delivery_lat', 'delivery_lng',
            'status', 'latitude', 'longitude',
            'last_location_update', 'location_fresh',
            'estimated_delivery', 'delivery_notes',
            'manager_approved_transit', 'customer_approved_nearby',
            'created_at', 'updated_at',
        ]

    def get_location_fresh(self, obj):
        """True if location was updated in the last 2 minutes."""
        if not obj.last_location_update:
            return False
        delta = timezone.now() - obj.last_location_update
        return delta.total_seconds() < 120