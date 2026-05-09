from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import (
    RegisterView, 
    UserProfileView, 
    UserListView,
    AdminDashboardStatsView,
    AdminUserManagementViewSet,
    AdminActivityLogView,
    AdminReportsView,
)

router = DefaultRouter()
router.register(r'', UserListView, basename='user')

# Admin router
admin_router = DefaultRouter()
admin_router.register(r'users', AdminUserManagementViewSet, basename='admin-user')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', UserProfileView.as_view(), name='user-profile'),
    
    # Admin endpoints
    path('admin/stats/', AdminDashboardStatsView.as_view(), name='admin-stats'),
    path('admin/activity-logs/', AdminActivityLogView.as_view(), name='admin-activity-logs'),
    path('admin/reports/', AdminReportsView.as_view(), name='admin-reports'),
    path('admin/', include(admin_router.urls)),
    
    path('', include(router.urls)),
]