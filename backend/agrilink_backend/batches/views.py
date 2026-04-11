from django.shortcuts import render

# Create your views here.
# batches/views.py
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import Batch
from .serializers import BatchSerializer, BatchCreateSerializer
from .permissions import IsDealer, IsManager, IsOwnerOrManager


class BatchViewSet(viewsets.ModelViewSet):
    """
    Main ViewSet for Coffee Batches.
    Supports different permissions and actions based on user role.
    """
    queryset = Batch.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'coffee_type', 'dealer']
    search_fields = ['origin', 'id']
    ordering_fields = ['created_at', 'quantity_kg', 'harvest_date']

    def get_serializer_class(self):
        if self.action in ['create']:
            return BatchCreateSerializer
        return BatchSerializer

    def get_permissions(self):
        if self.action in ['create']:
            permission_classes = [IsAuthenticated, IsDealer]
        elif self.action in ['approve', 'reject']:
            permission_classes = [IsAuthenticated, IsManager]
        else:
            permission_classes = [IsAuthenticated, IsOwnerOrManager]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        """Automatically set dealer when creating"""
        serializer.save(dealer=self.request.user)

    # ==================== Manager Actions ====================
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Manager approves a batch"""
        batch = self.get_object()
        
        if batch.status != 'PENDING':
            return Response(
                {"detail": "Only pending batches can be approved."},
                status=status.HTTP_400_BAD_REQUEST
            )

        batch.approve(request.user)
        serializer = BatchSerializer(batch)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Manager rejects a batch"""
        batch = self.get_object()
        
        if batch.status != 'PENDING':
            return Response(
                {"detail": "Only pending batches can be rejected."},
                status=status.HTTP_400_BAD_REQUEST
            )

        batch.reject(request.user)
        serializer = BatchSerializer(batch)
        return Response(serializer.data)

    # ==================== Dealer Actions ====================
    @action(detail=False, methods=['get'])
    def my_batches(self, request):
        """Dealer can see only their own batches"""
        batches = Batch.objects.filter(dealer=request.user)
        serializer = BatchSerializer(batches, many=True)
        return Response(serializer.data)