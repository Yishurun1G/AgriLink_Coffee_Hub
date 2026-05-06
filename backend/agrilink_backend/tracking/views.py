from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404

from orders.models import Order
from .models import DeliveryTracking
from .serializers import DeliveryTrackingSerializer, LocationUpdateSerializer

# ── Delivery status flow ───────────────────────────────────────────────────
# PENDING    → PICKED_UP   : Dealer marks picked up
# PICKED_UP  → IN_TRANSIT  : Customer approves
# IN_TRANSIT → NEARBY      : Customer approves
# NEARBY     → DELIVERED   : Customer approves
#
# Manager only assigns the shipment (creates the tracking record).


class DeliveryTrackingViewSet(viewsets.ModelViewSet):
    serializer_class   = DeliveryTrackingSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names  = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        role = user.role.upper()
        if role == 'CUSTOMER':
            return DeliveryTracking.objects.filter(
                order__customer=user
            ).select_related('order__customer', 'order__batch', 'dealer')
        elif role == 'DEALER':
            return DeliveryTracking.objects.filter(
                dealer=user
            ).select_related('order__customer', 'order__batch', 'dealer')
        return DeliveryTracking.objects.all().select_related(
            'order__customer', 'order__batch', 'dealer'
        )

    # ── Dealer: update GPS location ────────────────────────────────────────
    @action(detail=True, methods=['post'], url_path='update-location')
    def update_location(self, request, pk=None):
        tracking = self.get_object()
        if request.user.role.upper() != 'DEALER':
            return Response({'detail': 'Only dealers can update location.'}, status=status.HTTP_403_FORBIDDEN)
        if tracking.dealer != request.user:
            return Response({'detail': 'You are not assigned to this delivery.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = LocationUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tracking.latitude             = serializer.validated_data['latitude']
        tracking.longitude            = serializer.validated_data['longitude']
        tracking.last_location_update = timezone.now()
        tracking.save(update_fields=['latitude', 'longitude', 'last_location_update'])
        return Response({'detail': 'Location updated.'})

    # ── Dealer: mark as PICKED_UP (only status dealer can set) ────────────
    @action(detail=True, methods=['post'], url_path='mark-picked-up')
    def mark_picked_up(self, request, pk=None):
        tracking = self.get_object()
        if request.user.role.upper() != 'DEALER':
            return Response({'detail': 'Only dealers can mark picked up.'}, status=status.HTTP_403_FORBIDDEN)
        if tracking.dealer != request.user:
            return Response({'detail': 'You are not assigned to this delivery.'}, status=status.HTTP_403_FORBIDDEN)
        if tracking.status != 'PENDING':
            return Response({'detail': 'Can only mark as Picked Up from Pending status.'}, status=status.HTTP_400_BAD_REQUEST)

        tracking.status = 'PICKED_UP'
        tracking.save(update_fields=['status', 'updated_at'])
        return Response(DeliveryTrackingSerializer(tracking, context={'request': request}).data)

    # ── Customer: advance status ───────────────────────────────────────────
    # Customer drives the delivery forward after the dealer picks up.
    # PICKED_UP → IN_TRANSIT → NEARBY → DELIVERED
    @action(detail=True, methods=['post'], url_path='advance-status')
    def advance_status(self, request, pk=None):
        tracking = self.get_object()
        if request.user.role.upper() != 'CUSTOMER':
            return Response({'detail': 'Only customers can advance the delivery status.'}, status=status.HTTP_403_FORBIDDEN)
        if tracking.order.customer != request.user:
            return Response({'detail': 'This is not your order.'}, status=status.HTTP_403_FORBIDDEN)

        transitions = {
            'PICKED_UP':  'IN_TRANSIT',
            'IN_TRANSIT': 'NEARBY',
            'NEARBY':     'DELIVERED',
        }

        next_status = transitions.get(tracking.status)
        if not next_status:
            return Response(
                {'detail': f'Cannot advance from {tracking.status}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        tracking.status = next_status
        if next_status == 'DELIVERED':
            tracking.order.status = 'DELIVERED'
            tracking.order.save(update_fields=['status'])

        tracking.save(update_fields=['status', 'updated_at'])
        return Response(DeliveryTrackingSerializer(tracking, context={'request': request}).data)

    # ── Manager/Admin: assign dealer to order ──────────────────────────────
    @action(detail=False, methods=['post'], url_path='assign')
    def assign(self, request):
        if request.user.role.upper() not in ('MANAGER', 'ADMIN'):
            return Response({'detail': 'Only managers can assign deliveries.'}, status=status.HTTP_403_FORBIDDEN)

        order_id  = request.data.get('order_id')
        dealer_id = request.data.get('dealer_id')
        estimated = request.data.get('estimated_delivery')

        order = get_object_or_404(Order, id=order_id)
        if hasattr(order, 'tracking'):
            return Response({'detail': 'This order already has tracking assigned.'}, status=status.HTTP_400_BAD_REQUEST)

        from django.contrib.auth import get_user_model
        User   = get_user_model()
        dealer = get_object_or_404(User, id=dealer_id, role__iexact='dealer')

        tracking = DeliveryTracking.objects.create(
            order=order, dealer=dealer,
            estimated_delivery=estimated, status='PENDING',
        )
        order.status = 'SHIPPED'
        order.save(update_fields=['status'])

        return Response(
            DeliveryTrackingSerializer(tracking, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    # ── Customer: get tracking for their specific order ────────────────────
    @action(detail=False, methods=['get'], url_path='my-order/(?P<order_id>[^/.]+)')
    def my_order(self, request, order_id=None):
        tracking = get_object_or_404(
            DeliveryTracking,
            order__id=order_id,
            order__customer=request.user
        )
        return Response(DeliveryTrackingSerializer(tracking, context={'request': request}).data)
