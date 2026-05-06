# orders/serializers.py
from rest_framework import serializers
from .models import Order
from batches.serializers import BatchSerializer


class OrderSerializer(serializers.ModelSerializer):
    """Main serializer for viewing orders"""
    batch = BatchSerializer(read_only=True)
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    batch_id_short = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id',
            'customer',
            'customer_name',
            'batch',
            'batch_id_short',
            'quantity_kg',
            'status',
            'notes',
            'delivery_address',
            'delivery_lat',
            'delivery_lng',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['customer', 'status', 'created_at', 'updated_at']

    def get_batch_id_short(self, obj):
        return str(obj.batch.id)[:8] + '...' if obj.batch else None


class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for customer creating a new order"""
    class Meta:
        model = Order
        fields = ['batch', 'quantity_kg', 'notes', 'delivery_address', 'delivery_lat', 'delivery_lng']

    def create(self, validated_data):
        # Automatically set the customer to the logged-in user
        validated_data['customer'] = self.context['request'].user
        validated_data['status'] = 'PENDING'
        return super().create(validated_data)