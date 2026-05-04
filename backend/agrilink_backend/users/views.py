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
    """Used by chat to fetch available users by role"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, 'role', '').upper()

        if role == 'DEALER':
            # dealers can only message managers
            return User.objects.filter(role='MANAGER')

        if role == 'MANAGER':
            # managers can message dealers, other managers, and admins
            return User.objects.filter(
                role__in=['DEALER', 'MANAGER', 'ADMIN']
            ).exclude(id=user.id)

        if role == 'ADMIN' or user.is_staff:
            # admins can message managers and dealers
            return User.objects.filter(
                role__in=['MANAGER', 'DEALER']
            ).exclude(id=user.id)

        return User.objects.none()