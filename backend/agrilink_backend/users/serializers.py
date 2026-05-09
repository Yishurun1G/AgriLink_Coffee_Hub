# users/serializers.py
from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    """For returning user data to frontend"""
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'phone_number', 'location', 'is_active', 'last_login', 'date_joined']

    def get_role(self, obj):
        return obj.role.upper() if obj.role else obj.role


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


class AdminUserCreateSerializer(serializers.ModelSerializer):
    """Admin can create any type of user including managers and admins"""
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'role', 'phone_number', 'location', 'first_name', 'last_name']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        return user

    def validate_password(self, value):
        if len(value) < 6:
            raise serializers.ValidationError("Password must be at least 6 characters")
        return value


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """Admin can update user details"""
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['username', 'email', 'role', 'phone_number', 'location', 'first_name', 'last_name', 'is_active', 'password']

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance