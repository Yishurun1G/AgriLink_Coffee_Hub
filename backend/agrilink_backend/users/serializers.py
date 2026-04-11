# users/serializers.py
from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    """For returning user data to frontend"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'phone_number', 'location']


class RegisterSerializer(serializers.ModelSerializer):
    """Only Dealers and Customers can register themselves"""
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'role', 'phone_number', 'location']

    def validate_role(self, value):
        """Only allow Dealer and Customer during self-registration"""
        allowed_roles = [User.Role.DEALER, User.Role.CUSTOMER]
        if value not in allowed_roles:
            raise serializers.ValidationError("You can only register as Dealer or Customer.")
        return value

    def create(self, validated_data):
        # Pop role safely (with validation already done)
        role = validated_data.pop('role', User.Role.CUSTOMER)

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email'),
            password=validated_data['password'],
            role=role,
            phone_number=validated_data.get('phone_number', ''),
            location=validated_data.get('location', '')
        )
        return user

    def validate_password(self, value):
        if len(value) < 6:
            raise serializers.ValidationError("Password must be at least 6 characters")
        return value