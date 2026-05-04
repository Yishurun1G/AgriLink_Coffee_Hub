from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Order
from .serializers import OrderSerializer, OrderCreateSerializer
from batches.permissions import IsDealer, IsManager


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()

    # ✅ SERIALIZER SWITCH
    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer

    # ✅ PERMISSIONS
    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'update_status']:
            return [IsAuthenticated(), (IsDealer() | IsManager())]
        return [IsAuthenticated()]

    # ✅ FILTER DATA BASED ON ROLE
    def get_queryset(self):
        user = self.request.user

        print("USER:", user, user.role)
        print("ALL ORDERS:", Order.objects.count())

        if user.role in ['ADMIN', 'MANAGER']:
            return Order.objects.all()

        if user.role == 'DEALER':
            qs = Order.objects.filter(batch__dealer=user)
            print("DEALER ORDERS:", qs.count())
            return qs

        return Order.objects.filter(customer=user)

    # ✅ CREATE ORDER
    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)

    # ✅ UPDATE ORDER STATUS
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        user = request.user

        if user.role not in ['DEALER', 'MANAGER', 'ADMIN']:
            return Response(
                {"detail": "You are not allowed to update order status."},
                status=status.HTTP_403_FORBIDDEN
            )

        new_status = request.data.get('status')

        valid_statuses = [
            Order.Status.CONFIRMED,
            Order.Status.SHIPPED,
            Order.Status.DELIVERED,
            Order.Status.CANCELLED,
        ]

        if new_status not in valid_statuses:
            return Response(
                {"detail": "Invalid status"},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = new_status
        order.save()

        return Response(OrderSerializer(order).data)

    # ✅ CUSTOMER ORDERS
@action(detail=False, methods=['get'])
def incoming_orders(self, request):
    user = request.user
    if user.role != 'DEALER':
        return Response([])

    orders = Order.objects.filter(batch__dealer=user)
    return Response(OrderSerializer(orders, many=True).data)