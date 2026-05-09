#!/usr/bin/env python
"""
Quick script to diagnose and fix reports module issues
Run with: python fix_reports.py
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.core.management import call_command
from django.db import connection
from users.models import User
from reports.models import Report

def check_database_tables():
    """Check if reports tables exist"""
    print("\n" + "="*60)
    print("CHECKING DATABASE TABLES")
    print("="*60)
    
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name LIKE 'reports_%'
        """)
        tables = cursor.fetchall()
        
        if tables:
            print("✓ Reports tables found:")
            for table in tables:
                print(f"  - {table[0]}")
            return True
        else:
            print("✗ No reports tables found!")
            return False

def check_migrations():
    """Check migration status"""
    print("\n" + "="*60)
    print("CHECKING MIGRATIONS")
    print("="*60)
    
    try:
        call_command('showmigrations', 'reports', '--plan')
        return True
    except Exception as e:
        print(f"✗ Error checking migrations: {e}")
        return False

def run_migrations():
    """Run migrations"""
    print("\n" + "="*60)
    print("RUNNING MIGRATIONS")
    print("="*60)
    
    try:
        print("\nCreating migrations...")
        call_command('makemigrations', 'reports')
        
        print("\nApplying migrations...")
        call_command('migrate', 'reports')
        
        print("✓ Migrations completed successfully!")
        return True
    except Exception as e:
        print(f"✗ Error running migrations: {e}")
        return False

def check_admin_users():
    """Check for admin/manager users"""
    print("\n" + "="*60)
    print("CHECKING ADMIN/MANAGER USERS")
    print("="*60)
    
    admins = User.objects.filter(role='ADMIN')
    managers = User.objects.filter(role='MANAGER')
    
    print(f"\nAdmins: {admins.count()}")
    for admin in admins:
        print(f"  - {admin.username} (ID: {admin.id})")
    
    print(f"\nManagers: {managers.count()}")
    for manager in managers:
        print(f"  - {manager.username} (ID: {manager.id})")
    
    if admins.count() == 0 and managers.count() == 0:
        print("\n✗ No admin or manager users found!")
        print("  You need at least one admin or manager to create reports.")
        return False
    
    return True

def test_report_creation():
    """Test creating a report"""
    print("\n" + "="*60)
    print("TESTING REPORT CREATION")
    print("="*60)
    
    try:
        # Get first admin or manager
        user = User.objects.filter(role__in=['ADMIN', 'MANAGER']).first()
        
        if not user:
            print("✗ No admin/manager user found for testing")
            return False
        
        print(f"\nUsing user: {user.username} (Role: {user.role})")
        
        # Create test report
        from datetime import date, timedelta
        from reports.services import ReportGenerator
        
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
        
        print(f"Date range: {start_date} to {end_date}")
        
        report = Report.objects.create(
            title="Test Sales Report",
            report_type=Report.ReportType.SALES,
            description="Automated test report",
            created_by=user,
            start_date=start_date,
            end_date=end_date,
            status=Report.Status.GENERATING
        )
        
        print(f"✓ Report created: ID={report.id}")
        
        # Generate report data
        print("Generating report data...")
        generator = ReportGenerator(start_date, end_date)
        report_data = generator.generate_report(report.report_type)
        
        report.data = report_data
        report.mark_completed()
        
        print("✓ Report data generated successfully!")
        print(f"\nReport summary:")
        if 'summary' in report_data:
            for key, value in report_data['summary'].items():
                print(f"  {key}: {value}")
        
        # Clean up
        print(f"\nCleaning up test report...")
        report.delete()
        print("✓ Test report deleted")
        
        return True
        
    except Exception as e:
        import traceback
        print(f"✗ Error testing report creation:")
        print(traceback.format_exc())
        return False

def main():
    """Main diagnostic and fix routine"""
    print("\n" + "="*60)
    print("REPORTS MODULE DIAGNOSTIC AND FIX TOOL")
    print("="*60)
    
    # Step 1: Check if tables exist
    tables_exist = check_database_tables()
    
    # Step 2: Check migrations
    check_migrations()
    
    # Step 3: Run migrations if needed
    if not tables_exist:
        print("\n⚠ Tables missing. Running migrations...")
        if not run_migrations():
            print("\n✗ Failed to run migrations. Please check errors above.")
            return
        
        # Recheck tables
        tables_exist = check_database_tables()
    
    # Step 4: Check for admin users
    has_admins = check_admin_users()
    
    # Step 5: Test report creation
    if tables_exist and has_admins:
        test_report_creation()
    
    print("\n" + "="*60)
    print("DIAGNOSTIC COMPLETE")
    print("="*60)
    print("\nIf all checks passed, try creating a report from the frontend.")
    print("If issues persist, check the Django console for detailed error logs.")
    print("\n")

if __name__ == '__main__':
    main()
