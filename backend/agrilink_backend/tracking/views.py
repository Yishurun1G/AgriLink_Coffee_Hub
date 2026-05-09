from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404

from orders.models import Order
from .models import DeliveryTracking
from .serializers import DeliveryTrackingSerializer, LocationUpdateSerializer

# ─────────────────────────────────────────────────────────────────────────────
# Delivery status flow — who does what
#
#   PENDING    → PICKED_UP   : Dealer taps "Mark as Picked Up"
#   PICKED_UP  → IN_TRANSIT  : Customer confirms
#   IN_TRANSIT → NEARBY      : Customer confirms
#   NEARBY     → DELIVERED   : Customer confirms
#
# The manager only assigns the shipment (creates the tracking record).
# After that, the dealer picks up and the customer drives everything forward.
# ─────────────────────────────────────────────────────────────────────────────


class DeliveryTrackingViewSet(viewsets.ModelViewSet):
    serializer_class   = DeliveryTrackingSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names  = ['get', 'post', 'patch', 'head', 'options']

    # ── Filter records by who is asking ──────────────────────────────────────
    # Customers only see their own orders.
    # Dealers only see deliveries assigned to them.
    # Managers and admins see everything.
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

    # ── Dealer: send their current GPS coordinates ────────────────────────────
    # Called every few seconds by the dealer's phone while they are on the road.
    # Saves the lat/lng and records the time so the customer can see a "Live" badge.
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

    # ── Dealer: mark the order as picked up ───────────────────────────────────
    # This is the only status change the dealer makes.
    # The order must be in PENDING state — you can't pick up something twice.
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

    # ── Customer: move the delivery to the next step ──────────────────────────
    # The customer controls all steps after PICKED_UP.
    # The allowed transitions are defined in the `transitions` dict below.
    # When the customer confirms DELIVERED, the linked order is also marked delivered.
    @action(detail=True, methods=['post'], url_path='advance-status')
    def advance_status(self, request, pk=None):
        tracking = self.get_object()
        user_role = getattr(request.user, 'role', '').upper()
        
        print(f"[DEBUG] advance_status called by user: {request.user.username}, role: {user_role}")
        print(f"[DEBUG] tracking status: {tracking.status}, order customer: {tracking.order.customer.username}")
        
        if user_role != 'CUSTOMER':
            return Response({'detail': 'Only customers can advance the delivery status.'}, status=status.HTTP_403_FORBIDDEN)
        if tracking.order.customer != request.user:
            return Response({'detail': 'This is not your order.'}, status=status.HTTP_403_FORBIDDEN)

        # Map of current status → what it becomes when the customer confirms
        # Customer confirms through all three steps:
        #   PICKED_UP  → IN_TRANSIT
        #   IN_TRANSIT → NEARBY
        #   NEARBY     → DELIVERED
        transitions = {
            'PICKED_UP':  'IN_TRANSIT',
            'IN_TRANSIT': 'NEARBY',
            'NEARBY':     'DELIVERED',
        }

        next_status = transitions.get(tracking.status)
        print(f"[DEBUG] Current status: {tracking.status}, Next status: {next_status}")
        
        if not next_status:
            return Response(
                {'detail': f'Cannot advance from {tracking.status}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        tracking.status = next_status

        # When the final step is confirmed, also close out the order itself
        if next_status == 'DELIVERED':
            tracking.order.status = 'DELIVERED'
            tracking.order.save(update_fields=['status'])

        tracking.save(update_fields=['status', 'updated_at'])
        print(f"[DEBUG] Status updated to: {tracking.status}")
        return Response(DeliveryTrackingSerializer(tracking, context={'request': request}).data)

    # ── Manager: assign a dealer to an order ─────────────────────────────────
    # Creates the tracking record and sets the order status to SHIPPED.
    # After this point the manager's job is done — dealer and customer take over.
    @action(detail=False, methods=['post'], url_path='assign')
    def assign(self, request):
        user_role = getattr(request.user, 'role', '').upper()
        if user_role not in ('MANAGER', 'ADMIN'):
            return Response({'detail': 'Only managers can assign deliveries.'}, status=status.HTTP_403_FORBIDDEN)

        order_id  = request.data.get('order_id')
        dealer_id = request.data.get('dealer_id')
        estimated = request.data.get('estimated_delivery')

        order = get_object_or_404(Order, id=order_id)
        if hasattr(order, 'tracking'):
            return Response({'detail': 'This order already has tracking assigned.'}, status=status.HTTP_400_BAD_REQUEST)

        from django.contrib.auth import get_user_model
        User   = get_user_model()
        
        # Strict validation: dealer must have role='DEALER' (case-insensitive)
        try:
            dealer = User.objects.get(id=dealer_id)
            if dealer.role.upper() != 'DEALER':
                return Response(
                    {'detail': f'User {dealer.username} is not a dealer (role: {dealer.role}).'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except User.DoesNotExist:
            return Response({'detail': 'Dealer not found.'}, status=status.HTTP_404_NOT_FOUND)

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

    # ── Customer: fetch tracking for one specific order ───────────────────────
    # Used by the map component — the customer passes their order ID
    # and gets back the full tracking record including the dealer's location.
    @action(detail=False, methods=['get'], url_path='my-order/(?P<order_id>[^/.]+)')
    def my_order(self, request, order_id=None):
        tracking = get_object_or_404(
            DeliveryTracking,
            order__id=order_id,
            order__customer=request.user
        )
        return Response(DeliveryTrackingSerializer(tracking, context={'request': request}).data)
