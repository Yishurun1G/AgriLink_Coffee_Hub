from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # Authentication
    path('api/v1/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Users App
    path('api/v1/users/', include('users.urls')),

    path('api/v1/', include('batches.urls')),

    path('api/v1/', include('orders.urls')),

    path('api/v1/communication/', include('communication.urls')),
]