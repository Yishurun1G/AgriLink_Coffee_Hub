from rest_framework import generics, permissions, viewsets
from .models import User
from .serializers import UserSerializer, RegisterSerializer


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