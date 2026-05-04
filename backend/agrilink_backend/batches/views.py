# batches/views.py

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
# batches/views.py

from rest_framework.exceptions import PermissionDenied

from .models import Batch
from .serializers import BatchSerializer, BatchCreateSerializer
from .permissions import IsDealer, IsManager, IsOwnerOrManagerOrCustomer



class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.all()
    
    # 🔍 Filtering, search, ordering
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'coffee_type', 'dealer']
    search_fields = ['origin', 'id']
    ordering_fields = ['created_at', 'quantity_kg', 'harvest_date']

    # 📦 Choose serializer
    def get_serializer_class(self):
        if self.action == 'create':
            return BatchCreateSerializer
        return BatchSerializer

    # 🔐 Permissions
    def get_permissions(self):
        if self.action == 'create':
         permission_classes = [IsAuthenticated, IsDealer]

        elif self.action in ['approve', 'reject']:
            permission_classes = [IsAuthenticated, IsManager]

        elif self.action == 'approved':
            permission_classes = [IsAuthenticated]  # Customers can access

        else:
            permission_classes = [IsAuthenticated, IsOwnerOrManagerOrCustomer]

        return [permission() for permission in permission_classes]

    
    def get_queryset(self):
     user = self.request.user

    # 🔥 Customer ONLY sees approved batches
     if user.role == 'CUSTOMER':
        return Batch.objects.filter(status='APPROVED')

    # 🔥 Dealer sees only their own batches
     if user.role == 'DEALER':
        return Batch.objects.filter(dealer=user)

    # 🔥 Manager sees everything
     if user.role in ['MANAGER', 'ADMIN']:
        return Batch.objects.all()

     return Batch.objects.none()
       
    # 👤 Auto assign dealer
    def perform_create(self, serializer):
        serializer.save(dealer=self.request.user)

    # ✅ APPROVE batch (Manager)
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        batch = self.get_object()

        if batch.status != 'PENDING':
            return Response(
                {"detail": "Only pending batches can be approved."},
                status=status.HTTP_400_BAD_REQUEST
            )

        batch.status = 'APPROVED'
        batch.save()

        return Response({
            "message": "Batch approved successfully",
            "data": BatchSerializer(batch).data
        })

    # ❌ REJECT batch (Manager)
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        batch = self.get_object()

        if batch.status != 'PENDING':
            return Response(
                {"detail": "Only pending batches can be rejected."},
                status=status.HTTP_400_BAD_REQUEST
            )

        batch.status = 'REJECTED'
        batch.save()

        return Response({
            "message": "Batch rejected successfully",
            "data": BatchSerializer(batch).data
        })
      

    # 📦 DEALER: My batches
    @action(detail=False, methods=['get'])
    def my_batches(self, request):
        batches = Batch.objects.filter(dealer=request.user)
        serializer = BatchSerializer(batches, many=True)
        return Response(serializer.data)

    # 🌍 CUSTOMER: Approved batches 
    @action(detail=False, methods=['get'])
    def approved_batches(self, request):
        batches = Batch.objects.filter(status='APPROVED')
        serializer = BatchSerializer(batches, many=True)
        return Response(serializer.data)