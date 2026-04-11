# batches/serializers.py
from rest_framework import serializers
from django.utils.timezone import now
from .models import Batch


class BatchSerializer(serializers.ModelSerializer):
    """
    Main serializer for listing and retrieving batches.
    Used by both Dealers and Managers.
    """
    dealer_name = serializers.SerializerMethodField()
    validated_by_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    coffee_type_display = serializers.CharField(source='get_coffee_type_display', read_only=True)

    class Meta:
        model = Batch
        fields = [
            'id',
            'dealer',
            'dealer_name',
            'validated_by',
            'validated_by_name',
            'coffee_type',
            'coffee_type_display',
            'origin',
            'quantity_kg',
            'harvest_date',
            'status',
            'status_display',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'dealer', 'validated_by', 'status', 'created_at', 'updated_at']

    def get_dealer_name(self, obj):
        return obj.dealer.get_full_name() if obj.dealer else None

    def get_validated_by_name(self, obj):
        return obj.validated_by.get_full_name() if obj.validated_by else None


class BatchCreateSerializer(serializers.ModelSerializer):
    """
    Serializer specifically for Dealers creating a new batch.
    Automatically sets the dealer to the current user.
    """
    class Meta:
        model = Batch
        fields = ['coffee_type', 'origin', 'quantity_kg', 'harvest_date']

    def create(self, validated_data):
        # Automatically assign the logged-in dealer
        validated_data['dealer'] = self.context['request'].user
        validated_data['status'] = 'PENDING'
        return super().create(validated_data)