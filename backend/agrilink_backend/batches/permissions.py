# batches/permissions.py
from rest_framework import permissions

class IsDealer(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return getattr(request.user, 'role', None) == 'DEALER'


class IsManager(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return getattr(request.user, 'role', None) == 'MANAGER'


class IsOwnerOrManagerOrCustomer(permissions.BasePermission):
    """
    - Dealers → see only their own batches
    - Managers → see all batches
    - Customers → see only APPROVED batches
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return True  # Allow all authenticated users to list (filtering done in object permission)
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False

        role = getattr(request.user, 'role', None)

        if role in ['MANAGER', 'ADMIN']:
            return True

        if role == 'CUSTOMER':
            return obj.status == 'APPROVED'   # Customers can only see approved batches

        if role == 'DEALER':
            return obj.dealer == request.user   # Dealers see only their own

        return False