from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DeliveryTrackingViewSet

router = DefaultRouter()
router.register(r'', DeliveryTrackingViewSet, basename='tracking')

urlpatterns = [
    path('', include(router.urls)),
]