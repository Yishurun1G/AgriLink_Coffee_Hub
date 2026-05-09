from rest_framework import generics, permissions, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q, Sum
from django.utils import timezone
from datetime import timedelta
from .models import User
from .serializers import (
    UserSerializer, 
    RegisterSerializer, 
    AdminUserCreateSerializer,
    AdminUserUpdateSerializer
)
from .permissions import IsAdminUser


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserListView(viewsets.ReadOnlyModelViewSet):
    """Used by chat to fetch available users by role, and by managers to fetch dealers"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, 'role', '').upper()
        
        # Check if a specific role filter is requested (e.g., ?role=DEALER)
        role_filter = self.request.query_params.get('role', None)
        
        # If manager/admin requests a specific role, return all users with that role
        if role_filter and role in ['MANAGER', 'ADMIN']:
            queryset = User.objects.filter(role__iexact=role_filter)
            print(f"[DEBUG] Role filter request: {role_filter}, found {queryset.count()} users")
            return queryset

        # Default behavior for chat — filter by who can message whom
        # IMPORTANT: Customers should NEVER appear in any chat user list
        from django.db.models import Q
        
        if role == 'DEALER':
            # Dealers can message managers and other dealers (NOT customers)
            queryset = User.objects.filter(
                Q(role__iexact='MANAGER') | Q(role__iexact='DEALER')
            ).exclude(id=user.id).exclude(role__iexact='CUSTOMER')
            
            # Debug: log what we're returning
            print(f"[DEBUG] Dealer {user.username} requesting users for chat")
            for u in queryset:
                print(f"  - {u.username} (role: {u.role})")
            return queryset

        if role == 'MANAGER':
            # Managers can message dealers, other managers, and admins (NOT customers)
            queryset = User.objects.filter(
                Q(role__iexact='DEALER') | Q(role__iexact='MANAGER') | Q(role__iexact='ADMIN')
            ).exclude(id=user.id).exclude(role__iexact='CUSTOMER')
            
            print(f"[DEBUG] Manager {user.username} requesting users for chat")
            for u in queryset:
                print(f"  - {u.username} (role: {u.role})")
            return queryset

        if role == 'ADMIN' or user.is_staff:
            # Admins can message managers, dealers, and other admins (NOT customers)
            queryset = User.objects.filter(
                Q(role__iexact='MANAGER') | Q(role__iexact='DEALER') | Q(role__iexact='ADMIN')
            ).exclude(id=user.id).exclude(role__iexact='CUSTOMER')
            
            print(f"[DEBUG] Admin {user.username} requesting users for chat")
            for u in queryset:
                print(f"  - {u.username} (role: {u.role})")
            return queryset

        print(f"[DEBUG] User {user.username} with role {role} - no users available")
        return User.objects.none()


# ═══════════════════════════════════════════════════════════════════════════
# ADMIN VIEWS
# ═══════════════════════════════════════════════════════════════════════════

class AdminDashboardStatsView(generics.GenericAPIView):
    """
    GET /api/admin/stats/
    Returns dashboard statistics for admin overview
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        from batches.models import Batch
        from orders.models import Order
        from communication.models import Thread, Message
        
        # User counts by role
        total_users = User.objects.count()
        total_admins = User.objects.filter(role='ADMIN').count()
        total_managers = User.objects.filter(role='MANAGER').count()
        total_dealers = User.objects.filter(role='DEALER').count()
        total_customers = User.objects.filter(role='CUSTOMER').count()
        
        # Active users (logged in within last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        active_users = User.objects.filter(last_login__gte=thirty_days_ago).count()
        
        # Batch statistics
        total_batches = Batch.objects.count()
        pending_batches = Batch.objects.filter(status='PENDING').count()
        approved_batches = Batch.objects.filter(status='APPROVED').count()
        rejected_batches = Batch.objects.filter(status='REJECTED').count()
        
        # Order statistics
        total_orders = Order.objects.count()
        pending_orders = Order.objects.filter(status='PENDING').count()
        confirmed_orders = Order.objects.filter(status='CONFIRMED').count()
        shipped_orders = Order.objects.filter(status='SHIPPED').count()
        delivered_orders = Order.objects.filter(status='DELIVERED').count()
        cancelled_orders = Order.objects.filter(status='CANCELLED').count()
        
        # Total coffee quantity
        total_coffee_kg = Batch.objects.filter(status='APPROVED').aggregate(
            total=Sum('quantity_kg')
        )['total'] or 0
        
        # Communication stats
        total_threads = Thread.objects.count()
        total_messages = Message.objects.count()
        unresolved_threads = Thread.objects.filter(is_resolved=False).count()
        
        # Recent activity (last 7 days)
        seven_days_ago = timezone.now() - timedelta(days=7)
        new_users_week = User.objects.filter(date_joined__gte=seven_days_ago).count()
        new_batches_week = Batch.objects.filter(created_at__gte=seven_days_ago).count()
        new_orders_week = Order.objects.filter(created_at__gte=seven_days_ago).count()
        
        return Response({
            'users': {
                'total': total_users,
                'admins': total_admins,
                'managers': total_managers,
                'dealers': total_dealers,
                'customers': total_customers,
                'active': active_users,
                'new_this_week': new_users_week,
            },
            'batches': {
                'total': total_batches,
                'pending': pending_batches,
                'approved': approved_batches,
                'rejected': rejected_batches,
                'new_this_week': new_batches_week,
            },
            'orders': {
                'total': total_orders,
                'pending': pending_orders,
                'confirmed': confirmed_orders,
                'shipped': shipped_orders,
                'delivered': delivered_orders,
                'cancelled': cancelled_orders,
                'new_this_week': new_orders_week,
            },
            'coffee': {
                'total_kg': float(total_coffee_kg),
            },
            'communication': {
                'total_threads': total_threads,
                'total_messages': total_messages,
                'unresolved_threads': unresolved_threads,
            }
        })


class AdminUserManagementViewSet(viewsets.ModelViewSet):
    """
    Admin-only viewset for full user CRUD operations
    GET    /api/admin/users/          - List all users
    POST   /api/admin/users/          - Create new user (any role)
    GET    /api/admin/users/{id}/     - Get user details
    PUT    /api/admin/users/{id}/     - Update user
    DELETE /api/admin/users/{id}/     - Delete user
    POST   /api/admin/users/{id}/toggle_active/  - Suspend/activate user
    POST   /api/admin/users/{id}/reset_password/ - Reset user password
    """
    permission_classes = [IsAdminUser]
    queryset = User.objects.all().order_by('-date_joined')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AdminUserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return AdminUserUpdateSerializer
        return UserSerializer
    
    def get_queryset(self):
        queryset = User.objects.all().order_by('-date_joined')
        
        # Filter by role
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role__iexact=role)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Search by username or email
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) | 
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Suspend or activate a user account"""
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        
        return Response({
            'message': f'User {"activated" if user.is_active else "suspended"} successfully',
            'is_active': user.is_active
        })
    
    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """Reset user password"""
        user = self.get_object()
        new_password = request.data.get('new_password')
        
        if not new_password:
            return Response(
                {'error': 'new_password is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(new_password) < 6:
            return Response(
                {'error': 'Password must be at least 6 characters'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.save()
        
        return Response({'message': 'Password reset successfully'})


class AdminActivityLogView(generics.ListAPIView):
    """
    GET /api/admin/activity-logs/
    Returns recent system activity for audit trail
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        from batches.models import Batch
        from orders.models import Order
        from communication.models import Thread, Message
        
        activities = []
        
        # Recent user registrations
        recent_users = User.objects.order_by('-date_joined')[:10]
        for user in recent_users:
            activities.append({
                'type': 'user_registered',
                'description': f'New {user.role.lower()} registered: {user.username}',
                'timestamp': user.date_joined,
                'user': user.username,
                'user_role': user.role,
            })
        
        # Recent batches
        recent_batches = Batch.objects.order_by('-created_at')[:10]
        for batch in recent_batches:
            activities.append({
                'type': 'batch_created',
                'description': f'Batch created: {batch.coffee_type} from {batch.origin}',
                'timestamp': batch.created_at,
                'user': batch.dealer.username if batch.dealer else 'Unknown',
                'user_role': 'DEALER',
                'status': batch.status,
            })
        
        # Recent orders
        recent_orders = Order.objects.select_related('customer').order_by('-created_at')[:10]
        for order in recent_orders:
            activities.append({
                'type': 'order_placed',
                'description': f'Order #{order.id} placed: {order.quantity_kg}kg',
                'timestamp': order.created_at,
                'user': order.customer.username if order.customer else 'Unknown',
                'user_role': 'CUSTOMER',
                'status': order.status,
            })
        
        # Sort all activities by timestamp
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        
        # Return top 50
        return Response(activities[:50])


class AdminReportsView(generics.GenericAPIView):
    """
    GET /api/admin/reports/
    Returns analytics data for charts and reports
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        from batches.models import Batch
        from orders.models import Order
        
        # Users by role (for pie chart)
        users_by_role = User.objects.values('role').annotate(count=Count('id'))
        
        # Batches by status (for pie chart)
        batches_by_status = Batch.objects.values('status').annotate(count=Count('id'))
        
        # Orders by status (for pie chart)
        orders_by_status = Order.objects.values('status').annotate(count=Count('id'))
        
        # Coffee types distribution
        coffee_by_type = Batch.objects.filter(status='APPROVED').values('coffee_type').annotate(
            count=Count('id'),
            total_kg=Sum('quantity_kg')
        )
        
        # Monthly trends (last 6 months)
        six_months_ago = timezone.now() - timedelta(days=180)
        
        # Group by month
        from django.db.models.functions import TruncMonth
        
        monthly_users = User.objects.filter(
            date_joined__gte=six_months_ago
        ).annotate(
            month=TruncMonth('date_joined')
        ).values('month').annotate(count=Count('id')).order_by('month')
        
        monthly_batches = Batch.objects.filter(
            created_at__gte=six_months_ago
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(count=Count('id')).order_by('month')
        
        monthly_orders = Order.objects.filter(
            created_at__gte=six_months_ago
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(count=Count('id')).order_by('month')
        
        # Top dealers by batch count
        top_dealers = Batch.objects.values(
            'dealer__username', 'dealer__id'
        ).annotate(
            batch_count=Count('id'),
            total_kg=Sum('quantity_kg')
        ).order_by('-batch_count')[:10]
        
        # Top customers by order count
        top_customers = Order.objects.values(
            'customer__username', 'customer__id'
        ).annotate(
            order_count=Count('id'),
            total_kg=Sum('quantity_kg')
        ).order_by('-order_count')[:10]
        
        return Response({
            'users_by_role': list(users_by_role),
            'batches_by_status': list(batches_by_status),
            'orders_by_status': list(orders_by_status),
            'coffee_by_type': list(coffee_by_type),
            'monthly_trends': {
                'users': list(monthly_users),
                'batches': list(monthly_batches),
                'orders': list(monthly_orders),
            },
            'top_dealers': list(top_dealers),
            'top_customers': list(top_customers),
        })
