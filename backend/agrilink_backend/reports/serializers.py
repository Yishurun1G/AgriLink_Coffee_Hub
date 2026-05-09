# reports/serializers.py
from rest_framework import serializers
from .models import Report, ReportSchedule
from users.serializers import UserSerializer


class ReportSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Report
        fields = [
            'id',
            'title',
            'report_type',
            'report_type_display',
            'description',
            'created_by',
            'created_by_username',
            'start_date',
            'end_date',
            'data',
            'status',
            'status_display',
            'file',
            'created_at',
            'updated_at',
            'completed_at',
            'error_message',
        ]
        read_only_fields = ['created_by', 'status', 'completed_at', 'error_message']


class ReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = [
            'title',
            'report_type',
            'description',
            'start_date',
            'end_date',
        ]
    
    def validate(self, data):
        """Validate report data"""
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        # Ensure dates are date objects, not strings
        if isinstance(start_date, str):
            from datetime import datetime
            data['start_date'] = datetime.strptime(start_date, '%Y-%m-%d').date()
        
        if isinstance(end_date, str):
            from datetime import datetime
            data['end_date'] = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Validate date range
        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError("Start date must be before end date")
        
        return data


class ReportScheduleSerializer(serializers.ModelSerializer):
    recipients_details = UserSerializer(source='recipients', many=True, read_only=True)
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    frequency_display = serializers.CharField(source='get_frequency_display', read_only=True)
    
    class Meta:
        model = ReportSchedule
        fields = [
            'id',
            'title',
            'report_type',
            'report_type_display',
            'recipients',
            'recipients_details',
            'frequency',
            'frequency_display',
            'day_of_week',
            'day_of_month',
            'is_active',
            'last_run',
            'next_run',
            'created_at',
            'updated_at',
        ]
