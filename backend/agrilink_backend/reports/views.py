# reports/views.py
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.utils import timezone
from datetime import datetime, date
from .models import Report, ReportSchedule
from .serializers import (
    ReportSerializer,
    ReportCreateSerializer,
    ReportScheduleSerializer
)
from .services import ReportGenerator
from users.permissions import IsAdminUser
import traceback
import logging

logger = logging.getLogger(__name__)


class ReportViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing reports.
    Managers and Admins can create and view reports.
    """
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ReportCreateSerializer
        return ReportSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Admins can see all reports
        if hasattr(user, 'role') and (user.role == 'ADMIN' or user.is_staff):
            return Report.objects.all()
        
        # Managers can see their own reports
        if hasattr(user, 'role') and user.role == 'MANAGER':
            return Report.objects.filter(created_by=user)
        
        # Others can't access reports
        return Report.objects.none()
    
    def create(self, request, *args, **kwargs):
        """Override create to handle report generation and return proper response"""
        user = request.user
        
        logger.info(f"[REPORT CREATE] User: {user.username}")
        logger.info(f"[REPORT CREATE] User has role attr: {hasattr(user, 'role')}")
        
        # Check if user has role attribute
        if not hasattr(user, 'role'):
            from rest_framework.exceptions import PermissionDenied
            logger.error(f"[REPORT CREATE] User has no role attribute")
            raise PermissionDenied("User role not configured")
        
        logger.info(f"[REPORT CREATE] User role: {user.role}")
        
        # Check if user has permission to create reports
        if user.role not in ['ADMIN', 'MANAGER']:
            from rest_framework.exceptions import PermissionDenied
            logger.error(f"[REPORT CREATE] Permission denied for role: {user.role}")
            raise PermissionDenied("Only admins and managers can create reports")
        
        # Validate input data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Create the report instance
            report = serializer.save(
                created_by=user,
                status=Report.Status.GENERATING
            )
            
            logger.info(f"[REPORT CREATE] Report created: {report.id}, Type: {report.report_type}")
            logger.info(f"[REPORT CREATE] Date range: {report.start_date} to {report.end_date}")
            
            # Generate report data
            generator = ReportGenerator(
                start_date=report.start_date,
                end_date=report.end_date
            )
            
            logger.info(f"[REPORT CREATE] Generating report data...")
            report_data = generator.generate_report(report.report_type)
            
            # Save report data
            report.data = report_data
            report.mark_completed()
            
            logger.info(f"[REPORT CREATE] Report {report.id} completed successfully")
            
            # Return the completed report
            response_serializer = ReportSerializer(report)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            error_details = f"{str(e)}\n{traceback.format_exc()}"
            logger.error(f"[REPORT CREATE] Report generation failed: {error_details}")
            
            # Try to mark report as failed if it was created
            try:
                report.mark_failed(error_details)
            except:
                pass
            
            # Return error response
            return Response(
                {'error': str(e), 'details': error_details},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def types(self, request):
        """Get available report types"""
        types = [
            {'value': choice[0], 'label': choice[1]}
            for choice in Report.ReportType.choices
        ]
        return Response(types)
    
    @action(detail=True, methods=['post'])
    def regenerate(self, request, pk=None):
        """Regenerate an existing report"""
        report = self.get_object()
        
        try:
            report.status = Report.Status.GENERATING
            report.save()
            
            # Generate report data
            generator = ReportGenerator(
                start_date=report.start_date,
                end_date=report.end_date
            )
            
            report_data = generator.generate_report(report.report_type)
            
            # Save report data
            report.data = report_data
            report.mark_completed()
            
            serializer = self.get_serializer(report)
            return Response(serializer.data)
            
        except Exception as e:
            report.mark_failed(str(e))
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ReportScheduleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing scheduled reports.
    Only admins can manage scheduled reports.
    """
    permission_classes = [IsAdminUser]
    serializer_class = ReportScheduleSerializer
    queryset = ReportSchedule.objects.all()
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle schedule active status"""
        schedule = self.get_object()
        schedule.is_active = not schedule.is_active
        schedule.save()
        
        serializer = self.get_serializer(schedule)
        return Response(serializer.data)


class QuickReportView(generics.GenericAPIView):
    """
    Generate quick reports without saving to database.
    For real-time analytics.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Generate a quick report"""
        report_type = request.data.get('report_type')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        
        if not all([report_type, start_date, end_date]):
            return Response(
                {'error': 'report_type, start_date, and end_date are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check permissions
        user = request.user
        if not hasattr(user, 'role') or user.role not in ['ADMIN', 'MANAGER']:
            return Response(
                {'error': 'Only admins and managers can generate reports'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            generator = ReportGenerator(
                start_date=start_date,
                end_date=end_date
            )
            
            report_data = generator.generate_report(report_type)
            
            return Response({
                'report_type': report_type,
                'start_date': start_date,
                'end_date': end_date,
                'data': report_data,
                'generated_at': timezone.now()
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
