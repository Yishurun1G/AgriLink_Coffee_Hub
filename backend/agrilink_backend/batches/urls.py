# batches/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BatchViewSet

router = DefaultRouter()
router.register(r'batches', BatchViewSet, basename='batch')

urlpatterns = [
    path('', include(router.urls)),
    
    # Extra custom routes (if needed later)
    # path('my-batches/', BatchViewSet.as_view({'get': 'my_batches'}), name='my-batches'),
]