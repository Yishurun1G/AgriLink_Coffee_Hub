from rest_framework import generics, permissions
from .models import User
from .serializers import UserSerializer, RegisterSerializer

class RegisterView(generics.CreateAPIView):
    """Endpoint for creating new users"""
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny] # Anyone can sign up
    serializer_class = RegisterSerializer

class UserProfileView(generics.RetrieveUpdateAPIView):
    """Endpoint for a logged-in user to see/update their own profile"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # This ensures the user only ever accesses THEIR own data
        return self.request.user