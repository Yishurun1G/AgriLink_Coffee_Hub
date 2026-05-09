# orders/serializers.py
from rest_framework import serializers
from .models import Order
from batches.serializers import BatchSerializer


class OrderSerializer(serializers.ModelSerializer):
    """Main serializer for viewing orders"""
    batch = BatchSerializer(read_only=True)
    customer_name = serializers.SerializerMethodField()
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

    def get_customer_name(self, obj):
        if not obj.customer:
            return None
        full_name = obj.customer.get_full_name()
        username = obj.customer.username
        result = full_name if full_name.strip() else username
        print(f"[DEBUG] get_customer_name - Order {obj.id}: customer={username}, role={obj.customer.role}, returning={result}")
        return result

    def get_batch_id_short(self, obj):
        return str(obj.batch.id)[:8] + '...' if obj.batch else None


class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for customer creating a new order"""
    class Meta:
        model = Order
        fields = ['batch', 'quantity_kg', 'notes', 'delivery_address', 'delivery_lat', 'delivery_lng']

    def create(self, validated_data):
        # Automatically set the customer to the logged-in user
        user = self.context['request'].user
        
        # Only customers can create orders
        if getattr(user, 'role', '').upper() != 'CUSTOMER':
            raise serializers.ValidationError("Only customers can place orders.")
        
        validated_data['customer'] = user
        validated_data['status'] = 'PENDING'
        return super().create(validated_data)