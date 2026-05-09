# reports/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReportViewSet, ReportScheduleViewSet, QuickReportView

router = DefaultRouter()
router.register(r'list', ReportViewSet, basename='report')
router.register(r'schedules', ReportScheduleViewSet, basename='report-schedule')

urlpatterns = [
    path('quick/', QuickReportView.as_view(), name='quick-report'),
    path('types/', ReportViewSet.as_view({'get': 'types'}), name='report-types'),
    path('', include(router.urls)),
]
