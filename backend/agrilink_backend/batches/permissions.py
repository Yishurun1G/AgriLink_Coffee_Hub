# batches/permissions.py
from rest_framework import permissions

class IsDealer(permissions.BasePermission):
    """
    Only users with role == 'DEALER' can create batches.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return getattr(request.user, 'role', None) == 'DEALER'   # ← Changed to uppercase


class IsManager(permissions.BasePermission):
    """
    Only users with role == 'MANAGER' can approve or reject batches.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return getattr(request.user, 'role', None) == 'MANAGER'   # ← Changed to uppercase


class IsOwnerOrManager(permissions.BasePermission):
    """
    Dealers can only see their own batches.
    Managers can see all batches.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False

        user_role = getattr(request.user, 'role', None)

        # Managers can see and modify any batch
        if user_role == 'MANAGER':
            return True

        # Dealers can only see their own batches
        if user_role == 'DEALER':
            return obj.dealer == request.user

        return False